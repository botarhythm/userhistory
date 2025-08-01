import React, { useState } from 'react';

interface UserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

interface PurchaseItem {
  name: string;
  quantity: number;
  price: number;
}

interface PurchaseProps {
  userProfile: UserProfile | null;
}

const Purchase: React.FC<PurchaseProps> = ({ userProfile }) => {
  const [items, setItems] = useState<PurchaseItem[]>([
    { name: '', quantity: 1, price: 0 }
  ]);
  const [memo, setMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const addItem = () => {
    setItems([...items, { name: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof PurchaseItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value } as PurchaseItem;
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile) {
      setMessage({ type: 'error', text: 'ユーザー情報が取得できません' });
      return;
    }

    // バリデーション
    const validItems = items.filter(item => item.name.trim() && item.price > 0);
    if (validItems.length === 0) {
      setMessage({ type: 'error', text: '商品名と価格を入力してください' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lineUid: userProfile.userId,
          displayName: userProfile.displayName,
          items: validItems,
          total: calculateTotal(),
          memo: memo.trim() || undefined,
          timestamp: new Date().toISOString()
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: '購入履歴を記録しました！' });
        setItems([{ name: '', quantity: 1, price: 0 }]);
        setMemo('');
      } else {
        setMessage({ type: 'error', text: result.error || 'エラーが発生しました' });
      }
    } catch (error) {
      console.error('Purchase submission error:', error);
      setMessage({ type: 'error', text: '通信エラーが発生しました' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">購入履歴を記録</h2>
        
        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 商品リスト */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">商品</h3>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="商品名"
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      placeholder="数量"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      placeholder="価格"
                      value={item.price}
                      onChange={(e) => updateItem(index, 'price', parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-sm font-medium text-gray-900">
                      ¥{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <button
              type="button"
              onClick={addItem}
              className="mt-4 flex items-center text-blue-600 hover:text-blue-800"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              商品を追加
            </button>
          </div>

          {/* 合計 */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>合計</span>
              <span className="text-2xl text-blue-600">¥{calculateTotal().toLocaleString()}</span>
            </div>
          </div>

          {/* メモ */}
          <div>
            <label htmlFor="memo" className="block text-sm font-medium text-gray-700 mb-2">
              メモ（任意）
            </label>
            <textarea
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              placeholder="特記事項があれば入力してください"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                送信中...
              </div>
            ) : (
              '購入履歴を記録'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Purchase;
