import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import History from './history';
import * as LiffContext from '../contexts/LiffContext';

// fetch のモック
global.fetch = jest.fn();

// useLiff のモック
jest.mock('../contexts/LiffContext', () => ({
  useLiff: jest.fn()
}));

// usePageTitle のモック
jest.mock('../hooks/usePageTitle', () => ({
  usePageTitle: jest.fn()
}));

const mockUser = {
  userId: 'test-user-id',
  displayName: 'Test User',
  pictureUrl: 'https://example.com/avatar.jpg'
};

const mockHistoryData = [
  {
    id: '1',
    customerId: 'customer-1',
    type: 'purchase' as const,
    timestamp: '2024-01-01T10:00:00Z',
    items: [{ name: 'テスト商品1', quantity: 1, price: 500 }],
    total: 500,
    memo: 'メモ1'
  },
  {
    id: '2',
    customerId: 'customer-1',
    type: 'checkin' as const,
    timestamp: '2024-01-02T10:00:00Z'
  }
];

// テスト用のラッパーコンポーネント
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('History', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (LiffContext.useLiff as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoggedIn: true,
      liff: {}
    });
  });

  it('renders history page', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ history: [] })
    } as Response);

    render(
      <TestWrapper>
        <History />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/さん/)).toBeInTheDocument();
      expect(screen.getByText('更新')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(
      <TestWrapper>
        <History />
      </TestWrapper>
    );
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('fetches and displays history data including usage', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ history: mockHistoryData })
    } as Response);

    render(
      <TestWrapper>
        <History />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/history/test-user-id?includeUsage=false');
    });

    await waitFor(() => {
      expect(screen.getByText('テスト商品1')).toBeInTheDocument();
      expect(screen.getByText('ご来店・お買い物')).toBeInTheDocument();
      expect(screen.getByText('ご来店・お買い物')).toBeInTheDocument();
    });
  });

  it('shows error when fetch fails', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to fetch history' })
    } as Response);

    render(
      <TestWrapper>
        <History />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/履歴の取得に失敗しました/)).toBeInTheDocument();
    });
    expect(screen.getByText('再読み込み')).toBeInTheDocument();
  });

  it('shows empty state when no history', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ history: [] })
    } as Response);

    render(
      <TestWrapper>
        <History />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('履歴がありません')).toBeInTheDocument();
    });
  });

  it('redirects/shows login message when not logged in', () => {
    (LiffContext.useLiff as jest.Mock).mockReturnValue({
      user: null,
      isLoggedIn: false
    });

    render(
      <TestWrapper>
        <History />
      </TestWrapper>
    );
    expect(screen.getByText('LINEログインが必要です')).toBeInTheDocument();
  });

  it('formats date correctly', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ history: mockHistoryData })
    } as Response);

    render(
      <TestWrapper>
        <History />
      </TestWrapper>
    );

    await waitFor(() => {
      // 2024/01/01
      expect(screen.getByText(/2024\/01\/01/)).toBeInTheDocument();
    });
  });

  it('displays different badges for different types', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ history: mockHistoryData })
    } as Response);

    render(
      <TestWrapper>
        <History />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('購入')).toHaveClass('bg-blue-100');
      expect(screen.getByText('ご来店・お買い物')).toHaveClass('bg-green-100');
      expect(screen.getByText('購入')).toHaveClass('bg-blue-100');
      expect(screen.getByText('ご来店・お買い物')).toHaveClass('bg-green-100');
    });
  });
});
