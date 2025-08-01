import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import liff from "@line/liff";
const History = () => {
    const [lineUserId, setLineUserId] = useState('');
    const [histories, setHistories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [editMemoId, setEditMemoId] = useState(null);
    const [editMemoValue, setEditMemoValue] = useState('');
    const [savingMemoId, setSavingMemoId] = useState(null);
    useEffect(() => {
        const getLiffProfileAndFetchHistory = async () => {
            setIsLoading(true);
            setError('');
            try {
                await window.liffInitPromise;
                if (liff.isLoggedIn()) {
                    const profile = await liff.getProfile();
                    setLineUserId(profile.userId);
                    // 履歴取得
                    const res = await fetch(`/api/getHistory?lineUserId=${profile.userId}`);
                    if (!res.ok)
                        throw new Error('履歴取得に失敗しました');
                    const data = await res.json();
                    setHistories(data.histories || []);
                }
                else {
                    setError('LIFF未ログインです');
                }
            }
            catch (e) {
                setError(e.message || '不明なエラー');
            }
            finally {
                setIsLoading(false);
            }
        };
        getLiffProfileAndFetchHistory();
    }, []);
    const handleEdit = (id, currentMemo) => {
        setEditMemoId(id);
        setEditMemoValue(currentMemo || '');
    };
    const handleSave = async (id) => {
        setSavingMemoId(id);
        try {
            const res = await fetch('/api/updateMemo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ historyId: id, memo: editMemoValue }),
            });
            if (!res.ok)
                throw new Error('メモ更新に失敗しました');
            // ローカル状態も更新
            setHistories(histories.map(h => h.id === id ? { ...h, memo: editMemoValue } : h));
            setEditMemoId(null);
        }
        catch (e) {
            alert(e instanceof Error ? e.message : 'メモ更新エラー');
        }
        finally {
            setSavingMemoId(null);
        }
    };
    return (_jsxs("div", { className: "flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "\u5C65\u6B74\u4E00\u89A7" }), isLoading ? (_jsx("p", { children: "\u8AAD\u307F\u8FBC\u307F\u4E2D..." })) : error ? (_jsx("p", { className: "text-red-500", children: error })) : histories.length === 0 ? (_jsx("p", { children: "\u5C65\u6B74\u304C\u3042\u308A\u307E\u305B\u3093\u3002" })) : (_jsx("div", { className: "w-full max-w-md bg-white p-4 rounded shadow", children: _jsx("ul", { children: histories.map((h) => (_jsxs("li", { className: "border-b py-2", children: [_jsx("div", { className: "text-xs text-gray-500 mb-1", children: h.date && new Date(h.date).toLocaleString() }), _jsx("div", { className: "font-bold", children: h.itemName }), _jsxs("div", { className: "text-sm mt-1", children: [_jsx("label", { className: "block text-gray-700 text-xs mb-1", children: "\u6570\u91CF\u3001\u8C46\u30FB\u7C89\u3001\u98A8\u5473\u3084\u611F\u60F3\u306A\u3069\u81EA\u7531\u306B\u3054\u8A18\u5165\u304F\u3060\u3055\u3044" }), editMemoId === h.id ? (_jsxs("div", { className: "flex gap-2 items-center", children: [_jsx("textarea", { className: "border rounded p-1 w-full text-sm", value: editMemoValue, onChange: e => setEditMemoValue(e.target.value), placeholder: "\u4F8B: 1\u888B\u3001\u8C46\u306E\u307E\u307E\uFF0F\u9178\u5473\u304C\u723D\u3084\u304B\u3067\u7F8E\u5473\u3057\u3044\uFF0F\u6B21\u56DE\u306F\u7D30\u633D\u304D\u3067\u8A66\u3057\u305F\u3044 \u306A\u3069", rows: 2 }), _jsx("button", { className: "bg-blue-500 text-white px-2 py-1 rounded text-xs", onClick: () => handleSave(h.id), disabled: savingMemoId === h.id, children: savingMemoId === h.id ? '保存中...' : '保存' }), _jsx("button", { className: "bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs", onClick: () => setEditMemoId(null), disabled: savingMemoId === h.id, children: "\u30AD\u30E3\u30F3\u30BB\u30EB" })] })) : (_jsxs("div", { className: "flex gap-2 items-center", children: [_jsx("span", { children: h.memo || _jsx("span", { className: "text-gray-400", children: "\uFF08\u672A\u8A18\u5165\uFF09" }) }), _jsx("button", { className: "bg-yellow-400 text-white px-2 py-1 rounded text-xs", onClick: () => handleEdit(h.id, h.memo), children: "\u7DE8\u96C6" })] }))] })] }, h.id))) }) }))] }));
};
export default History;
