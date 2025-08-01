import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import liff from "@line/liff";
import Purchase from "./pages/purchase";
import History from "./pages/history";

const App: React.FC = () => {
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
      } catch (error) {
        console.error("LIFF initialization failed", error);
        alert("LIFF初期化エラー: " + (error instanceof Error ? error.message : String(error)));
      }
    })();
  }, []);

  return (
    <Router>
      <nav className="flex justify-center gap-4 py-4 bg-white shadow">
        <Link to="/purchase" className="px-4 py-2 rounded hover:bg-blue-100">購入履歴</Link>
        <Link to="/history" className="px-4 py-2 rounded hover:bg-gray-100">履歴一覧</Link>
      </nav>
      <Routes>
        <Route path="/purchase" element={<Purchase />} />
        <Route path="/history" element={<History />} />
        <Route path="*" element={<Purchase />} />
      </Routes>
    </Router>
  );
};

export default App; 