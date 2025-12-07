import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiff } from '../contexts/LiffContext';
import { motion, AnimatePresence } from 'framer-motion';
import { isAccessAllowed } from '../config/permissions';

import { Reward } from '../types/points';

interface PointStatus {
    currentPoints: number;
    totalPoints: number;
    displayName: string;
    nextReward?: Reward;
    pointsToNextReward?: number;
    availableRewards?: {
        id: string;
        rewardId: string;
        title: string;
        description: string;
        count: number;
    }[];
}

import { MEMBER_RANKS, getRank } from '../utils/ranks';

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

const PointCard: React.FC = () => {
    const { user, isLoggedIn } = useLiff();
    const navigate = useNavigate();
    const [status, setStatus] = useState<PointStatus | null>(null);
    const [recentHistory, setRecentHistory] = useState<HistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const rank = getRank(status?.totalPoints || 0);

    const fetchPointStatus = async (userId: string) => {
        try {
            const res = await fetch(`/api/points/status/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            }
        } catch (error) {
            console.error('Failed to fetch points', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentHistory = async (userId: string) => {
        try {
            const res = await fetch(`/api/history/${userId}?limit=3`);
            if (res.ok) {
                const data = await res.json();
                setRecentHistory(data.history || []);
            }
        } catch (error) {
            console.error('Failed to fetch history', error);
        }
    };

    useEffect(() => {
        if (!loading && user?.userId && !isAccessAllowed(user.userId)) {
            navigate('/'); // Redirect unauthorized users
            return;
        }

        if (user?.userId) {
            fetchPointStatus(user.userId);
            fetchRecentHistory(user.userId);
        } else {
            setLoading(false);
        }
    }, [user, loading, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    const [alertModal, setAlertModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'success' | 'error';
    }>({ isOpen: false, title: '', message: '', type: 'success' });

    const handleRedeemClick = (rewardType: string, rewardName: string) => {
        setConfirmModal({
            isOpen: true,
            title: '特典の利用',
            message: `${rewardName}を利用しますか？\nスタッフに画面を提示してください。`,
            onConfirm: () => executeRedeem(rewardType, rewardName)
        });
    };

    const executeRedeem = async (rewardType: string, rewardName: string) => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));

        try {
            const res = await fetch('/api/points/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lineUserId: user?.userId, rewardType })
            });

            if (res.ok) {
                setAlertModal({
                    isOpen: true,
                    title: '利用完了',
                    message: `${rewardName}を利用しました！`,
                    type: 'success'
                });
                if (user?.userId) {
                    fetchPointStatus(user?.userId);
                    fetchRecentHistory(user?.userId);
                }
            } else {
                const err = await res.json();
                setAlertModal({
                    isOpen: true,
                    title: 'エラー',
                    message: `利用に失敗しました: ${err.error || '不明なエラー'}`,
                    type: 'error'
                });
            }
        } catch (e) {
            setAlertModal({
                isOpen: true,
                title: '通信エラー',
                message: '通信エラーが発生しました',
                type: 'error'
            });
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full">
                    <img src="/assets/symbolmark.gif" alt="Logo" className="w-16 h-16 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">ログインが必要です</h2>
                    <p className="text-gray-500 mb-6">会員カードを表示するにはLINEでログインしてください。</p>
                </div>
            </div>
        );
    }

    // Rank Progress Calculation
    const currentRankIdx = MEMBER_RANKS.findIndex(r => r.name === rank.name);
    const nextRank = MEMBER_RANKS[currentRankIdx + 1];
    let progressPercent = 100;
    let pointsToRankUp = 0;

    if (nextRank) {
        const range = nextRank.min - rank.min;
        const currentInRank = (status?.totalPoints || 0) - rank.min;
        progressPercent = Math.min(100, Math.max(0, (currentInRank / range) * 100));
        pointsToRankUp = nextRank.min - (status?.totalPoints || 0);
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20 relative">
            {/* Confirmation Modal */}
            <AnimatePresence>
                {confirmModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
                        >
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{confirmModal.title}</h3>
                                <p className="text-gray-600 whitespace-pre-wrap">{confirmModal.message}</p>
                            </div>
                            <div className="flex border-t border-gray-100">
                                <button
                                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                                    className="flex-1 px-6 py-4 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={confirmModal.onConfirm}
                                    className="flex-1 px-6 py-4 bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors"
                                >
                                    利用する
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Alert Modal */}
            <AnimatePresence>
                {alertModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
                        >
                            <div className="p-6 text-center">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${alertModal.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                                    {alertModal.type === 'success' ? (
                                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{alertModal.title}</h3>
                                <p className="text-gray-600">{alertModal.message}</p>
                            </div>
                            <div className="p-4 bg-gray-50">
                                <button
                                    onClick={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
                                    className="w-full py-3 bg-white border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 shadow-sm"
                                >
                                    閉じる
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Header / Top Section */}
            <div className="bg-white pb-6 pt-4 px-4 rounded-b-3xl shadow-sm z-10 relative">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Welcome</div>
                        <h1 className="text-xl font-bold text-gray-800">{user?.displayName || 'ゲスト'} 様</h1>
                    </div>
                    <img src={user?.pictureUrl || '/assets/symbolmark.gif'} alt="Profile" className="w-10 h-10 rounded-full border-2 border-white shadow-md" />
                </div>

                {/* Digital Card Preview */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className={`relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden shadow-2xl transform perspective-1000 bg-gradient-to-br ${rank.color}`}
                >
                    {/* Abstract Background Shapes */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-40 h-40 rounded-full bg-white opacity-5 blur-lg"></div>

                    <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <img src="/assets/symbolmark.gif" alt="Logo" className="w-8 h-8 rounded-full bg-white/20 p-1 backdrop-blur-sm" />
                                <div className={`text-xs font-medium mt-2 tracking-widest uppercase opacity-80 ${rank.text}`}>Member Card</div>
                            </div>
                            <div className={`bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border ${rank.badgeBorder} shadow-sm`}>
                                {rank.name}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-5xl font-bold tracking-tight drop-shadow-sm">
                                    {loading ? '...' : (status?.totalPoints || 0)}
                                </span>
                                <span className="text-lg font-medium opacity-80">pt</span>
                            </div>
                            <div className="text-xs mt-1 font-mono tracking-wider opacity-60">
                                ID: {user?.userId?.substring(0, 8).toUpperCase() || 'UNKNOWN'}
                            </div>
                        </div>
                    </div>

                    {/* Rank Progress Bar (Inside Card) */}
                    {nextRank && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                            <motion.div
                                className="h-full bg-white/50"
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                            />
                        </div>
                    )}
                </motion.div>

                {/* Rank Status Text */}
                {nextRank && (
                    <div className="mt-3 flex justify-between text-xs font-medium text-gray-500 px-1">
                        <span>{rank.name}</span>
                        <span>Next: {nextRank.name} (あと {pointsToRankUp} pt)</span>
                    </div>
                )}
            </div>

            {/* Main Actions */}
            <div className="px-4 mt-6">
                <Link to="/scan">
                    <motion.button
                        whileHover={{ scale: 1.02, translateY: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center space-x-3 group"
                    >
                        <div className="bg-white/20 p-2 rounded-full">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                        </div>
                        <span>QRスキャンしてポイント獲得</span>
                    </motion.button>
                </Link>
            </div>

            {/* Reward Wallet Section */}
            {status?.availableRewards && status.availableRewards.length > 0 && (
                <div className="px-4 mt-8">
                    <h3 className="text-gray-800 font-bold text-lg mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                        保有チケット (利用可能)
                    </h3>
                    <div className="space-y-3">
                        {status.availableRewards.map((reward) => (
                            <motion.div
                                key={reward.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="relative overflow-hidden rounded-xl shadow-md border border-gray-100 group"
                            >
                                {/* Background Image with Overlay */}
                                <div className="absolute inset-0 z-0">
                                    <img
                                        src={reward.rewardId.includes('bean') ? '/assets/ticket_beans.png' : '/assets/ticket_coffee.png'}
                                        alt={reward.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
                                </div>

                                <div className="relative z-10 p-5 flex justify-between items-center text-white">
                                    <div>
                                        <div className="font-bold text-lg">{reward.title}</div>
                                        <div className="text-xs text-gray-200 mt-1">{reward.description}</div>
                                        <div className="inline-flex items-center mt-3 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30">
                                            <svg className="w-4 h-4 text-orange-400 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                            </svg>
                                            <span className="text-xs font-bold">保有数: {reward.count}枚</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRedeemClick(reward.rewardId, reward.title)}
                                        className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold py-3 px-6 rounded-xl shadow-lg transform transition active:scale-95 border border-orange-400/50 backdrop-blur-sm"
                                    >
                                        利用する
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Next Reward Status (Stats Grid) */}
            <div className="px-4 mt-6">
                <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">次の目標</h3>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-green-500 opacity-10 rounded-bl-full"></div>
                    <div>
                        {status?.nextReward ? (
                            status.nextReward.pointsRequired === 9999 ? (
                                <div>
                                    <div className="text-sm font-bold text-gray-800">{status.nextReward.title}</div>
                                    <div className="text-xs text-gray-400 font-medium mt-1">{status.nextReward.description}</div>
                                </div>
                            ) : (
                                <div>
                                    <div className="text-xs text-green-600 font-bold mb-1">あと {status.pointsToNextReward} pt でGET</div>
                                    <div className="text-lg font-bold text-gray-800">{status.nextReward.title}</div>
                                </div>
                            )
                        ) : (
                            <div className="text-sm font-bold text-gray-800">すべての特典を獲得可能</div>
                        )}
                    </div>
                    <div className="bg-green-50 p-3 rounded-full">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Recent History Preview */}
            <div className="mt-8 px-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800">最近のアクティビティ</h3>
                    <Link to="/point-history" className="text-xs text-green-600 font-bold hover:underline">すべて見る</Link>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
                    {loading ? (
                        <div className="text-center py-4 text-gray-400 text-xs">読み込み中...</div>
                    ) : recentHistory.length === 0 ? (
                        <div className="text-center py-4 text-gray-400 text-xs">まだ履歴がありません</div>
                    ) : (
                        recentHistory.map((record) => (
                            <div key={record.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 last:pb-0 first:pt-0">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${record.type === 'checkin' ? 'bg-green-100' :
                                        record.type === 'usage' ? 'bg-orange-100' : 'bg-blue-100'
                                        }`}>
                                        {record.type === 'checkin' ? '☕' :
                                            record.type === 'usage' ? '🎫' : '🛒'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-gray-800">
                                            {record.type === 'checkin' ? 'ご来店・お買い物' :
                                                record.type === 'usage' ? (record.items?.[0]?.name || 'チケット利用') :
                                                    '商品購入'}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {new Date(record.timestamp).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                                <div className={`font-bold text-sm ${record.type === 'checkin' ? 'text-green-600' :
                                    record.type === 'usage' ? 'text-orange-500' : 'text-blue-600'
                                    }`}>
                                    {record.type === 'checkin' ? '+1 pt' :
                                        record.type === 'usage' ? '使用' :
                                            '+1 pt'}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default PointCard;
