import React, { useState, useEffect } from 'react';
import { useLiff } from '../contexts/LiffContext';
import { motion, AnimatePresence } from 'framer-motion';
import { isAccessAllowed } from '../config/permissions';

interface Customer {
    id: string;
    lineUid: string;
    displayName: string;
    currentPoints: number;
    totalPoints: number;
    lastVisit: string;
}

interface DetailedStatus {
    availableRewards?: { title: string; count: number }[];
    nextReward?: { title: string; pointsRequired: number };
    pointsToNextReward?: number;
}

const Admin: React.FC = () => {
    const { user, isLoggedIn } = useLiff();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [detailedStatus, setDetailedStatus] = useState<DetailedStatus | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);

    const [adjustAmount, setAdjustAmount] = useState<number>(0);
    const [adjustReason, setAdjustReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Note: In a real app, authorized users should be checked against a secure list
    const isAdmin = isAccessAllowed(user?.userId);

    useEffect(() => {
        if (isAdmin) {
            fetchCustomers();
        } else {
            setLoading(false);
        }
    }, [user, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (selectedCustomer) {
            fetchCustomerDetails(selectedCustomer.lineUid);
        } else {
            setDetailedStatus(null);
        }
    }, [selectedCustomer]);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/points/admin/customers');
            if (res.ok) {
                const data = await res.json();
                setCustomers(data.customers);
            } else {
                setMessage({ type: 'error', text: 'Failed to fetch customers' });
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Network error' });
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomerDetails = async (lineUid: string) => {
        try {
            setStatusLoading(true);
            const res = await fetch(`/api/points/status/${lineUid}`);
            if (res.ok) {
                const data = await res.json();
                setDetailedStatus(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setStatusLoading(false);
        }
    };

    const handleAdjustPoints = async () => {
        if (!selectedCustomer || adjustAmount === 0) return;

        try {
            setIsSubmitting(true);
            const res = await fetch('/api/points/admin/adjust', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adminUserId: user?.userId,
                    targetCustomerId: selectedCustomer.id,
                    amount: adjustAmount,
                    reason: adjustReason || 'Admin Adjustment'
                })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Points adjusted successfully' });
                setAdjustAmount(0);
                setAdjustReason('');
                setSelectedCustomer(null);
                fetchCustomers(); // Refresh list
            } else {
                setMessage({ type: 'error', text: 'Failed to adjust points' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error submitting adjustment' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.lineUid.includes(searchTerm)
    );

    if (!isLoggedIn) return <div className="p-8 text-center">ログインが必要です</div>;
    if (!isAdmin) return <div className="p-8 text-center text-red-500 font-bold">アクセス拒否: 管理者権限がありません</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-4 pb-20">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">管理ダッシュボード</h1>
                    <button onClick={fetchCustomers} className="text-sm bg-white px-3 py-1 rounded shadow text-gray-600 hover:text-gray-900">
                        🔄 更新
                    </button>
                </div>

                {/* Status Message */}
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                        {message.text}
                        <button onClick={() => setMessage(null)} className="float-right font-bold ml-2">✕</button>
                    </motion.div>
                )}

                {/* Search Bar */}
                <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
                    <input
                        type="text"
                        placeholder="名前 または LINE ID で検索..."
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Customer List */}
                {loading ? (
                    <div className="text-center py-10">読み込み中...</div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザー</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">累積Pt</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="text-sm font-medium text-gray-900">{customer.displayName}</div>
                                            </div>
                                            <div className="text-xs text-gray-400 font-mono">{customer.lineUid.substring(0, 8)}...</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 font-bold">{customer.totalPoints} pt</div>
                                            <div className="text-xs text-gray-500">現在: {customer.currentPoints}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => setSelectedCustomer(customer)}
                                                className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-full text-xs font-bold"
                                            >
                                                詳細・修正
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredCustomers.length === 0 && (
                            <div className="p-8 text-center text-gray-500">顧客が見つかりません</div>
                        )}
                    </div>
                )}
            </div>

            {/* Adjustment Modal */}
            <AnimatePresence>
                {selectedCustomer && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6 border-b border-gray-100 bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <h3 className="text-lg font-bold text-gray-900">顧客詳細・ポイント修正</h3>
                                            <span
                                                className="px-2 py-0.5 rounded text-xs font-bold text-white shadow-sm"
                                                style={{ backgroundColor: getRank(selectedCustomer.totalPoints).colorCode }}
                                            >
                                                {getRank(selectedCustomer.totalPoints).name}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1">{selectedCustomer.displayName}</div>
                                        <div className="text-xs text-gray-400 font-mono">{selectedCustomer.lineUid}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-gray-800">{selectedCustomer.totalPoints} <span className="text-sm font-normal text-gray-500">pt</span></div>
                                        <div className="text-xs text-gray-500">累積獲得</div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Detailed Status Section */}
                                <div className={`p-4 rounded-xl border border-gray-100 bg-gradient-to-br ${getRank(selectedCustomer.totalPoints).color} text-white`}>
                                    <h4 className="text-sm font-bold opacity-90 mb-3 border-b border-white/20 pb-2">現在のステータス</h4>
                                    {statusLoading ? (
                                        <div className="text-center text-xs opacity-80">読み込み中...</div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-xs opacity-70 mb-1">獲得済み/利用可能チケット</div>
                                                {detailedStatus?.availableRewards && detailedStatus.availableRewards.length > 0 ? (
                                                    <ul className="text-sm font-bold list-disc list-inside">
                                                        {detailedStatus.availableRewards.map((r, i) => (
                                                            <li key={i}>{r.title}: {r.count}枚</li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <div className="text-sm font-bold opacity-50">なし</div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-xs opacity-70 mb-1">次の特典</div>
                                                <div className="text-sm font-bold">{detailedStatus?.nextReward?.title || 'すべての特典を獲得済み'}</div>
                                                {detailedStatus?.pointsToNextReward !== undefined && detailedStatus.pointsToNextReward > 0 && (
                                                    <div className="text-xs font-bold mt-1 bg-white/20 inline-block px-2 py-0.5 rounded">あと {detailedStatus.pointsToNextReward} pt</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Adjustment Form */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">ポイント操作 (+付与 / -修正)</label>
                                    <div className="flex items-center space-x-4 mb-4">
                                        <button
                                            onClick={() => setAdjustAmount(prev => prev - 1)}
                                            className="w-12 h-12 rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-600 font-bold text-2xl flex items-center justify-center transition-colors"
                                        >-</button>
                                        <input
                                            type="number"
                                            className="flex-1 text-center py-2 border border-gray-300 rounded-lg text-2xl font-bold"
                                            value={adjustAmount}
                                            onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
                                        />
                                        <button
                                            onClick={() => setAdjustAmount(prev => prev + 1)}
                                            className="w-12 h-12 rounded-full bg-gray-100 hover:bg-green-100 hover:text-green-600 font-bold text-2xl flex items-center justify-center transition-colors"
                                        >+</button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                        {[1, 5, 10].map(val => (
                                            <button key={val} onClick={() => setAdjustAmount(prev => prev + val)} className="bg-gray-100 hover:bg-green-50 text-xs py-1 rounded">+{val}</button>
                                        ))}
                                        {[-1, -5, -10].map(val => (
                                            <button key={val} onClick={() => setAdjustAmount(prev => prev + val)} className="bg-gray-100 hover:bg-red-50 text-xs py-1 rounded">{val}</button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">操作理由 (任意)</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                                        placeholder="例: 手動補正, ボーナス, 返金対応など"
                                        value={adjustReason}
                                        onChange={(e) => setAdjustReason(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 flex space-x-3 border-t border-gray-100">
                                <button
                                    onClick={() => setSelectedCustomer(null)}
                                    className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={handleAdjustPoints}
                                    disabled={adjustAmount === 0 || isSubmitting}
                                    className={`flex-1 px-4 py-3 rounded-xl text-white font-bold shadow-md transition-all ${adjustAmount === 0
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : adjustAmount > 0
                                            ? 'bg-green-500 hover:bg-green-600 hover:scale-[1.02]'
                                            : 'bg-red-500 hover:bg-red-600 hover:scale-[1.02]'
                                        }`}
                                >
                                    {isSubmitting ? '保存中...' : (adjustAmount > 0 ? 'ポイント付与' : 'ポイント修正')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Admin;
