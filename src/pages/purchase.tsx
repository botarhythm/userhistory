import React, { useState, useEffect } from "react";
import liff from "@line/liff";

const Purchase: React.FC = () => {
  const [lineUserId, setLineUserId] = useState('');
  const [lineDisplayName, setLineDisplayName] = useState('');
  const [itemName, setItemName] = useState('');
  const [memo, setMemo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [productOptions, setProductOptions] = useState<string[]>([]);
  const [isProductLoading, setIsProductLoading] = useState(true);

  const getLiffProfile = async (retry = 10) => {
    setIsProfileLoading(true);
    try {
      await window.liffInitPromise;
      // LIFF認証が完了するまでリトライ
      if (!liff.isLoggedIn()) {
        setMessage("LIFF未ログイン。liff.login()を実行します。");
        liff.login();
        return;
      }
      // 認証済みならプロフィール取得
      const profile = await liff.getProfile();
      setLineUserId(profile.userId);
      setLineDisplayName(profile.displayName);
      setIsProfileLoading(false);
    } catch (error) {
      if (retry > 0) {
        setTimeout(() => getLiffProfile(retry - 1), 300);
      } else {
        const errMsg = "LIFFプロファイル取得エラー: " + (error instanceof Error ? error.message : String(error));
        setMessage(errMsg);
        alert(errMsg);
        console.error(errMsg);
        setIsProfileLoading(false);
      }
    }
  };

  useEffect(() => {
    getLiffProfile();
    const handleVisibility = (_event: Event) => {
      if (document.visibilityState === 'visible') {
        getLiffProfile();
      }
    };
    const handleFocus = (_event: FocusEvent) => {
      getLiffProfile();
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    // 商品リスト取得
    const fetchProducts = async () => {
      setIsProductLoading(true);
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProductOptions([...data.products, 'その他']);
      } catch (e) {
        setProductOptions(['その他']);
      } finally {
        setIsProductLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleRecordPurchase = async () => {
    if (!lineUserId || !lineDisplayName || !itemName) {
      setMessage('商品名とユーザー情報が必須です。');
      return;
    }
    setIsLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/recordPurchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lineUserId,
          lineDisplayName,
          itemName,
          memo,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '購入履歴の記録に失敗しました。');
      }
      const result = await response.json();
      setMessage(result.message || '購入履歴が正常に記録されました！');
      setItemName('');
      setMemo('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました。';
      setMessage(`エラー: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="mb-4 p-2 bg-yellow-100 text-xs rounded flex items-center gap-2 min-h-[32px]">
        {isProfileLoading
          ? (
            <>
              <span className="inline-block w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
              <span>LINE認証中です。しばらくお待ちください</span>
            </>
          )
          : <div>こんにちは、{lineDisplayName} さん</div>
        }
      </div>
      <h1 className="text-2xl font-bold mb-6">購入履歴登録</h1>
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label htmlFor="itemName" className="block text-gray-700 text-sm font-bold mb-2">商品名:</label>
          {isProductLoading ? (
            <div className="text-gray-500 text-sm">商品リスト取得中...</div>
          ) : (
            <>
              <select
                id="itemName"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              >
                <option value="">選択してください</option>
                {productOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {itemName === 'その他' && (
                <input
                  type="text"
                  className="mt-2 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="商品名を入力"
                  onChange={e => setItemName(e.target.value)}
                />
              )}
            </>
          )}
        </div>
        <div className="mb-6">
          <label htmlFor="memo" className="block text-gray-700 text-sm font-bold mb-2">数量、豆・粉、風味や感想など自由にご記入ください</label>
          <textarea
            id="memo"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24 resize-none"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="例: 1袋、豆のまま／酸味が爽やかで美味しい／次回は細挽きで試したい など"
          ></textarea>
        </div>
        <button
          onClick={handleRecordPurchase}
          disabled={isLoading || !lineUserId || !itemName}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? '記録中...' : '購入を記録'}
        </button>
        {message && <p className="mt-4 text-center text-sm text-gray-600">{message}</p>}
      </div>
    </div>
  );
};

export default Purchase;
