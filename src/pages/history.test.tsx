import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import History from './history';

// fetch のモック
global.fetch = jest.fn();

const mockUserProfile = {
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

describe('History', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders history page', () => {
    render(<History userProfile={mockUserProfile} />);
    expect(screen.getByText('履歴一覧')).toBeInTheDocument();
    expect(screen.getByText('すべて')).toBeInTheDocument();
    expect(screen.getByText('来店')).toBeInTheDocument();
    expect(screen.getByText('購入')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<History userProfile={mockUserProfile} />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('fetches and displays history data', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ history: mockHistoryData })
    } as Response);
    render(<History userProfile={mockUserProfile} />);
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/history/test-user-id?limit=50');
    });
    await waitFor(() => {
      expect(screen.getByText('テスト商品1 x1')).toBeInTheDocument();
      expect(screen.getByText('¥500')).toBeInTheDocument();
      expect(screen.getByText('メモ1')).toBeInTheDocument();
    });
  });

  it('filters history by type', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ history: mockHistoryData })
    } as Response);
    const user = userEvent.setup();
    render(<History userProfile={mockUserProfile} />);
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/history/test-user-id?limit=50');
    });
    const purchaseFilter = screen.getByText('購入');
    await user.click(purchaseFilter);
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/history/test-user-id?type=purchase&limit=50');
    });
  });

  it('shows error when fetch fails', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to fetch history' })
    } as Response);
    render(<History userProfile={mockUserProfile} />);
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch history')).toBeInTheDocument();
    });
    expect(screen.getByText('再試行')).toBeInTheDocument();
  });

  it('shows empty state when no history', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ history: [] })
    } as Response);
    render(<History userProfile={mockUserProfile} />);
    await waitFor(() => {
      expect(screen.getByText('履歴がありません')).toBeInTheDocument();
      expect(screen.getByText('初回の来店や購入を記録してみてください')).toBeInTheDocument();
    });
  });

  it('shows error when user profile is null', () => {
    render(<History userProfile={null} />);
    expect(screen.getByText('ユーザー情報が取得できません')).toBeInTheDocument();
  });

  it('formats date correctly', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ history: mockHistoryData })
    } as Response);
    render(<History userProfile={mockUserProfile} />);
    await waitFor(() => {
      expect(screen.getByText(/2024年1月1日/)).toBeInTheDocument();
    });
  });

  it('displays different badges for different types', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ history: mockHistoryData })
    } as Response);
    render(<History userProfile={mockUserProfile} />);
    await waitFor(() => {
      expect(screen.getByText('購入')).toBeInTheDocument();
      expect(screen.getByText('来店')).toBeInTheDocument();
    });
  });
});
