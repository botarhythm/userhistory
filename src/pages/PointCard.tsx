import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiff } from '../contexts/LiffContext';
import { motion } from 'framer-motion';
import { isAccessAllowed } from '../config/permissions';

interface PointStatus {
    currentPoints: number;
    totalPoints: number;
    displayName: string;
}

const PointCard: React.FC = () => {
    const { user, isLoggedIn } = useLiff();
    const navigate = useNavigate();
    const [status, setStatus] = useState<PointStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!loading && user?.userId && !isAccessAllowed(user.userId)) {
            navigate('/'); // Redirect unauthorized users
            return;
        }

        if (user?.userId) {
            fetchPointStatus(user.userId);
        } else {
            setLoading(false);
        }
    }, [user, loading, navigate]);

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20">
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
                    className="relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden shadow-2xl transform perspective-1000"
                    style={{ background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' }}
                >
                    {/* Abstract Background Shapes */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-5"></div>
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-40 h-40 rounded-full bg-green-500 opacity-10"></div>

                    <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <img src="/assets/symbolmark.gif" alt="Logo" className="w-8 h-8 rounded-full bg-white/20 p-1 backdrop-blur-sm" />
                                <div className="text-xs font-medium text-gray-300 mt-2 tracking-widest uppercase">Member Card</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20">
                                GOLD
                            </div>
                        </div>

                        <div>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-5xl font-bold tracking-tight">
                                    {loading ? '...' : (status?.currentPoints || 0)}
                                </span>
                                <span className="text-lg font-medium text-gray-300">pt</span>
                            </div>
                            <div className="text-xs text-gray-400 mt-1 font-mono tracking-wider opacity-80">
                                ID: {user?.userId?.substring(0, 8).toUpperCase() || 'UNKNOWN'}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Main Actions */}
            <div className="px-4 -mt-4 relative z-20">
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

            {/* Stats Grid */}
            <div className="px-4 mt-6 grid grid-cols-2 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center"
                >
                    <div className="text-gray-400 text-xs font-bold uppercase mb-1">獲得総ポイント</div>
                    <div className="text-2xl font-bold text-gray-800">{status?.totalPoints || 0}</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-8 h-8 bg-yellow-400 opacity-20 rounded-bl-xl"></div>
                    <div className="text-gray-400 text-xs font-bold uppercase mb-1">次の特典</div>
                    <div className="text-lg font-bold text-gray-800">コーヒー1杯</div>
                    <div className="text-xs text-green-600 font-medium">あと 5 pt</div>
                </motion.div>
            </div>

            {/* Recent History Preview */}
            <div className="mt-8 px-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800">最近のアクティビティ</h3>
                    <Link to="/history" className="text-xs text-green-600 font-bold hover:underline">すべて見る</Link>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
                    {[1, 2, 3].map((_, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 last:pb-0 first:pt-0">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-lg">
                                    ☕
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-gray-800">ご来店</div>
                                    <div className="text-xs text-gray-400">2025/12/{6 - i}</div>
                                </div>
                            </div>
                            <div className="font-bold text-green-600 text-sm">+1 pt</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PointCard;
