"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const liff_1 = __importDefault(require("@line/liff"));
const Purchase = () => {
    const [lineUserId, setLineUserId] = (0, react_1.useState)('');
    const [lineDisplayName, setLineDisplayName] = (0, react_1.useState)('');
    const [itemName, setItemName] = (0, react_1.useState)('');
    const [memo, setMemo] = (0, react_1.useState)('');
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [message, setMessage] = (0, react_1.useState)('');
    const [isProfileLoading, setIsProfileLoading] = (0, react_1.useState)(true);
    const [productOptions, setProductOptions] = (0, react_1.useState)([]);
    const [isProductLoading, setIsProductLoading] = (0, react_1.useState)(true);
    const getLiffProfile = async (retry = 10) => {
        setIsProfileLoading(true);
        try {
            await window.liffInitPromise;
            // LIFF認証が完了するまでリトライ
            if (!liff_1.default.isLoggedIn()) {
                setMessage("LIFF未ログイン。liff.login()を実行します。");
                liff_1.default.login();
                return;
            }
            // 認証済みならプロフィール取得
            const profile = await liff_1.default.getProfile();
            setLineUserId(profile.userId);
            setLineDisplayName(profile.displayName);
            setIsProfileLoading(false);
        }
        catch (error) {
            if (retry > 0) {
                setTimeout(() => getLiffProfile(retry - 1), 300);
            }
            else {
                const errMsg = "LIFFプロファイル取得エラー: " + (error instanceof Error ? error.message : String(error));
                setMessage(errMsg);
                alert(errMsg);
                console.error(errMsg);
                setIsProfileLoading(false);
            }
        }
    };
    (0, react_1.useEffect)(() => {
        getLiffProfile();
        const handleVisibility = (_event) => {
            if (document.visibilityState === 'visible') {
                getLiffProfile();
            }
        };
        const handleFocus = (_event) => {
            getLiffProfile();
        };
        window.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('focus', handleFocus);
        return () => {
            window.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);
    (0, react_1.useEffect)(() => {
        // 商品リスト取得
        const fetchProducts = async () => {
            setIsProductLoading(true);
            try {
                const res = await fetch('/api/products');
                const data = await res.json();
                setProductOptions([...data.products, 'その他']);
            }
            catch (e) {
                setProductOptions(['その他']);
            }
            finally {
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました。';
            setMessage(`エラー: ${errorMessage}`);
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="mb-4 p-2 bg-yellow-100 text-xs rounded flex items-center gap-2 min-h-[32px]">
        {isProfileLoading
            ? (<>
              <span className="inline-block w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
              <span>LINE認証中です。しばらくお待ちください</span>
            </>)
            : <div>こんにちは、{lineDisplayName} さん</div>}
      </div>
      <h1 className="text-2xl font-bold mb-6">購入履歴登録</h1>
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label htmlFor="itemName" className="block text-gray-700 text-sm font-bold mb-2">商品名:</label>
          {isProductLoading ? (<div className="text-gray-500 text-sm">商品リスト取得中...</div>) : (<>
              <select id="itemName" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value={itemName} onChange={(e) => setItemName(e.target.value)}>
                <option value="">選択してください</option>
                {productOptions.map(option => (<option key={option} value={option}>{option}</option>))}
              </select>
              {itemName === 'その他' && (<input type="text" className="mt-2 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="商品名を入力" onChange={e => setItemName(e.target.value)}/>)}
            </>)}
        </div>
        <div className="mb-6">
          <label htmlFor="memo" className="block text-gray-700 text-sm font-bold mb-2">数量、豆・粉、風味や感想など自由にご記入ください</label>
          <textarea id="memo" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24 resize-none" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="例: 1袋、豆のまま／酸味が爽やかで美味しい／次回は細挽きで試したい など"></textarea>
        </div>
        <button onClick={handleRecordPurchase} disabled={isLoading || !lineUserId || !itemName} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:bg-gray-400 disabled:cursor-not-allowed">
          {isLoading ? '記録中...' : '購入を記録'}
        </button>
        {message && <p className="mt-4 text-center text-sm text-gray-600">{message}</p>}
      </div>
    </div>);
};
exports.default = Purchase;
//# sourceMappingURL=purchase.js.map