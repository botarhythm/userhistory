import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import liff from '@line/liff';

interface LiffUser {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

interface LiffContextType {
  user: LiffUser | null;
  isInitialized: boolean;
  isLoggedIn: boolean;
  error: string | null;
  logout: () => void;
}

const LiffContext = createContext<LiffContextType | undefined>(undefined);

export const useLiff = () => {
  const context = useContext(LiffContext);
  if (context === undefined) {
    throw new Error('useLiff must be used within a LiffProvider');
  }
  return context;
};

interface LiffProviderProps {
  children: ReactNode;
}

export const LiffProvider: React.FC<LiffProviderProps> = ({ children }) => {
  const [user, setUser] = useState<LiffUser | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        // LIFFの初期化
        await liff.init({ liffId: import.meta.env.VITE_LIFF_ID || '' });
        
        // ログイン状態の確認
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          setUser({
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
            statusMessage: profile.statusMessage
          });
          setIsLoggedIn(true);
        } else {
          // ログインしていない場合は自動ログイン
          liff.login();
        }
        
        setIsInitialized(true);
      } catch (err) {
        console.error('LIFF初期化エラー:', err);
        setError(err instanceof Error ? err.message : 'LIFF初期化に失敗しました');
        setIsInitialized(true);
      }
    };

    initializeLiff();
  }, []);

  const logout = () => {
    if (liff.isLoggedIn()) {
      liff.logout();
    }
    setUser(null);
    setIsLoggedIn(false);
  };

  const value: LiffContextType = {
    user,
    isInitialized,
    isLoggedIn,
    error,
    logout
  };

  return (
    <LiffContext.Provider value={value}>
      {children}
    </LiffContext.Provider>
  );
}; 