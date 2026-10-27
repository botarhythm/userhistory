import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    moduleNameMapper: {
        // import.meta を含む src/config/env.ts をテスト用の値に差し替える
        '^(\\.{1,2}/)+config/env$': '<rootDir>/src/test/env.mock.ts',
        '^@/(.*)$': '<rootDir>/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    // <rootDir> を testMatch に含めると Windows でパス区切りが混ざって 0 件になるため roots で絞る
    roots: ['<rootDir>/src'],
    testMatch: [
        '**/*.test.(ts|tsx)',
        '**/*.spec.(ts|tsx)'
    ],
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/main.tsx',
        '!src/vite-env.d.ts'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/'
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.json',
            useESM: true,
        },
    },
};

export default config;
