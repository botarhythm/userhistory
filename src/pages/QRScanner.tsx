import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { useLiff } from '../contexts/LiffContext';
import { isAccessAllowed } from '../config/permissions';

const QRScanner: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useLiff();
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [successPoints, setSuccessPoints] = useState<number | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isMountedRef = useRef(false);

    useEffect(() => {
        isMountedRef.current = true;

        // Permission Check
        if (user?.userId && !isAccessAllowed(user.userId)) {
            navigate('/');
            return;
        }

        const initializeScanner = async () => {
            try {
                // Determine config
                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                };

                // If scanner already exists, don't re-init immediately
                if (!scannerRef.current) {
                    scannerRef.current = new Html5Qrcode("reader");
                }

                await scannerRef.current.start(
                    { facingMode: "environment" }, // Prefer back camera
                    config,
                    (decodedText) => {
                        onScanSuccess(decodedText);
                    },
                    (_errorMessage) => {
                        // ignore scan errors (too noisy)
                    }
                );
            } catch (err: any) {
                if (isMountedRef.current) {
                    console.error("Camera start failed", err);
                    // Show user-friendly error
                    let msg = "カメラの起動に失敗しました。";
                    if (typeof err === 'string') {
                        msg = err;
                    } else if (err.name === 'NotAllowedError') {
                        msg = "カメラの許可が必要です。設定を確認してください。";
                    } else if (err.name === 'NotFoundError') {
                        msg = "カメラが見つかりません。";
                    } else if (err.name === 'NotReadableError') {
                        msg = "カメラが他のアプリで使用されています。";
                    }
                    setError(msg);
                }
            }
        };

        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            initializeScanner();
        }, 500);

        return () => {
            isMountedRef.current = false;
            clearTimeout(timer);
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().then(() => {
                    scannerRef.current?.clear();
                }).catch(console.error);
            }
        };
    }, []);

    const onScanSuccess = async (decodedText: string) => {
        if (isProcessing) return;
        setIsProcessing(true);

        // Stop scanning
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (e) {
                console.error("Failed to stop scanner", e);
            }
        }

        // Get Location
        if (!navigator.geolocation) {
            setError("お使いのブラウザは位置情報をサポートしていません");
            setIsProcessing(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    await submitPointEarn(decodedText, position.coords.latitude, position.coords.longitude);
                } catch (err) {
                    setError("ポイント獲得に失敗しました。もう一度お試しください。");
                    setIsProcessing(false);
                }
            },
            (_err) => {
                setError("位置情報の取得に失敗しました。許可設定を確認してください。");
                setIsProcessing(false);
            }
        );
    };

    const submitPointEarn = async (qrToken: string, latitude: number, longitude: number) => {
        if (!user?.userId) {
            setError("ユーザー認証が必要です");
            return;
        }

        try {
            const response = await fetch('/api/points/earn', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    lineUserId: user.userId,
                    storeId: 'store_001',
                    qrToken: qrToken,
                    latitude,
                    longitude
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Show Success UI
                setSuccessPoints(data.gainedPoints || 1);

                // Auto redirect after animation
                setTimeout(() => {
                    navigate('/points');
                }, 3000);
            } else {
                setError(data.error || 'ポイント獲得に失敗しました');
                setIsProcessing(false);
                // Ideally give a button to restart scanner here instead of full reload
            }
        } catch (err) {
            setError('ネットワークエラーが発生しました');
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* Background elements */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black z-0"></div>

            {/* Header */}
            <div className="relative z-10 w-full max-w-sm mb-8 flex justify-between items-center">
                <button
                    onClick={() => navigate('/points')}
                    className="flex items-center text-white/80 hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    戻る
                </button>
                <div className="font-bold text-lg">QRスキャン</div>
                <div className="w-12"></div>
            </div>

            {/* Scanner Container */}
            <div className="relative z-10 w-full max-w-sm bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 aspect-square flex flex-col">

                {/* Error Message Overlay */}
                {error && (
                    <div className="absolute top-4 left-4 right-4 bg-red-500/90 text-white p-3 rounded-xl text-center text-sm backdrop-blur-sm z-50 animate-bounce">
                        {error}
                        <button
                            onClick={() => window.location.reload()}
                            className="block mt-2 mx-auto bg-white/20 px-3 py-1 rounded text-xs hover:bg-white/30"
                        >
                            再読み込み
                        </button>
                    </div>
                )}

                {/* Scanner Area */}
                <div className="flex-1 relative bg-black">
                    <div id="reader" className="w-full h-full"></div>

                    {/* Custom Overlay Guide (Visual only) */}
                    {!isProcessing && !error && !successPoints && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-64 h-64 border-2 border-white/30 rounded-3xl relative">
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-xl"></div>
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-xl"></div>
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-xl"></div>
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-xl"></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Loading / Processing State */}
                {isProcessing && !successPoints && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-40">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mb-4"></div>
                        <p className="text-xl font-bold animate-pulse">確認中...</p>
                    </div>
                )}

                {/* Success State */}
                {successPoints && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md z-50 animate-in fade-in duration-300">
                        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
                            <svg className="w-12 h-12 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">獲得成功！</h2>
                        <p className="text-4xl font-bold text-green-400 mb-4">+{successPoints} pt</p>
                        <p className="text-sm text-gray-400">ポイントカードへ移動します...</p>
                    </div>
                )}
            </div>

            {/* Instruction Text */}
            <div className="relative z-10 mt-8 text-center text-gray-400 max-w-xs text-sm">
                枠内にQRコードを合わせて<br />ポイントを獲得してください
            </div>
        </div>
    );
};

export default QRScanner;
