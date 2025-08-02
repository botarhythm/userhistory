import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import PurchasePage from './pages/purchase';
import HistoryPage from './pages/history';
import CheckinPage from './pages/checkin';
import { LiffProvider, useLiff } from './contexts/LiffContext';

const App: React.FC = () => {
  return (
    <LiffProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Routes>
            <Route path="/" element={<PurchasePage />} />
            <Route path="/checkin" element={<CheckinPage />} />
            <Route path="/purchase" element={<PurchasePage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </div>
      </Router>
    </LiffProvider>
  );
};

const Header: React.FC = () => {
  const location = useLocation();
  const { user, isInitialized, isLoggedIn, logout } = useLiff();

  if (!isInitialized) {
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <img src="/assets/symbolmark.gif" alt="Botarhythm Coffee Roaster Symbol" className="h-8 w-8" />
                <h1 className="text-xl font-bold text-gray-900">
                  Botarhythm Coffee Roaster
                </h1>
              </div>
            </div>
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">読み込み中...</span>
            </div>
          </div>
        </div>
      </header>
    );
  }

  if (!isLoggedIn) {
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <img src="/assets/symbolmark.gif" alt="Botarhythm Coffee Roaster Symbol" className="h-8 w-8" />
                <h1 className="text-xl font-bold text-gray-900">
                  Botarhythm Coffee Roaster
                </h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-600">LINEログインが必要です</span>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 最上部: LINEユーザー情報 */}
        <div className="flex justify-between items-center py-3">
          {/* 左側: LINEアイコンと表示名 */}
          <div className="flex items-center space-x-3">
            <img
              className="h-8 w-8 rounded-full"
              src={user?.pictureUrl || 'https://via.placeholder.com/32x32'}
              alt={user?.displayName || 'ユーザー'}
            />
            <span className="text-sm font-medium text-gray-700 truncate max-w-[150px] sm:max-w-[200px]">
              {user?.displayName || 'ユーザー'}
            </span>
          </div>

          {/* 右側: ログアウトボタン */}
          <button 
            onClick={logout}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100"
          >
            ログアウト
          </button>
        </div>

        {/* 中央: ロゴとブランド名（クリック可能） */}
        <div className="flex justify-center items-center py-3 border-t border-gray-100">
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <img src="/assets/symbolmark.gif" alt="Botarhythm Coffee Roaster Symbol" className="h-8 w-8" />
            <h1 className="text-lg font-bold text-gray-900">
              Botarhythm Coffee Roaster
            </h1>
          </Link>
        </div>

        {/* ナビゲーション: モバイルではタブ形式 */}
        <nav className="flex space-x-1 sm:space-x-4 pb-2 sm:pb-0">
          <Link
            to="/purchase"
            className={`flex-1 sm:flex-none px-3 py-2 rounded-md text-sm font-medium text-center ${
              location.pathname === '/' || location.pathname === '/purchase'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            購入履歴を記録
          </Link>
          <Link
            to="/history"
            className={`flex-1 sm:flex-none px-3 py-2 rounded-md text-sm font-medium text-center ${
              location.pathname === '/history'
                ? 'bg-purple-600 text-white'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            履歴一覧
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default App; 