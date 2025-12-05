import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { useLiff } from '../contexts/LiffContext';
import { motion, AnimatePresence } from 'framer-motion';

const QRScanner: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useLiff();
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
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

    const onScanSuccess = async (decodedText: string, decodedResult: any) => {
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
            (err) => {
                setError("Location access denied. Please enable location services.");
                setIsProcessing(false);
            }
        );
    };

    const onScanFailure = (error: any) => {
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
                    storeId: 'store_001', // TODO: In a real app, storeId might be encoded in QR or selected. For now assuming single store or derived from QR.
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
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
            <h1 className="text-2xl font-bold mb-4">Scan QR Code</h1>

            {error && (
                <div className="bg-red-500 text-white p-3 rounded mb-4 w-full max-w-sm text-center">
                    {error}
                </div>
            )}

            <div className="w-full max-w-sm bg-white rounded-lg overflow-hidden shadow-xl relative">
                {!scanResult && <div id="reader" className="w-full"></div>}

                {isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                            <p>Verifying Location & Points...</p>
                        </div>
                    </div>
                )}
            </div>

            <button
                onClick={() => navigate('/points')}
                className="mt-8 text-gray-400 hover:text-white underline"
            >
                Back to Point Card
            </button>
        </div>
    );
};

export default QRScanner;
