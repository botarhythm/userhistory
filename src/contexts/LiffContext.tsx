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

  const initializeLiff = async () => {
    try {
      // 開発環境でのテスト用設定
      const liffId = import.meta.env.VITE_LIFF_ID;
      console.log('LIFF初期化開始:', { 
        liffId: liffId ? '設定済み' : '未設定',
        isInClient: liff.isInClient(),
        userAgent: navigator.userAgent,
        location: window.location.href
      });

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

      // LIFFの初期化（タイムアウト付き）
      console.log('LIFF初期化実行中...');
      const initPromise = liff.init({ liffId });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('LIFF初期化タイムアウト')), 10000)
      );
      
      await Promise.race([initPromise, timeoutPromise]);
      console.log('LIFF初期化完了');
      
      // ログイン状態の確認
      const isLoggedIn = liff.isLoggedIn();
      const isInClient = liff.isInClient();
      console.log('LIFFログイン状態:', { isLoggedIn, isInClient });

      if (isLoggedIn) {
        console.log('LIFFログイン済み - プロフィール取得中');
        try {
          const profile = await liff.getProfile();
          setUser({
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
            statusMessage: profile.statusMessage
          });
          setIsLoggedIn(true);
          console.log('ユーザープロフィール取得完了:', profile.displayName);
        } catch (profileError) {
          console.error('プロフィール取得エラー:', profileError);
          setError('ユーザー情報の取得に失敗しました');
        }
      } else {
        console.log('LIFF未ログイン - ログイン処理開始');
        // LINEミニアプリ内でログインしていない場合は自動ログイン
        if (isInClient) {
          console.log('LINEミニアプリ内 - 自動ログイン実行');
          liff.login();
        } else {
          // 外部ブラウザの場合はログイン画面を表示
          console.log('外部ブラウザでアクセスされています - ログイン画面表示');
          // 外部ブラウザでは自動ログインは行わず、ユーザーに手動ログインを促す
          // ここでは何もしない（ログイン画面を表示するだけ）
          // ユーザーが「再読み込み」ボタンを押したときにretryLoginが呼ばれる
          // 外部ブラウザでは、ユーザーが明示的にログインを選択する必要がある
          // 外部ブラウザでは、isLoggedInがfalseのままなので、ログイン画面が表示される
        }
      }
      
      setIsInitialized(true);
    } catch (err) {
      console.error('LIFF初期化エラー:', err);
      const errorMessage = err instanceof Error ? err.message : 'LIFF初期化に失敗しました';
      setError(errorMessage);
      setIsInitialized(true);
    }
  };

  useEffect(() => {
    initializeLiff();
  }, []);

  const logout = () => {
    if (liff.isLoggedIn()) {
      liff.logout();
    }
    setUser(null);
    setIsLoggedIn(false);
  };

  const retryLogin = async () => {
    console.log('再ログイン処理開始:', {
      isInClient: liff.isInClient(),
      userAgent: navigator.userAgent,
      location: window.location.href
    });
    setError(null);
    setIsInitialized(false);
    
    try {
      const liffId = import.meta.env.VITE_LIFF_ID;
      if (!liffId) {
        console.log('LIFF ID未設定 - ページリロード');
        window.location.reload();
        return;
      }

      // LIFFが初期化されているかチェック
      if (liff.isInClient()) {
        console.log('LINEミニアプリ内 - 再ログイン処理');
        // LINEミニアプリ内の場合
        if (!liff.isLoggedIn()) {
          console.log('未ログイン - ログイン実行');
          liff.login();
        } else {
          console.log('既にログイン済み - 再初期化実行');
          // 既にログイン済みの場合は再初期化
          await initializeLiff();
        }
      } else {
        console.log('外部ブラウザ - 再ログイン処理');
        // 外部ブラウザの場合
        try {
          // LIFFを再初期化
          console.log('外部ブラウザ - LIFF再初期化開始');
          await liff.init({ liffId });
          console.log('外部ブラウザ - LIFF再初期化完了');
          
          const isLoggedIn = liff.isLoggedIn();
          console.log('外部ブラウザ - ログイン状態:', { isLoggedIn });
          
          if (isLoggedIn) {
            console.log('外部ブラウザ - 既にログイン済み - プロフィール取得');
            const profile = await liff.getProfile();
            setUser({
              userId: profile.userId,
              displayName: profile.displayName,
              pictureUrl: profile.pictureUrl,
              statusMessage: profile.statusMessage
            });
            setIsLoggedIn(true);
            setIsInitialized(true);
          } else {
            console.log('外部ブラウザ - 未ログイン - ログイン実行');
            liff.login();
          }
        } catch (initError) {
          console.error('外部ブラウザ - LIFF再初期化エラー:', initError);
          // 初期化に失敗した場合はページをリロード
          window.location.reload();
        }
      }
    } catch (err) {
      console.error('再ログインエラー:', err);
      const errorMessage = err instanceof Error ? err.message : '再ログインに失敗しました';
      setError(errorMessage);
      setIsInitialized(true);
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