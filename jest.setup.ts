import '@testing-library/jest-dom';

// fetch のモック
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// LIFF のモック
interface MockLiff {
    init: jest.MockedFunction<(config: { liffId: string }) => Promise<void>>;
    isLoggedIn: jest.MockedFunction<() => boolean>;
    getProfile: jest.MockedFunction<() => Promise<{
        userId: string;
        displayName: string;
        pictureUrl: string;
    }>>;
    login: jest.MockedFunction<() => void>;
    logout: jest.MockedFunction<() => void>;
}

const mockLiff: MockLiff = {
    init: jest.fn().mockResolvedValue(undefined),
    isLoggedIn: jest.fn().mockReturnValue(true),
    getProfile: jest.fn().mockResolvedValue({
        userId: 'test-user-id',
        displayName: 'Test User',
        pictureUrl: 'https://example.com/avatar.jpg'
    }),
    login: jest.fn(),
    logout: jest.fn()
};

(global as any).liff = mockLiff;

// window.liffInitPromise のモック
declare global {
    interface Window {
        liffInitPromise: Promise<void>;
    }
}

(window as any).liffInitPromise = Promise.resolve();

// ResizeObserver のモック
global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
})) as any;

// IntersectionObserver のモック
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
})) as any;
