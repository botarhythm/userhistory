import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiff } from '../contexts/LiffContext';
import { usePageTitle } from '../hooks/usePageTitle';

interface Product {
  id: string;
  name: string;
  price?: number;
  category?: string;
  description?: string;
}

const PurchasePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useLiff();

  // ページタイトルを設定
  usePageTitle('購入メモ - Botarhythm Coffee Roaster');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [memo, setMemo] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // 商品一覧を取得
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      console.log('Fetching products...');
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        console.log('Products fetched:', data);
        setProducts(data.products || []);

        // デバッグ用：商品が取得できない場合はモックデータを使用
        if (data.products.length === 0) {
          console.log('No products found, using mock data for testing');
          const mockProducts = [
            { id: '1', name: 'エチオピア', order: 1, available: true },
            { id: '2', name: 'ケニア', order: 2, available: true },
            { id: '3', name: 'コロンビア', order: 3, available: true },
            { id: '4', name: 'グアテマラ', order: 4, available: true },
            { id: '5', name: 'ブラジル', order: 5, available: true },
            { id: '6', name: 'インドネシア', order: 6, available: true },
            { id: '7', name: 'ニカラグア', order: 7, available: true },
            { id: '8', name: 'コスタリカ', order: 8, available: true },
            { id: '9', name: 'タンザニア', order: 9, available: true },
            { id: '10', name: 'Blend フローラルコード', order: 10, available: true },
            { id: '11', name: 'Blend リーブスメモリーズ', order: 11, available: true },
            { id: '12', name: 'Blend サムグラウンズ', order: 12, available: true },
            { id: '13', name: 'Blend ディープルーツ', order: 13, available: true },
            { id: '14', name: 'Blend タッチザアース', order: 14, available: true }
          ];
          setProducts([...mockProducts, { id: 'other', name: 'その他', order: 999, available: true }]);
        } else {
          // Notionから取得した商品に「その他」を追加
          setProducts([...data.products, { id: 'other', name: 'その他', order: 999, available: true }]);
        }
      } else {
        console.error('Failed to fetch products:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  // 商品選択
  const handleProductChange = (productId: string) => {
    setSelectedProduct(productId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoggedIn || !user) {
      alert('LINEログインが必要です');
      return;
    }

    // バリデーション
    if (!selectedProduct) {
      alert('商品を選択してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedProductData = products.find(p => p.id === selectedProduct);

      // 商品データの確認
      if (!selectedProductData) {
        alert('商品データが見つかりません');
        return;
      }

      const response = await fetch('/api/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lineUid: user.userId,
          displayName: user.displayName,
          items: [{
            name: selectedProductData.name,
            quantity: 1,
            price: 0
          }],
          total: 1,
          memo: memo.trim() || undefined
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Purchase success response:', result);

        // フォームをリセット
        setSelectedProduct('');
        setMemo('');

        // 成功メッセージを表示
        setShowSuccessMessage(true);

        // 3秒後に履歴ページに遷移
        setTimeout(() => {
          navigate('/history');
        }, 2000);
      } else {
        const error = await response.json();
        console.error('Purchase error response:', error);
        alert(`エラー: ${error.error || '購入履歴の記録に失敗しました'}`);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('購入履歴の記録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              LINEログインが必要です
            </h1>
            <p className="text-gray-600 mb-4">
              購入メモを記録するにはLINEアカウントでログインしてください
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 成功メッセージ表示
  if (showSuccessMessage) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 text-center max-w-md mx-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            記録完了
          </h2>
          <p className="text-gray-600 mb-6">
            購入メモを記録しました
          </p>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
            <span className="ml-2 text-sm text-gray-500">履歴ページに移動中...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-green-700 to-green-600 p-6 text-center">
          <h1 className="text-2xl font-bold text-white mb-1">
            購入メモ
          </h1>
          <p className="text-green-100 text-sm">
            本日のコーヒーを記録しましょう
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 商品選択 */}
            <div className="group">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                商品を選択
              </label>
              <div className="relative">
                <select
                  value={selectedProduct}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all text-base appearance-none cursor-pointer hover:bg-gray-100 font-medium"
                >
                  <option value="">商品を選択してください</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* メモ入力 */}
            <div className="group">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                メモ
              </label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="味の感想や備考を入力..."
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all text-base resize-none font-medium placeholder-gray-400"
              />
            </div>

            {/* 送信ボタン */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-bold text-lg"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  記録中...
                </span>
              ) : (
                '記録する'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PurchasePage;
