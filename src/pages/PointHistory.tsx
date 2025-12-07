import React, { useState, useEffect } from 'react';
import { useLiff } from '../contexts/LiffContext';
import { usePageTitle } from '../hooks/usePageTitle';

interface HistoryRecord {
    id: string;
    type: 'checkin' | 'purchase' | 'usage' | 'earn';
    timestamp: string;
    items?: Array<{
        name: string;
        quantity: number;
    }>;
    total?: number;
    memo?: string;
}

const PointHistory: React.FC = () => {
    const { user, isLoggedIn } = useLiff();

    // ページタイトルを設定
    usePageTitle('ポイント履歴 - Botarhythm Coffee Roaster');
    const [history, setHistory] = useState<HistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            console.log('Fetching point history for user:', user.userId);
            // includeUsage=true to get point transactions
            const response = await fetch(`/api/history/${user.userId}?includeUsage=true`);

            if (response.ok) {
                const data = await response.json();
                // "Memo is Memo DB, Points and Rewards are separate"
                // Filter to show ONLY usage (Reward/Point DB) transactions, excluding Memo DB (Purchase/Checkin)
                const usageOnly = (data.history || []).filter((record: HistoryRecord) => record.type === 'usage' || record.type === 'earn');
                setHistory(usageOnly);
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

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gray-100 py-8">
                <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                    <div className="text-center">
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
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">読み込み中...</span>
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
                        {user?.displayName}さんのポイント履歴
                    </h1>
                    <button
                        onClick={fetchHistory}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
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
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className={`text-lg font-bold px-3 py-1 rounded-full inline-block ${record.type === 'usage' ? 'bg-orange-100 text-orange-800' :
                                        record.type === 'earn' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {record.type === 'usage' ? 'チケット利用' :
                                            record.type === 'earn' ? 'ポイント獲得' : 'その他'}
                                    </h3>
                                    <span className="text-sm text-gray-400">
                                        {formatDate(record.timestamp)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-500">
                                        {record.items?.[0]?.name || (record.type === 'usage' ? '特典利用' : '詳細なし')}
                                    </div>
                                    {record.total && record.type !== 'usage' && (
                                        <span className="text-sm font-medium text-gray-600">
                                            {record.total > 0 ? `+${record.total}pt` : `${record.total}pt`}
                                        </span>
                                    )}
                                </div>

                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PointHistory;
