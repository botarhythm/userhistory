import React, { useState, useEffect } from 'react';

interface UserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

interface HistoryRecord {
  id: string;
  customerId: string;
  type: 'checkin' | 'purchase';
  timestamp: string;
  items?: Array<{
    name: string;
    quantity: number;
    price?: number;
  }>;
  total?: number;
  memo?: string;
}

interface HistoryProps {
  userProfile: UserProfile | null;
}

const History: React.FC<HistoryProps> = ({ userProfile }) => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'checkin' | 'purchase'>('all');

  useEffect(() => {
    if (userProfile) {
      fetchHistory();
    }
  }, [userProfile, filterType]);

  const fetchHistory = async () => {
    if (!userProfile) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') {
        params.append('type', filterType);
      }
      params.append('limit', '50');

      const response = await fetch(`/api/history/${userProfile.userId}?${params}`);
      const result = await response.json();

      if (response.ok) {
        setHistory(result.history || []);
      } else {
        setError(result.error || '履歴の取得に失敗しました');
      }
    } catch (error) {
      console.error('History fetch error:', error);
      setError('通信エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatItems = (items?: Array<{ name: string; quantity: number; price?: number }>) => {
    if (!items || items.length === 0) return '';
    return items.map(item => `${item.name} x${item.quantity}`).join(', ');
  };

  const getTypeLabel = (type: 'checkin' | 'purchase') => {
    return type === 'checkin' ? '来店' : '購入';
  };

  const getTypeColor = (type: 'checkin' | 'purchase') => {
    return type === 'checkin' 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-blue-100 text-blue-800 border-blue-200';
  };

  if (!userProfile) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center text-gray-500">
            ユーザー情報が取得できません
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border">
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">履歴一覧</h2>
            <button
              onClick={fetchHistory}
              disabled={isLoading}
              className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* フィルター */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filterType === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => setFilterType('checkin')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filterType === 'checkin'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              来店
            </button>
            <button
              onClick={() => setFilterType('purchase')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filterType === 'purchase'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              購入
            </button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">読み込み中...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">{error}</div>
              <button
                onClick={fetchHistory}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                再試行
              </button>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                {filterType === 'all' 
                  ? '履歴がありません' 
                  : `${getTypeLabel(filterType)}履歴がありません`
                }
              </div>
              <p className="text-sm text-gray-400">
                初回の来店や購入を記録してみてください
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((record) => (
                <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(record.type)}`}>
                          {getTypeLabel(record.type)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(record.timestamp)}
                        </span>
                      </div>
                      
                      {record.type === 'purchase' && (
                        <div className="space-y-2">
                          {record.items && record.items.length > 0 && (
                            <div className="text-gray-900">
                              {formatItems(record.items)}
                            </div>
                          )}
                          {record.total && (
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
