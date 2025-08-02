import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiff } from '../contexts/LiffContext';

interface Product {
  id: string;
  name: string;
  price?: number;
  category?: string;
  description?: string;
}

interface PurchaseItem {
  productId?: string;
  name: string;
  quantity: number;
  price?: number;
}

const PurchasePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useLiff();
  const [items, setItems] = useState<PurchaseItem[]>([{ name: '', quantity: 1 }]);
  const [total, setTotal] = useState<number>(0);
  const [memo, setMemo] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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
          setProducts(mockProducts);
        }
      } else {
        console.error('Failed to fetch products:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  // 商品検索
  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      console.log('Searching products for:', query);
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Search results:', data);
        let results = data.products || [];
        
        // デバッグ用：APIから結果が取得できない場合はローカル検索
        if (results.length === 0 && products.length > 0) {
          console.log('No API results, searching local products');
          const lowerQuery = query.toLowerCase();
          results = products.filter(product => 
            product.name.toLowerCase().includes(lowerQuery)
          );
        }
        
        setSearchResults(results);
      } else {
        console.error('Search failed:', response.status);
        // APIが失敗した場合はローカル検索
        const lowerQuery = query.toLowerCase();
        const results = products.filter(product => 
          product.name.toLowerCase().includes(lowerQuery)
        );
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Failed to search products:', error);
      // エラー時もローカル検索
      const lowerQuery = query.toLowerCase();
      const results = products.filter(product => 
        product.name.toLowerCase().includes(lowerQuery)
      );
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  };

  // 商品選択
  const selectProduct = (index: number, product: Product) => {
    console.log('Selecting product:', product, 'for index:', index);
    const newItems = [...items];
    newItems[index] = {
      productId: product.id,
      name: product.name,
      quantity: newItems[index].quantity,
      price: product.price || 0
    };
    setItems(newItems);
    setSearchQuery('');
    setSearchResults([]);
    calculateTotal(newItems);
  };

  const addItem = () => {
    setItems([...items, { name: '', quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      calculateTotal(newItems);
    }
  };

  const updateItem = (index: number, field: keyof PurchaseItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    
    if (field === 'quantity' || field === 'price') {
      calculateTotal(newItems);
    }
  };

  const calculateTotal = (itemList: PurchaseItem[]) => {
    const calculatedTotal = itemList.reduce((sum, item) => {
      const itemPrice = item.price || 0;
      return sum + (itemPrice * item.quantity);
    }, 0);
    setTotal(calculatedTotal);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoggedIn || !user) {
      alert('LINEログインが必要です');
      return;
    }
    
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
          lineUid: user.userId,
          displayName: user.displayName,
          items: items.map(item => ({
            name: item.name.trim(),
            quantity: item.quantity,
            price: item.price || 0
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

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
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
              購入履歴を記録するにはLINEアカウントでログインしてください
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          購入履歴を記録
        </h1>

        {/* ユーザー情報表示 */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="text-sm text-blue-600 mb-1">ログイン中</div>
          <div className="flex items-center space-x-3">
            <img
              className="h-8 w-8 rounded-full"
              src={user.pictureUrl || 'https://via.placeholder.com/32x32'}
              alt={user.displayName}
            />
            <div>
              <div className="font-medium text-gray-900">{user.displayName}</div>
              <div className="text-sm text-gray-600">ID: {user.userId}</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 商品セクション */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">商品</h2>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex gap-2 items-start">
                    <div className="flex-1">
                      {/* 商品検索・選択 */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="商品名を入力または検索"
                          value={item.name}
                          onChange={(e) => {
                            updateItem(index, 'name', e.target.value);
                            setSearchQuery(e.target.value);
                            searchProducts(e.target.value);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        
                        {/* 検索結果ドロップダウン */}
                        {searchResults.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {searchResults.map((product) => (
                              <div
                                key={product.id}
                                onClick={() => selectProduct(index, product)}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium">{product.name}</div>
                                {product.order && (
                                  <div className="text-xs text-gray-500">表示順: {product.order}</div>
                                )}
                                {product.available === false && (
                                  <div className="text-xs text-red-500">販売停止中</div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="w-20">
                      <input
                        type="number"
                        placeholder="数量"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="w-24">
                      <input
                        type="number"
                        placeholder="価格"
                        value={item.price || ''}
                        onChange={(e) => updateItem(index, 'price', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  
                  {/* 商品詳細表示 */}
                  {item.productId && (
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      商品ID: {item.productId}
                    </div>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={addItem}
                className="w-full py-2 text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
              >
                + 商品を追加
              </button>
            </div>
          </div>

          {/* 合計金額 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              合計金額
            </label>
            <input
              type="number"
              value={total}
              onChange={(e) => setTotal(parseInt(e.target.value) || 0)}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* メモ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メモ（任意）
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="特記事項があれば入力してください"
            />
          </div>

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '送信中...' : '購入履歴を記録'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PurchasePage;
