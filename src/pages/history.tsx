import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiff } from '../contexts/LiffContext';

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
  const navigate = useNavigate();
  const { user, isLoggedIn } = useLiff();
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
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              再試行
            </button>
          </div>
        </div>
      </div>
    );
  }

     return (
     <div className="min-h-screen bg-gray-100 py-4 sm:py-8">
       <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-4 sm:p-6 mx-4 sm:mx-auto border border-gray-200">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">履歴一覧</h1>
            {user && (
              <p className="text-sm text-gray-600 mt-1">
                {user.displayName}さんの履歴
              </p>
            )}
          </div>
          <button
            onClick={fetchHistory}
            className="text-green-600 hover:text-green-800 p-2"
            title="履歴を更新"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>



        {/* 履歴リスト */}
        <div className="space-y-3 sm:space-y-4">
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {user ? `${user.displayName}さんの履歴がありません` : '履歴がありません'}
            </div>
          ) : (
            history.map((record) => (
                             <div
                 key={record.id}
                 className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-lg transition-shadow bg-white"
               >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.type === 'checkin'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {record.type === 'checkin' ? '来店' : '記入日'}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formatDate(record.timestamp)}
                    </span>
                  </div>
                </div>

                {record.type === 'purchase' && (
                  <div className="space-y-2">
                    {record.items && record.items.length > 0 && (
                      <div className="text-gray-800">
                        {formatItems(record.items)}
                      </div>
                    )}
                  </div>
                )}

                {editingId === record.id ? (
                  <div className="mt-2 space-y-2">
                    {record.type === 'purchase' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          商品名
                        </label>
                        <input
                          type="text"
                          value={editProductName}
                          onChange={(e) => setEditProductName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="商品名を入力してください"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        メモ
                      </label>
                      <textarea
                        value={editMemo}
                        onChange={(e) => setEditMemo(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        rows={3}
                        placeholder="豆/粉の種類、風味の印象、次回への記録など、自由に記入してください"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(record.id)}
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                      >
                        保存
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center justify-between">
                                         {record.memo && (
                       <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded flex-1">
                         {record.memo}
                       </div>
                     )}
                    <button
                      onClick={() => handleEdit(record)}
                      className="ml-2 px-2 py-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      編集
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
