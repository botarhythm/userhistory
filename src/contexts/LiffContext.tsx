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
  retryLogin: () => void;
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
        // 開発環境でのテスト用設定
        const liffId = import.meta.env.VITE_LIFF_ID;
        if (!liffId) {
          console.warn('LIFF IDが設定されていません。開発環境ではモックユーザーを使用します。');
          setUser({
            userId: 'dev-user-123',
            displayName: '開発用ユーザー',
            pictureUrl: undefined,
            statusMessage: '開発環境'
          });
          setIsLoggedIn(true);
          setIsInitialized(true);
          return;
        }

        // LIFFの初期化
        await liff.init({ liffId });
        
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
          // LINEミニアプリ内でログインしていない場合は自動ログイン
          if (liff.isInClient()) {
            liff.login();
          } else {
            // 外部ブラウザの場合はログイン画面を表示
            console.log('外部ブラウザでアクセスされています');
          }
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

  const retryLogin = () => {
    setError(null);
    setIsInitialized(false);
    if (liff.isInClient() && !liff.isLoggedIn()) {
      liff.login();
    } else {
      window.location.reload();
    }
  };

  const value: LiffContextType = {
    user,
    isInitialized,
    isLoggedIn,
    error,
    logout,
    retryLogin
  };

  return (
    <LiffContext.Provider value={value}>
      {children}
    </LiffContext.Provider>
  );
}; 