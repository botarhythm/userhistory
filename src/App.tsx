import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import PurchasePage from './pages/purchase';
import HistoryPage from './pages/history';
import CheckinPage from './pages/checkin';
import { LiffProvider, useLiff } from './contexts/LiffContext';

const App: React.FC = () => {
  return (
    <LiffProvider>
      <Router>
                 <div className="min-h-screen bg-gray-100">
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
  const { user, isInitialized, isLoggedIn, logout, error, retryLogin } = useLiff();

  // LINEブラウザでのタイトル制御
  useEffect(() => {
    // LINEブラウザでのURL表示を制御
    if (typeof window !== 'undefined' && window.navigator.userAgent.includes('Line')) {
      // LINEブラウザの場合、より短いタイトルを使用
      document.title = 'Botarhythm';
      
      // 動的にメタタグを追加してURL表示を抑制
      const addMetaTag = (name: string, content: string) => {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', name);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };
      
      // 追加のメタタグを設定
      addMetaTag('apple-mobile-web-app-capable', 'yes');
      addMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');
      addMetaTag('format-detection', 'telephone=no');
      addMetaTag('format-detection', 'address=no');
      addMetaTag('format-detection', 'email=no');
      
      // 数秒後に少し長いタイトルに変更
      const timer = setTimeout(() => {
        document.title = 'Botarhythm Coffee';
      }, 1500);
      
      return () => {
        clearTimeout(timer);
        document.title = 'Botarhythm Coffee Roaster';
      };
    } else {
      // 通常のブラウザでは元のタイトルを使用
      document.title = 'Botarhythm Coffee Roaster';
    }
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 text-center">
          <div className="flex items-center justify-center mb-4">
            <img src="/assets/symbolmark.gif" alt="Botarhythm Coffee Roaster Symbol" className="h-12 w-12" />
            <h1 className="text-2xl font-bold text-gray-900 ml-3">
              Botarhythm Coffee Roaster
            </h1>
          </div>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            <span className="ml-3 text-lg text-gray-600">LINEログイン中...</span>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            LINEアカウントでの認証を完了してください
          </p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 text-center max-w-md mx-4">
          <div className="flex items-center justify-center mb-6">
            <img src="/assets/symbolmark.gif" alt="Botarhythm Coffee Roaster Symbol" className="h-12 w-12" />
            <h1 className="text-2xl font-bold text-gray-900 ml-3">
              Botarhythm Coffee Roaster
            </h1>
          </div>
          {error ? (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                ログインエラー
              </h2>
              <p className="text-gray-600 mb-6">
                {error}
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                LINEログインが必要です
              </h2>
              <p className="text-gray-600 mb-6">
                購入メモを記録するにはLINEアカウントでログインしてください
              </p>
            </>
          )}
          <button
            onClick={retryLogin}
            className="bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 transition-colors"
          >
            {error ? '再試行' : '再読み込み'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <header className="bg-white shadow-md border-b border-gray-200">
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
                ? 'bg-green-500 text-white'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            購入メモ
          </Link>
          <Link
            to="/history"
            className={`flex-1 sm:flex-none px-3 py-2 rounded-md text-sm font-medium text-center ${
              location.pathname === '/history'
                ? 'bg-blue-500 text-white'
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