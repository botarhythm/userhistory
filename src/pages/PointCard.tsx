import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiff } from '../contexts/LiffContext';
import { motion } from 'framer-motion';

interface PointStatus {
    currentPoints: number;
    totalPoints: number;
    displayName: string;
}

const PointCard: React.FC = () => {
    const { user, isLoggedIn } = useLiff();
    const [status, setStatus] = useState<PointStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.userId) {
            fetchPointStatus(user.userId);
        }
    }, [user]);

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
            <div className="p-8 text-center">
                <p>Please login to view your Point Card.</p>
            </div>
        );
    }

    if (loading) {
        return <div className="p-8 text-center">Loading points...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-400 p-6 text-white">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Botarhythm Member</h2>
                        <img src="/assets/symbolmark.gif" alt="Logo" className="h-8 w-8 rounded-full bg-white p-1" />
                    </div>
                    <div className="text-sm opacity-90">Current Balance</div>
                    <div className="text-5xl font-bold mt-1">{status?.currentPoints || 0} <span className="text-xl font-normal">pts</span></div>
                </div>

                {/* Actions */}
                <div className="p-6">
                    <Link to="/scan" className="block w-full">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center space-x-2"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                            <span>Scan QR Code</span>
                        </motion.button>
                    </Link>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-xl text-center">
                            <div className="text-gray-500 text-xs uppercase font-bold">Total Earned</div>
                            <div className="text-xl font-bold text-gray-800">{status?.totalPoints || 0}</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl text-center">
                            <div className="text-gray-500 text-xs uppercase font-bold">Next Reward</div>
                            <div className="text-xl font-bold text-gray-800">Coffee</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PointCard;
