import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import liff from "@line/liff";
import Purchase from "./pages/purchase";
import History from "./pages/history";
const App = () => {
    const [isLiffInitialized, setIsLiffInitialized] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        const initializeLiff = async () => {
            try {
                const liffId = (import.meta.env['VITE_LIFF_ID'] || '').trim();
                if (!liffId) {
                    throw new Error('LIFF ID is not configured');
                }
                console.log('Initializing LIFF with ID:', liffId);
                await liff.init({ liffId });
                setIsLiffInitialized(true);
                if (liff.isLoggedIn()) {
                    setIsLoggedIn(true);
                    // ユーザープロフィールを取得
                    const profile = await liff.getProfile();
                    setUserProfile({
                        userId: profile.userId,
                        displayName: profile.displayName,
                        pictureUrl: profile.pictureUrl || ''
                    });
                    console.log('User logged in:', profile.displayName);
                }
                else {
                    console.log('User not logged in, redirecting to login');
                    liff.login();
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error('LIFF initialization failed:', errorMessage);
                setError(`LIFF初期化エラー: ${errorMessage}`);
            }
        };
        initializeLiff();
    }, []);
    const handleLogout = () => {
        if (liff.isLoggedIn()) {
            liff.logout();
        }
    };
    if (error) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsx("div", { className: "bg-white p-8 rounded-lg shadow-md max-w-md w-full", children: _jsxs("div", { className: "text-red-600 text-center", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F" }), _jsx("p", { className: "text-sm mb-4", children: error }), _jsx("button", { onClick: () => window.location.reload(), className: "bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600", children: "\u518D\u8AAD\u307F\u8FBC\u307F" })] }) }) }));
    }
    if (!isLiffInitialized) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsx("div", { className: "bg-white p-8 rounded-lg shadow-md", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "LINE\u30ED\u30B0\u30A4\u30F3\u3092\u521D\u671F\u5316\u4E2D..." })] }) }) }));
    }
    if (!isLoggedIn) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsx("div", { className: "bg-white p-8 rounded-lg shadow-md max-w-md w-full", children: _jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Botarhythm Coffee Roaster" }), _jsx("p", { className: "text-gray-600 mb-6", children: "LINE\u30ED\u30B0\u30A4\u30F3\u304C\u5FC5\u8981\u3067\u3059" }), _jsx("button", { onClick: () => liff.login(), className: "bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-medium", children: "LINE\u3067\u30ED\u30B0\u30A4\u30F3" })] }) }) }));
    }
    return (_jsx(Router, { children: _jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("header", { className: "bg-white shadow-sm border-b", children: _jsx("div", { className: "max-w-4xl mx-auto px-4 py-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("h1", { className: "text-xl font-bold text-gray-900", children: "Botarhythm Coffee" }), userProfile && (_jsxs("div", { className: "flex items-center space-x-2", children: [userProfile.pictureUrl && (_jsx("img", { src: userProfile.pictureUrl, alt: userProfile.displayName, className: "w-8 h-8 rounded-full" })), _jsx("span", { className: "text-sm text-gray-600", children: userProfile.displayName })] }))] }), _jsx("button", { onClick: handleLogout, className: "text-sm text-gray-500 hover:text-gray-700", children: "\u30ED\u30B0\u30A2\u30A6\u30C8" })] }) }) }), _jsx("nav", { className: "bg-white shadow-sm", children: _jsx("div", { className: "max-w-4xl mx-auto px-4", children: _jsxs("div", { className: "flex space-x-8", children: [_jsx(Link, { to: "/purchase", className: "px-4 py-3 text-sm font-medium text-gray-700 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600", children: "\u8CFC\u5165\u5C65\u6B74" }), _jsx(Link, { to: "/history", className: "px-4 py-3 text-sm font-medium text-gray-700 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600", children: "\u5C65\u6B74\u4E00\u89A7" })] }) }) }), _jsx("main", { className: "max-w-4xl mx-auto px-4 py-6", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/purchase", element: _jsx(Purchase, { userProfile: userProfile }) }), _jsx(Route, { path: "/history", element: _jsx(History, { userProfile: userProfile }) }), _jsx(Route, { path: "*", element: _jsx(Purchase, { userProfile: userProfile }) })] }) })] }) }));
};
export default App;
//# sourceMappingURL=App.js.map