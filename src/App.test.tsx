import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// import.meta.env のモック
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_LIFF_ID: 'test-liff-id'
  },
  writable: true
});

// React Router のモック
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: ({ element }: { element: React.ReactNode }) => <div>{element}</div>,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

// LIFF のモック
jest.mock('@line/liff', () => ({
  __esModule: true,
  default: {
    init: jest.fn().mockResolvedValue(undefined),
    isLoggedIn: jest.fn().mockReturnValue(true),
    getProfile: jest.fn().mockResolvedValue({
      userId: 'test-user-id',
      displayName: 'Test User',
      pictureUrl: 'https://example.com/avatar.jpg'
    }),
    login: jest.fn(),
    logout: jest.fn()
  }
}));

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<App />);
    expect(screen.getByText('LINEログインを初期化中...')).toBeInTheDocument();
  });

  it('renders login button when not logged in', async () => {
    const liff = require('@line/liff').default;
    liff.isLoggedIn.mockReturnValue(false);

    render(<App />);
    await screen.findByText('LINEでログイン');
    expect(screen.getByText('Botarhythm Coffee Roaster')).toBeInTheDocument();
  });

  it('renders main app when logged in', async () => {
    const liff = require('@line/liff').default;
    liff.isLoggedIn.mockReturnValue(true);

    render(<App />);
    await screen.findByText('Botarhythm Coffee');
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('購入履歴')).toBeInTheDocument();
    expect(screen.getByText('履歴一覧')).toBeInTheDocument();
  });
});