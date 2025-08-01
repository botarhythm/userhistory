import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import liff from "@line/liff";
import Purchase from "./pages/purchase";
import History from "./pages/history";

interface UserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

const App: React.FC = () => {
  const [isLiffInitialized, setIsLiffInitialized] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        } else {
          console.log('User not logged in, redirecting to login');
          liff.login();
        }
      } catch (error) {
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-600 text-center">
            <h2 className="text-xl font-bold mb-4">エラーが発生しました</h2>
            <p className="text-sm mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              再読み込み
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isLiffInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">LINEログインを初期化中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Botarhythm Coffee Roaster</h2>
            <p className="text-gray-600 mb-6">LINEログインが必要です</p>
            <button 
              onClick={() => liff.login()} 
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-medium"
            >
              LINEでログイン
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* ヘッダー */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-bold text-gray-900">Botarhythm Coffee</h1>
                {userProfile && (
                  <div className="flex items-center space-x-2">
                    {userProfile.pictureUrl && (
                      <img 
                        src={userProfile.pictureUrl} 
                        alt={userProfile.displayName}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span className="text-sm text-gray-600">{userProfile.displayName}</span>
                  </div>
                )}
              </div>
              <button 
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ログアウト
              </button>
            </div>
          </div>
        </header>

        {/* ナビゲーション */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex space-x-8">
              <Link 
                to="/purchase" 
                className="px-4 py-3 text-sm font-medium text-gray-700 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600"
              >
                購入履歴
              </Link>
              <Link 
                to="/history" 
                className="px-4 py-3 text-sm font-medium text-gray-700 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600"
              >
                履歴一覧
              </Link>
            </div>
          </div>
        </nav>

        {/* メインコンテンツ */}
        <main className="max-w-4xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/purchase" element={<Purchase userProfile={userProfile} />} />
            <Route path="/history" element={<History userProfile={userProfile} />} />
            <Route path="*" element={<Purchase userProfile={userProfile} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App; 