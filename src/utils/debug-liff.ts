/**
 * LIFF認証デバッグユーティリティ
 * LINE認証の問題を診断するためのツール
 */

export interface LiffDebugInfo {
  timestamp: string;
  userAgent: string;
  location: string;
  liffId: string | null;
  isInClient: boolean;
  isLoggedIn: boolean;
  error: string | null;
  environment: string;
}

export class LiffDebugger {
  private static instance: LiffDebugger;
  private debugInfo: LiffDebugInfo | null = null;

  static getInstance(): LiffDebugger {
    if (!LiffDebugger.instance) {
      LiffDebugger.instance = new LiffDebugger();
    }
    return LiffDebugger.instance;
  }

  /**
   * 現在のLIFF状態を診断
   */
  async diagnose(): Promise<LiffDebugInfo> {
    const liff = (await import('@line/liff')).default;

    const debugInfo: LiffDebugInfo = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      location: window.location.href,
      liffId: import.meta.env['VITE_LIFF_ID'] || null,
      isInClient: false,
      isLoggedIn: false,
      error: null,
      environment: import.meta.env.MODE || 'unknown'
    };

    try {
      // LIFFが初期化されているかチェック
      debugInfo.isInClient = liff.isInClient();
      debugInfo.isLoggedIn = liff.isLoggedIn();
    } catch (error) {
      debugInfo.error = error instanceof Error ? error.message : 'Unknown error';
    }

    this.debugInfo = debugInfo;
    return debugInfo;
  }

  /**
   * 診断結果をコンソールに出力
   */
  logDiagnosis(): void {
    if (!this.debugInfo) {
      console.error('診断情報がありません。diagnose()を先に実行してください。');
      return;
    }

    console.group('🔍 LIFF認証診断結果');
    console.log('📅 診断時刻:', this.debugInfo.timestamp);
    console.log('🌐 環境:', this.debugInfo.environment);
    console.log('📍 URL:', this.debugInfo.location);
    console.log('🔑 LIFF ID:', this.debugInfo.liffId ? '✅ 設定済み' : '❌ 未設定');
    console.log('📱 LINEアプリ内:', this.debugInfo.isInClient ? '✅ はい' : '❌ いいえ');
    console.log('🔐 ログイン状態:', this.debugInfo.isLoggedIn ? '✅ ログイン済み' : '❌ 未ログイン');

    if (this.debugInfo.error) {
      console.error('❌ エラー:', this.debugInfo.error);
    }

    // 推奨アクションを表示
    console.group('💡 推奨アクション');
    if (!this.debugInfo.liffId) {
      console.warn('⚠️ LIFF IDが設定されていません');
      console.log('   1. RailwayダッシュボードでVITE_LIFF_IDを設定');
      console.log('   2. アプリケーションを再デプロイ');
    } else if (!this.debugInfo.isInClient) {
      console.warn('⚠️ LINEアプリ外でアクセスしています');
      console.log('   1. LINEアプリからミニアプリを開く');
      console.log('   2. または外部ブラウザでログインを試行');
    } else if (!this.debugInfo.isLoggedIn) {
      console.warn('⚠️ LINEにログインしていません');
      console.log('   1. LINEアプリでログイン状態を確認');
      console.log('   2. ミニアプリを再起動');
    } else {
      console.log('✅ 認証状態は正常です');
    }
    console.groupEnd();
    console.groupEnd();
  }

  /**
   * 診断結果をJSON形式で取得
   */
  getDiagnosisJson(): string {
    return JSON.stringify(this.debugInfo, null, 2);
  }

  /**
   * 環境変数の設定状況をチェック
   */
  checkEnvironmentVariables(): void {
    console.group('🔧 環境変数チェック');

    const requiredVars = [
      'VITE_LIFF_ID',
      'NODE_ENV'
    ];

    const optionalVars = [
      'NOTION_API_KEY',
      'NOTION_CUSTOMER_DB_ID',
      'NOTION_HISTORY_DB_ID'
    ];

    console.log('📋 必須環境変数:');
    requiredVars.forEach(varName => {
      const value = import.meta.env[varName];
      console.log(`   ${varName}:`, value ? '✅ 設定済み' : '❌ 未設定');
    });

    console.log('📋 オプション環境変数:');
    optionalVars.forEach(varName => {
      const value = import.meta.env[varName];
      console.log(`   ${varName}:`, value ? '✅ 設定済み' : '⚠️ 未設定');
    });

    console.groupEnd();
  }

  /**
   * 自動修復を試行
   */
  async attemptAutoFix(): Promise<boolean> {
    console.log('🔧 自動修復を試行中...');

    try {
      const liff = (await import('@line/liff')).default;
      const liffId = import.meta.env['VITE_LIFF_ID'];

      if (!liffId) {
        console.error('❌ LIFF IDが設定されていないため、自動修復できません');
        return false;
      }

      // LIFFの再初期化を試行
      if (!liff.isLoggedIn()) {
        console.log('🔄 LIFFの再初期化を実行...');
        await liff.init({ liffId });

        if (liff.isLoggedIn()) {
          console.log('✅ 自動修復が成功しました');
          return true;
        } else {
          console.log('🔄 ログイン処理を実行...');
          liff.login();
          return false; // ログインは非同期のため、結果は別途確認が必要
        }
      } else {
        console.log('✅ 既にログイン済みです');
        return true;
      }
    } catch (error) {
      console.error('❌ 自動修復に失敗:', error);
      return false;
    }
  }
}

// グローバルにデバッガーを公開（開発用）
if (import.meta.env.DEV) {
  (window as any).liffDebugger = LiffDebugger.getInstance();
}
