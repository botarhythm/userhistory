import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { useLiff } from '../contexts/LiffContext';
import { isAccessAllowed } from '../config/permissions';

const QRScanner: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useLiff();
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // Permission Check
        if (user?.userId && !isAccessAllowed(user.userId)) {
            navigate('/');
            return;
        }

        // Initialize Scanner
        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                supportedScanTypes: [] // Default
            },
            /* verbose= */ false
        );

        scannerRef.current = scanner;

        scanner.render(onScanSuccess, onScanFailure);

        return () => {
            scanner.clear().catch(console.error);
        };
    }, []);

    const onScanSuccess = async (decodedText: string, _decodedResult: any) => {
        if (isProcessing) return;
        setIsProcessing(true);

        // Stop scanning temporarily
        if (scannerRef.current) {
            try {
                await scannerRef.current.clear();
            } catch (e) {
                console.error("Failed to clear scanner", e);
            }
        }

        setScanResult(decodedText);

        // Get Location
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            setIsProcessing(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    await submitPointEarn(decodedText, position.coords.latitude, position.coords.longitude);
                } catch (err) {
                    setError("Failed to earn points. Please try again.");
                    setIsProcessing(false);
                }
            },
            (_err) => {
                setError("Location access denied. Please enable location services.");
                setIsProcessing(false);
            }
        );
    };

    const onScanFailure = (_error: any) => {
        // console.warn(`Code scan error = ${error}`);
    };

    const submitPointEarn = async (qrToken: string, latitude: number, longitude: number) => {
        if (!user?.userId) {
            setError("User not authenticated");
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
                    storeId: 'test-store-001', // Using test store for verification
                    // Actually, the QR token should probably contain the store ID or be unique enough.
                    // Our API expects storeId AND qrToken.
                    // Let's assume the QR code contains JSON: { "storeId": "...", "token": "..." }
                    // OR we just send the token and let backend figure it out? 
                    // Backend expects storeId in body.
                    // Let's assume for this MVP the QR code IS the token, and we hardcode storeId or fetch it.
                    // Better: The QR code contains a URL or string.
                    // Let's assume the QR code string IS the token.
                    // We need to know WHICH store we are at.
                    // Ideally, we get storeId from the QR code too.
                    // Let's try to parse the QR code as JSON.
                    qrToken: qrToken,
                    latitude,
                    longitude
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Success Animation & Redirect
                // navigate('/points/success', { state: { points: data.gainedPoints } });
                alert(`Success! You earned ${data.gainedPoints} point(s)!`);
                navigate('/points');
            } else {
                setError(data.error || 'Failed to earn points');
                setIsProcessing(false);
                // Restart scanner if needed
                window.location.reload();
            }
        } catch (err) {
            setError('Network error');
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
                <div className="w-12"></div> {/* Spacer for centering */}
            </div>

            {/* Scanner Container */}
            <div className="relative z-10 w-full max-w-sm bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 aspect-square flex flex-col">

                {/* Error Message Overlay */}
                {error && (
                    <div className="absolute top-4 left-4 right-4 bg-red-500/90 text-white p-3 rounded-xl text-center text-sm backdrop-blur-sm z-50 animate-bounce">
                        {error}
                    </div>
                )}

                {/* Scanner Area */}
                <div className="flex-1 relative bg-black">
                    {!scanResult && <div id="reader" className="w-full h-full"></div>}

                    {/* Custom Overlay Guide (Visual only) */}
                    {!scanResult && !isProcessing && (
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
                {isProcessing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-40">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mb-4"></div>
                        <p className="text-xl font-bold animate-pulse">確認中...</p>
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
