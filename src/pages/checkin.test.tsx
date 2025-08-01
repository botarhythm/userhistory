import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CheckinPage from './checkin';

// fetchのモック
global.fetch = jest.fn();

const mockNavigate = jest.fn();

// React Routerのモック
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('CheckinPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    // alertのモック
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders checkin page with correct elements', () => {
    renderWithRouter(<CheckinPage />);
    
    expect(screen.getByText('来店チェックイン')).toBeInTheDocument();
    expect(screen.getByText('Botarhythm Coffee Roasterに来店しました')).toBeInTheDocument();
    expect(screen.getByText('チェックインする')).toBeInTheDocument();
    expect(screen.getByText('履歴を確認')).toBeInTheDocument();
  });

  it('displays current time', () => {
    renderWithRouter(<CheckinPage />);
    
    const now = new Date();
    const timeString = now.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    expect(screen.getByText(timeString)).toBeInTheDocument();
  });

  it('allows memo input', () => {
    renderWithRouter(<CheckinPage />);
    
    const memoInput = screen.getByPlaceholderText('特記事項があれば入力してください');
    fireEvent.change(memoInput, { target: { value: 'テストメモ' } });
    
    expect(memoInput).toHaveValue('テストメモ');
  });

  it('handles successful checkin', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Check-in recorded' })
    });

    renderWithRouter(<CheckinPage />);
    
    const checkinButton = screen.getByText('チェックインする');
    fireEvent.click(checkinButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"lineUid":"test-user"'),
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/history');
    });
  });

  it('handles checkin with memo', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Check-in recorded' })
    });

    renderWithRouter(<CheckinPage />);
    
    const memoInput = screen.getByPlaceholderText('特記事項があれば入力してください');
    fireEvent.change(memoInput, { target: { value: 'テストメモ' } });
    
    const checkinButton = screen.getByText('チェックインする');
    fireEvent.click(checkinButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"memo":"テストメモ"'),
      });
    });
  });

  it('handles checkin error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Check-in failed' })
    });

    renderWithRouter(<CheckinPage />);
    
    const checkinButton = screen.getByText('チェックインする');
    fireEvent.click(checkinButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('エラー: Check-in failed');
    });
  });

  it('handles network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    renderWithRouter(<CheckinPage />);
    
    const checkinButton = screen.getByText('チェックインする');
    fireEvent.click(checkinButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('チェックインの記録に失敗しました');
    });
  });

  it('navigates to history page when history button is clicked', () => {
    renderWithRouter(<CheckinPage />);
    
    const historyButton = screen.getByText('履歴を確認');
    fireEvent.click(historyButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/history');
  });

  it('shows loading state during checkin', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    renderWithRouter(<CheckinPage />);
    
    const checkinButton = screen.getByText('チェックインする');
    fireEvent.click(checkinButton);

    expect(screen.getByText('チェックイン中...')).toBeInTheDocument();
    expect(checkinButton).toBeDisabled();
  });
}); 