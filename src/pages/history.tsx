import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLiff } from '../contexts/LiffContext';
import { usePageTitle } from '../hooks/usePageTitle';

interface HistoryRecord {
  id: string;
  type: 'checkin' | 'purchase' | 'usage';
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
      const response = await fetch(`/api/history/${user.userId}?includeUsage=false`);

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
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-2xl p-6 mb-6 shadow-lg flex justify-between items-center text-white">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              {user?.displayName}さんのメモ
            </h1>
            <p className="text-blue-100 text-sm">
              購入履歴とメモの管理
            </p>
          </div>
          <div className="flex space-x-3">
            <Link to="/purchase" className="bg-white text-blue-600 px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-blue-50 transition flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新規作成
            </Link>
            <button
              onClick={fetchHistory}
              className="bg-blue-800/50 text-white px-3 py-2 rounded-xl hover:bg-blue-800/70 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="font-medium text-lg">履歴がありません</p>
            <p className="text-sm mt-2">新しく購入メモを作成してみましょう</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((record) => (
              <div key={record.id} className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition duration-200">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${record.type === 'checkin' ? 'bg-green-100 text-green-600' :
                      record.type === 'usage' ? 'bg-orange-100 text-orange-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                      {record.type === 'checkin' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      ) : record.type === 'usage' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                      )}
                    </div>
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold mb-1 ${record.type === 'checkin' ? 'bg-green-100 text-green-700' :
                        record.type === 'usage' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                        {record.type === 'checkin' ? 'ご来店' :
                          record.type === 'usage' ? 'チケット' :
                            '購入メモ'}
                      </span>
                      <div className="text-xs text-gray-400 font-medium ml-1">
                        {formatDate(record.timestamp)}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-1">
                    {editingId === record.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSave(record.id)}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow hover:bg-blue-700 transition"
                        >
                          保存
                        </button>
                        <button
                          onClick={handleCancel}
                          className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200 transition"
                        >
                          キャンセル
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEdit(record)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {editingId === record.id ? (
                  <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">商品名</label>
                      <input
                        type="text"
                        value={editProductName}
                        onChange={(e) => setEditProductName(e.target.value)}
                        className="w-full text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">メモ</label>
                      <textarea
                        value={editMemo}
                        onChange={(e) => setEditMemo(e.target.value)}
                        className="w-full text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
                        rows={2}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="pl-[52px]">
                    {record.items && record.items.length > 0 && (
                      <div className="text-gray-900 font-bold text-lg mb-1">
                        {formatItems(record.items)}
                        {record.total && (
                          <span className="ml-2 text-gray-400 text-sm font-normal">
                            (計{record.total}点)
                          </span>
                        )}
                      </div>
                    )}
                    {record.memo && (
                      <div className="mt-2 text-gray-600 text-sm bg-gray-50 border border-gray-100 p-3 rounded-xl italic">
                        "{record.memo}"
                      </div>
                    )}
                  </div>
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
