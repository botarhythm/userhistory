import React, { useState, useEffect } from 'react';
import { useLiff } from '../contexts/LiffContext';
import { usePageTitle } from '../hooks/usePageTitle';

interface HistoryRecord {
  id: string;
  type: 'checkin' | 'purchase';
  timestamp: string;
  items?: Array<{
    name: string;
    quantity: number;
  }>;
  total?: number;
  memo?: string;
}

const HistoryPage: React.FC = () => {
  const { user, isLoggedIn } = useLiff();

  // ページタイトルを設定
  usePageTitle('履歴一覧 - Botarhythm Coffee Roaster');
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMemo, setEditMemo] = useState<string>('');
  const [editProductName, setEditProductName] = useState<string>('');

  useEffect(() => {
    if (isLoggedIn && user) {
      fetchHistory();
    }
  }, [isLoggedIn, user]);

  const fetchHistory = async () => {
    if (!user || !user.userId) {
      setError('ユーザー情報が取得できません');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching history for user:', user.userId);
      const response = await fetch(`/api/history/${user.userId}`);

      if (response.ok) {
        const data = await response.json();
        console.log('History data received:', data);
        setHistory(data.history || []);
      } else if (response.status === 404) {
        setError('ユーザーの履歴が見つかりません');
      } else {
        const errorData = await response.json();
        setError(`履歴の取得に失敗しました: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('History fetch error:', error);
      setError('履歴の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatItems = (items?: Array<{ name: string; quantity: number }>) => {
    if (!items || items.length === 0) return '';
    return items.map(item => item.name).join(', ');
  };

  const handleEdit = (record: HistoryRecord) => {
    setEditingId(record.id);
    setEditMemo(record.memo || '');
    setEditProductName(formatItems(record.items) || '');
  };

  const handleSave = async (recordId: string) => {
    if (!user || !user.userId) {
      alert('ユーザー情報が取得できません');
      return;
    }

    try {
      console.log('Updating history record:', recordId, 'for user:', user.userId);
      const response = await fetch(`/api/history/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memo: editMemo,
          productName: editProductName
        }),
      });

      if (response.ok) {
        // 履歴を再取得
        await fetchHistory();
        setEditingId(null);
        setEditMemo('');
        setEditProductName('');
      } else {
        const errorData = await response.json();
        alert(`更新に失敗しました: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('更新に失敗しました');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditMemo('');
    setEditProductName('');
  };

  const handleDelete = async (recordId: string) => {
    if (!user || !user.userId) {
      alert('ユーザー情報が取得できません');
      return;
    }

    // 削除確認
    if (!confirm('この履歴を削除しますか？この操作は取り消せません。')) {
      return;
    }

    try {
      console.log('Deleting history record:', recordId, 'for user:', user.userId);
      const response = await fetch(`/api/history/${recordId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // 履歴を再取得
        await fetchHistory();
      } else {
        const errorData = await response.json();
        alert(`削除に失敗しました: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('削除に失敗しました');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6 border border-gray-200">
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
              履歴を確認するにはLINEアカウントでログインしてください
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">読み込み中...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="text-center py-8">
            <div className="text-red-600 text-lg mb-4">{error}</div>
            <button
              onClick={fetchHistory}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
            >
              再読み込み
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">
            {user?.displayName}さんの履歴
          </h1>
          <button
            onClick={fetchHistory}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            更新
          </button>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            履歴がありません
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {history.map((record) => (
              <div key={record.id} className="p-6 hover:bg-gray-50 transition duration-150">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-3 ${record.type === 'checkin' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                      {record.type === 'checkin' ? 'チェックイン' : '購入'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(record.timestamp)}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    {editingId === record.id ? (
                      <>
                        <button
                          onClick={() => handleSave(record.id)}
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                        >
                          保存
                        </button>
                        <button
                          onClick={handleCancel}
                          className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                        >
                          キャンセル
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(record)}
                          className="text-gray-400 hover:text-blue-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {editingId === record.id ? (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">商品名</label>
                      <input
                        type="text"
                        value={editProductName}
                        onChange={(e) => setEditProductName(e.target.value)}
                        className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">メモ</label>
                      <textarea
                        value={editMemo}
                        onChange={(e) => setEditMemo(e.target.value)}
                        className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {record.items && record.items.length > 0 && (
                      <div className="mt-2 text-gray-800 font-medium">
                        {formatItems(record.items)}
                        {record.total && (
                          <span className="ml-2 text-gray-500 text-sm">
                            (計{record.total}点)
                          </span>
                        )}
                      </div>
                    )}
                    {record.memo && (
                      <div className="mt-2 text-gray-600 text-sm bg-gray-50 p-2 rounded">
                        {record.memo}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
