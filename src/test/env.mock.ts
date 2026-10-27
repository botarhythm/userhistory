/**
 * テスト用の環境変数（src/config/env.ts の差し替え）
 */

export const env: Record<string, string | boolean | undefined> = {
  VITE_LIFF_ID: 'test-liff-id',
  MODE: 'test',
  BASE_URL: '/',
  DEV: false,
  PROD: false,
  SSR: false,
};
