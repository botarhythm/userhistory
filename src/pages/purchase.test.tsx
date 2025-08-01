import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Purchase from './purchase';

// fetch のモック
global.fetch = jest.fn();

const mockUserProfile = {
  userId: 'test-user-id',
  displayName: 'Test User',
  pictureUrl: 'https://example.com/avatar.jpg'
};

describe('Purchase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders purchase form', () => {
    render(<Purchase userProfile={mockUserProfile} />);
    expect(screen.getByRole('heading', { name: '購入履歴を記録' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('商品名')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('数量')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('価格')).toBeInTheDocument();
    expect(screen.getByText('商品を追加')).toBeInTheDocument();
  });

  it('adds new item when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<Purchase userProfile={mockUserProfile} />);
    const addButton = screen.getByText('商品を追加');
    await user.click(addButton);
    const itemInputs = screen.getAllByPlaceholderText('商品名');
    expect(itemInputs).toHaveLength(2);
  });

  it('removes item when remove button is clicked', async () => {
    const user = userEvent.setup();
    render(<Purchase userProfile={mockUserProfile} />);
    const addButton = screen.getByText('商品を追加');
    await user.click(addButton);
    // 最初の商品を削除
    const removeButtons = screen.getAllByRole('button').filter(button => 
      button.innerHTML.includes('M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16')
    );
    if (removeButtons[0]) {
      await user.click(removeButtons[0] as Element);
    }
    const itemInputs = screen.getAllByPlaceholderText('商品名');
    expect(itemInputs).toHaveLength(1);
  });

  it('calculates total correctly', async () => {
    const user = userEvent.setup();
    render(<Purchase userProfile={mockUserProfile} />);
    const nameInput = screen.getByPlaceholderText('商品名');
    const quantityInput = screen.getByPlaceholderText('数量');
    const priceInput = screen.getByPlaceholderText('価格');
    await user.type(nameInput, 'テスト商品');
    await user.clear(quantityInput);
    await user.type(quantityInput, '2');
    await user.clear(priceInput);
    await user.type(priceInput, '500');
    await waitFor(() => {
      expect(screen.getByText('¥6,000')).toBeInTheDocument();
    });
  });

  it('submits purchase successfully', async () => {
    const user = userEvent.setup();
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Purchase recorded' })
    } as Response);
    render(<Purchase userProfile={mockUserProfile} />);
    const nameInput = screen.getByPlaceholderText('商品名');
    const priceInput = screen.getByPlaceholderText('価格');
    const submitButton = screen.getByRole('button', { name: '購入履歴を記録' });
    await user.type(nameInput, 'テスト商品');
    await user.clear(priceInput);
    await user.type(priceInput, '500');
    await user.click(submitButton);
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"lineUid":"test-user-id"'),
      });
    });
    await waitFor(() => {
      expect(screen.getByText('購入履歴を記録しました！')).toBeInTheDocument();
    });
  });

  it('shows error when submission fails', async () => {
    const user = userEvent.setup();
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Submission failed' })
    } as Response);
    render(<Purchase userProfile={mockUserProfile} />);
    const nameInput = screen.getByPlaceholderText('商品名');
    const priceInput = screen.getByPlaceholderText('価格');
    const submitButton = screen.getByRole('button', { name: '購入履歴を記録' });
    await user.type(nameInput, 'テスト商品');
    await user.clear(priceInput);
    await user.type(priceInput, '500');
    await user.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText('Submission failed')).toBeInTheDocument();
    });
  });

  it('shows error when user profile is null', async () => {
    render(<Purchase userProfile={null} />);
    const submitButton = screen.getByRole('button', { name: '購入履歴を記録' });
    await userEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText('ユーザー情報が取得できません')).toBeInTheDocument();
    });
  });
});