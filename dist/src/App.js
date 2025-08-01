import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import liff from "@line/liff";
import Purchase from "./pages/purchase";
import History from "./pages/history";
const App = () => {
    useEffect(() => {
        console.log('liff object:', liff);
        const liffId = (import.meta.env.VITE_LIFF_ID || '').trim();
        console.log('VITE_LIFF_ID:', liffId);
        window.liffInitPromise = (async () => {
            try {
                await liff.init({ liffId });
                console.log("LIFF initialized successfully");
                if (!liff.isLoggedIn()) {
                    liff.login();
                }
            }
            catch (error) {
                console.error("LIFF initialization failed", error);
                alert("LIFF初期化エラー: " + (error instanceof Error ? error.message : String(error)));
            }
        })();
    }, []);
    return (_jsxs(Router, { children: [_jsxs("nav", { className: "flex justify-center gap-4 py-4 bg-white shadow", children: [_jsx(Link, { to: "/purchase", className: "px-4 py-2 rounded hover:bg-blue-100", children: "\u8CFC\u5165\u5C65\u6B74" }), _jsx(Link, { to: "/history", className: "px-4 py-2 rounded hover:bg-gray-100", children: "\u5C65\u6B74\u4E00\u89A7" })] }), _jsxs(Routes, { children: [_jsx(Route, { path: "/purchase", element: _jsx(Purchase, {}) }), _jsx(Route, { path: "/history", element: _jsx(History, {}) }), _jsx(Route, { path: "*", element: _jsx(Purchase, {}) })] })] }));
};
export default App;
