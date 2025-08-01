require('@testing-library/jest-dom');

// fetch のモック
global.fetch = jest.fn();

// LIFF のモック
global.liff = {
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

// window.liffInitPromise のモック
window.liffInitPromise = Promise.resolve();

// ResizeObserver のモック
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// IntersectionObserver のモック
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));