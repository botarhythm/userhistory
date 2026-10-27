/**
 * Vite の環境変数の読み口
 * jest（ts-jest・CommonJS）は import.meta を扱えないため、テストでは
 * jest.config.ts の moduleNameMapper で src/test/env.mock.ts に差し替える
 */

export const env: ImportMetaEnv = import.meta.env;
