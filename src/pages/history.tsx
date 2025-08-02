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
  const [filter, setFilter] = useState<'all' | 'checkin' | 'purchase'>('all');

  useEffect(() => {
    if (isLoggedIn && user) {
      fetchHistory();
    }
  }, [filter, isLoggedIn, user]);

  const fetchHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/history/${user.userId}?type=${filter === 'all' ? '' : filter}`);
      
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      } else if (response.status === 404) {
        setError('Customer not found');
      } else {
        setError('履歴の取得に失敗しました');
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
    return items.map(item => `${item.name} x${item.quantity}`).join(', ');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">履歴一覧</h1>
          <button
            onClick={fetchHistory}
            className="text-blue-600 hover:text-blue-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

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

        {/* フィルターボタン */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'all'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            すべて
          </button>
          <button
            onClick={() => setFilter('checkin')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'checkin'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            来店
          </button>
          <button
            onClick={() => setFilter('purchase')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'purchase'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            購入
          </button>
        </div>

        {/* 履歴リスト */}
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              履歴がありません
            </div>
          ) : (
            history.map((record) => (
              <div
                key={record.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
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
                      {record.type === 'checkin' ? '来店' : '購入'}
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
                    {record.total && record.total > 0 && (
                      <div className="text-lg font-semibold text-blue-600">
                        ¥{record.total.toLocaleString()}
                      </div>
                    )}
                  </div>
                )}

                {record.memo && (
                  <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {record.memo}
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
