import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import liff from "@line/liff";
const Purchase = () => {
    const [lineUserId, setLineUserId] = useState('');
    const [lineDisplayName, setLineDisplayName] = useState('');
    const [itemName, setItemName] = useState('');
    const [memo, setMemo] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isProfileLoading, setIsProfileLoading] = useState(true);
    const [productOptions, setProductOptions] = useState([]);
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
    useEffect(() => {
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
    useEffect(() => {
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
    return (_jsxs("div", { className: "flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4", children: [_jsx("div", { className: "mb-4 p-2 bg-yellow-100 text-xs rounded flex items-center gap-2 min-h-[32px]", children: isProfileLoading
                    ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "inline-block w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" }), _jsx("span", { children: "LINE\u8A8D\u8A3C\u4E2D\u3067\u3059\u3002\u3057\u3070\u3089\u304F\u304A\u5F85\u3061\u304F\u3060\u3055\u3044" })] }))
                    : _jsxs("div", { children: ["\u3053\u3093\u306B\u3061\u306F\u3001", lineDisplayName, " \u3055\u3093"] }) }), _jsx("h1", { className: "text-2xl font-bold mb-6", children: "\u8CFC\u5165\u5C65\u6B74\u767B\u9332" }), _jsxs("div", { className: "w-full max-w-md bg-white p-6 rounded-lg shadow-md", children: [_jsxs("div", { className: "mb-4", children: [_jsx("label", { htmlFor: "itemName", className: "block text-gray-700 text-sm font-bold mb-2", children: "\u5546\u54C1\u540D:" }), isProductLoading ? (_jsx("div", { className: "text-gray-500 text-sm", children: "\u5546\u54C1\u30EA\u30B9\u30C8\u53D6\u5F97\u4E2D..." })) : (_jsxs(_Fragment, { children: [_jsxs("select", { id: "itemName", className: "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline", value: itemName, onChange: (e) => setItemName(e.target.value), children: [_jsx("option", { value: "", children: "\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044" }), productOptions.map(option => (_jsx("option", { value: option, children: option }, option)))] }), itemName === 'その他' && (_jsx("input", { type: "text", className: "mt-2 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline", placeholder: "\u5546\u54C1\u540D\u3092\u5165\u529B", onChange: e => setItemName(e.target.value) }))] }))] }), _jsxs("div", { className: "mb-6", children: [_jsx("label", { htmlFor: "memo", className: "block text-gray-700 text-sm font-bold mb-2", children: "\u6570\u91CF\u3001\u8C46\u30FB\u7C89\u3001\u98A8\u5473\u3084\u611F\u60F3\u306A\u3069\u81EA\u7531\u306B\u3054\u8A18\u5165\u304F\u3060\u3055\u3044" }), _jsx("textarea", { id: "memo", className: "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24 resize-none", value: memo, onChange: (e) => setMemo(e.target.value), placeholder: "\u4F8B: 1\u888B\u3001\u8C46\u306E\u307E\u307E\uFF0F\u9178\u5473\u304C\u723D\u3084\u304B\u3067\u7F8E\u5473\u3057\u3044\uFF0F\u6B21\u56DE\u306F\u7D30\u633D\u304D\u3067\u8A66\u3057\u305F\u3044 \u306A\u3069" })] }), _jsx("button", { onClick: handleRecordPurchase, disabled: isLoading || !lineUserId || !itemName, className: "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:bg-gray-400 disabled:cursor-not-allowed", children: isLoading ? '記録中...' : '購入を記録' }), message && _jsx("p", { className: "mt-4 text-center text-sm text-gray-600", children: message })] })] }));
};
export default Purchase;
