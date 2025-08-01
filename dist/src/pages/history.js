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
const History = () => {
    const [lineUserId, setLineUserId] = (0, react_1.useState)('');
    const [histories, setHistories] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    const [editMemoId, setEditMemoId] = (0, react_1.useState)(null);
    const [editMemoValue, setEditMemoValue] = (0, react_1.useState)('');
    const [savingMemoId, setSavingMemoId] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const getLiffProfileAndFetchHistory = async () => {
            setIsLoading(true);
            setError('');
            try {
                await window.liffInitPromise;
                if (liff_1.default.isLoggedIn()) {
                    const profile = await liff_1.default.getProfile();
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
    return (<div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-4">履歴一覧</h1>
      {isLoading ? (<p>読み込み中...</p>) : error ? (<p className="text-red-500">{error}</p>) : histories.length === 0 ? (<p>履歴がありません。</p>) : (<div className="w-full max-w-md bg-white p-4 rounded shadow">
          <ul>
            {histories.map((h) => (<li key={h.id} className="border-b py-2">
                <div className="text-xs text-gray-500 mb-1">{h.date && new Date(h.date).toLocaleString()}</div>
                <div className="font-bold">{h.itemName}</div>
                <div className="text-sm mt-1">
                  <label className="block text-gray-700 text-xs mb-1">数量、豆・粉、風味や感想など自由にご記入ください</label>
                  {editMemoId === h.id ? (<div className="flex gap-2 items-center">
                      <textarea className="border rounded p-1 w-full text-sm" value={editMemoValue} onChange={e => setEditMemoValue(e.target.value)} placeholder="例: 1袋、豆のまま／酸味が爽やかで美味しい／次回は細挽きで試したい など" rows={2}/>
                      <button className="bg-blue-500 text-white px-2 py-1 rounded text-xs" onClick={() => handleSave(h.id)} disabled={savingMemoId === h.id}>{savingMemoId === h.id ? '保存中...' : '保存'}</button>
                      <button className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs" onClick={() => setEditMemoId(null)} disabled={savingMemoId === h.id}>キャンセル</button>
                    </div>) : (<div className="flex gap-2 items-center">
                      <span>{h.memo || <span className="text-gray-400">（未記入）</span>}</span>
                      <button className="bg-yellow-400 text-white px-2 py-1 rounded text-xs" onClick={() => handleEdit(h.id, h.memo)}>編集</button>
                    </div>)}
                </div>
              </li>))}
          </ul>
        </div>)}
    </div>);
};
exports.default = History;
//# sourceMappingURL=history.js.map