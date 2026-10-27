import { render, screen } from '@testing-library/react';
import App from './App';

// LIFF のモック
jest.mock('@line/liff', () => ({
  __esModule: true,
  default: {
    init: jest.fn().mockResolvedValue(undefined),
    isInClient: jest.fn().mockReturnValue(false),
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
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ products: [] })
    });
  });

  it('renders loading state initially', () => {
    render(<App />);
    expect(screen.getByText('LINEログイン中...')).toBeInTheDocument();
  });

  it('renders login prompt when not logged in', async () => {
    const liff = require('@line/liff').default;
    liff.isLoggedIn.mockReturnValue(false);

    render(<App />);
    await screen.findByText('LINEログインが必要です');
    expect(screen.getByText('Botarhythm Coffee Roaster')).toBeInTheDocument();
  });

  it('renders main app when logged in', async () => {
    const liff = require('@line/liff').default;
    liff.isLoggedIn.mockReturnValue(true);

    render(<App />);
    await screen.findByText('Test User');
    expect(screen.getByText('☕ 作成')).toBeInTheDocument();
    expect(screen.getByText('📝 履歴')).toBeInTheDocument();
  });
});
