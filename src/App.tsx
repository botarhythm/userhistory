import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import PurchasePage from './pages/purchase';
import HistoryPage from './pages/history';
import CheckinPage from './pages/checkin';
import { DatabaseIntegrityPanel } from './components/DatabaseIntegrityPanel';
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
            <Route path="/admin/integrity" element={<DatabaseIntegrityPanel />} />
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
        <div className="flex justify-between items-center h-16">
          {/* ロゴとアプリ名 */}
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <img src="/assets/symbolmark.gif" alt="Botarhythm Coffee Roaster Symbol" className="h-8 w-8" />
              <h1 className="text-xl font-bold text-gray-900">
                Botarhythm Coffee Roaster
              </h1>
            </div>
          </div>

          {/* ナビゲーション */}
          <nav className="flex space-x-4">
            <Link
              to="/purchase"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname === '/' || location.pathname === '/purchase'
                  ? 'bg-blue-600 text-white'
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
            {user?.userId === 'Ue62b450adbd58fca10963f1c243322dd' && (
              <Link
                to="/admin/integrity"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/admin/integrity'
                    ? 'bg-red-600 text-white'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                管理
              </Link>
            )}
          </nav>

          {/* ユーザー情報 */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <img
                className="h-8 w-8 rounded-full"
                src={user?.pictureUrl || 'https://via.placeholder.com/32x32'}
                alt={user?.displayName || 'ユーザー'}
              />
              <span className="text-sm font-medium text-gray-700">
                {user?.displayName || 'ユーザー'}
              </span>
            </div>
            <button 
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default App; 