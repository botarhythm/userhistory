import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Purchase from './purchase';
import * as LiffContext from '../contexts/LiffContext';

const mockNavigate = jest.fn();

// React Router のモック
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

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

const mockProducts = [
  { id: 'p1', name: 'エチオピア', order: 1, available: true },
  { id: 'p2', name: 'ケニア', order: 2, available: true }
];

const mockUseLiff = (isLoggedIn: boolean) => {
  (LiffContext.useLiff as jest.Mock).mockReturnValue({
    user: isLoggedIn ? mockUser : null,
    isLoggedIn
  });
};

// 1 回目の fetch は商品一覧
const mockProductsResponse = () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ products: mockProducts })
  });
};

describe('Purchase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows login prompt when not logged in', () => {
    mockUseLiff(false);
    mockProductsResponse();
    render(<Purchase />);
    expect(screen.getByText('LINEログインが必要です')).toBeInTheDocument();
  });

  it('renders products from API with "その他"', async () => {
    mockUseLiff(true);
    mockProductsResponse();
    render(<Purchase />);
    expect(screen.getByRole('heading', { name: '購入メモ' })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: 'エチオピア' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'ケニア' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'その他' })).toBeInTheDocument();
  });

  it('alerts when no product is selected', async () => {
    const user = userEvent.setup();
    mockUseLiff(true);
    mockProductsResponse();
    render(<Purchase />);
    await screen.findByRole('option', { name: 'エチオピア' });
    await user.click(screen.getByRole('button', { name: '記録する' }));
    expect(window.alert).toHaveBeenCalledWith('商品を選択してください');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('submits selected product and memo', async () => {
    const user = userEvent.setup();
    mockUseLiff(true);
    mockProductsResponse();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });
    render(<Purchase />);
    await screen.findByRole('option', { name: 'エチオピア' });
    await user.selectOptions(screen.getByRole('combobox'), 'p1');
    await user.type(screen.getByPlaceholderText('味の感想や備考を入力...'), 'フルーティー');
    await user.click(screen.getByRole('button', { name: '記録する' }));

    await screen.findByText('記録完了');
    const [url, init] = (global.fetch as jest.Mock).mock.calls[1];
    expect(url).toBe('/api/purchase');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({
      lineUid: 'test-user-id',
      displayName: 'Test User',
      items: [{ name: 'エチオピア', quantity: 1, price: 0 }],
      total: 1,
      memo: 'フルーティー'
    });
  });

  it('alerts the API error when submission fails', async () => {
    const user = userEvent.setup();
    mockUseLiff(true);
    mockProductsResponse();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Submission failed' })
    });
    render(<Purchase />);
    await screen.findByRole('option', { name: 'エチオピア' });
    await user.selectOptions(screen.getByRole('combobox'), 'p1');
    await user.click(screen.getByRole('button', { name: '記録する' }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('エラー: Submission failed');
    });
    expect(screen.queryByText('記録完了')).not.toBeInTheDocument();
  });
});
