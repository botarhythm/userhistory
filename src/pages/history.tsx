import React, { useState, useEffect } from "react";
import liff from "@line/liff";

const History: React.FC = () => {
  const [lineUserId, setLineUserId] = useState('');
  const [histories, setHistories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [editMemoId, setEditMemoId] = useState<string | null>(null);
  const [editMemoValue, setEditMemoValue] = useState('');
  const [savingMemoId, setSavingMemoId] = useState<string | null>(null);

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
          if (!res.ok) throw new Error('履歴取得に失敗しました');
          const data = await res.json();
          setHistories(data.histories || []);
        } else {
          setError('LIFF未ログインです');
        }
      } catch (e: any) {
        setError(e.message || '不明なエラー');
      } finally {
        setIsLoading(false);
      }
    };
    getLiffProfileAndFetchHistory();
  }, []);

  const handleEdit = (id: string, currentMemo: string) => {
    setEditMemoId(id);
    setEditMemoValue(currentMemo || '');
  };

  const handleSave = async (id: string) => {
    setSavingMemoId(id);
    try {
      const res = await fetch('/api/updateMemo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ historyId: id, memo: editMemoValue }),
      });
      if (!res.ok) throw new Error('メモ更新に失敗しました');
      // ローカル状態も更新
      setHistories(histories.map(h => h.id === id ? { ...h, memo: editMemoValue } : h));
      setEditMemoId(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'メモ更新エラー');
    } finally {
      setSavingMemoId(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-4">履歴一覧</h1>
      {isLoading ? (
        <p>読み込み中...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : histories.length === 0 ? (
        <p>履歴がありません。</p>
      ) : (
        <div className="w-full max-w-md bg-white p-4 rounded shadow">
          <ul>
            {histories.map((h) => (
              <li key={h.id} className="border-b py-2">
                <div className="text-xs text-gray-500 mb-1">{h.date && new Date(h.date).toLocaleString()}</div>
                <div className="font-bold">{h.itemName}</div>
                <div className="text-sm mt-1">
                  <label className="block text-gray-700 text-xs mb-1">数量、豆・粉、風味や感想など自由にご記入ください</label>
                  {editMemoId === h.id ? (
                    <div className="flex gap-2 items-center">
                      <textarea
                        className="border rounded p-1 w-full text-sm"
                        value={editMemoValue}
                        onChange={e => setEditMemoValue(e.target.value)}
                        placeholder="例: 1袋、豆のまま／酸味が爽やかで美味しい／次回は細挽きで試したい など"
                        rows={2}
                      />
                      <button
                        className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                        onClick={() => handleSave(h.id)}
                        disabled={savingMemoId === h.id}
                      >{savingMemoId === h.id ? '保存中...' : '保存'}</button>
                      <button
                        className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs"
                        onClick={() => setEditMemoId(null)}
                        disabled={savingMemoId === h.id}
                      >キャンセル</button>
                    </div>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <span>{h.memo || <span className="text-gray-400">（未記入）</span>}</span>
                      <button
                        className="bg-yellow-400 text-white px-2 py-1 rounded text-xs"
                        onClick={() => handleEdit(h.id, h.memo)}
                      >編集</button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default History;
