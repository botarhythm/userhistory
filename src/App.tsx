import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import PurchasePage from './pages/purchase';
import HistoryPage from './pages/history';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Routes>
          <Route path="/" element={<PurchasePage />} />
          <Route path="/purchase" element={<PurchasePage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </div>
    </Router>
  );
};

const Header: React.FC = () => {
  const location = useLocation();
  const [userProfile] = useState({
    displayName: '元沢 信昭',
    pictureUrl: 'https://via.placeholder.com/32x32'
  });

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ロゴとアプリ名 */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">
              Botarhythm Coffee
            </h1>
          </div>

          {/* ナビゲーション */}
          <nav className="flex space-x-8">
            <Link
              to="/purchase"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname === '/' || location.pathname === '/purchase'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              購入履歴
            </Link>
            <Link
              to="/history"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname === '/history'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              履歴一覧
            </Link>
          </nav>

          {/* ユーザー情報 */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <img
                className="h-8 w-8 rounded-full"
                src={userProfile.pictureUrl}
                alt={userProfile.displayName}
              />
              <span className="text-sm font-medium text-gray-700">
                {userProfile.displayName}
              </span>
            </div>
            <button className="text-sm text-gray-500 hover:text-gray-700">
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default App; 