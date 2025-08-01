import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface PurchaseItem {
  name: string;
  quantity: number;
}

const PurchasePage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<PurchaseItem[]>([{ name: '', quantity: 1 }]);
  const [total, setTotal] = useState<number>(0);
  const [memo, setMemo] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addItem = () => {
    setItems([...items, { name: '', quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof PurchaseItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    if (items.some(item => !item.name.trim())) {
      alert('商品名を入力してください');
      return;
    }
    
    if (total <= 0) {
      alert('合計金額を入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lineUid: 'test-user', // 実際のLINE UIDに置き換え
          displayName: 'テストユーザー',
          items: items.map(item => ({
            name: item.name.trim(),
            quantity: item.quantity
          })),
          total: total,
          memo: memo.trim() || undefined
        }),
      });

      if (response.ok) {
        alert('購入履歴を記録しました');
        navigate('/history');
      } else {
        const error = await response.json();
        alert(`エラー: ${error.error || '購入履歴の記録に失敗しました'}`);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('購入履歴の記録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          購入履歴を記録
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 商品セクション */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">商品</h2>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
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
                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="px-2 py-2 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addItem}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + 商品を追加
              </button>
            </div>
          </div>

          {/* 合計セクション */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">合計</h2>
            <input
              type="number"
              min="0"
              placeholder="合計金額"
              value={total}
              onChange={(e) => setTotal(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* メモセクション */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">メモ (任意)</h2>
            <textarea
              placeholder="特記事項があれば入力してください"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '記録中...' : '購入履歴を記録'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PurchasePage;
