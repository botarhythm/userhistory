import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import History from './history';

// LIFFとfetchのモック
vi.mock('@line/liff', () => ({
  default: {
    init: vi.fn(),
    isLoggedIn: vi.fn(() => true),
    getProfile: vi.fn(() => Promise.resolve({ userId: 'test-user-id', displayName: 'Test User' })),
  },
}));

global.fetch = vi.fn();

describe('History Page', () => {
  it('履歴が正しく表示されること', async () => {
    const mockHistories = [
      { id: '1', itemName: 'テスト商品1', quantity: 1, date: new Date().toISOString(), memo: 'メモ1' },
      { id: '2', itemName: 'テスト商品2', quantity: 2, date: new Date().toISOString(), memo: '' },
    ];
    (fetch as vi.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({ histories: mockHistories }) });

    render(<History />);

    expect(await screen.findByText('テスト商品1')).toBeInTheDocument();
    expect(screen.getByText('x1')).toBeInTheDocument();
    expect(screen.getByText('メモ: メモ1')).toBeInTheDocument();
    expect(screen.getByText('テスト商品2')).toBeInTheDocument();
    expect(screen.getByText('x2')).toBeInTheDocument();
  });

  it('履歴がない場合にメッセージが表示されること', async () => {
    (fetch as vi.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({ histories: [] }) });

    render(<History />);

    expect(await screen.findByText('履歴がありません。')).toBeInTheDocument();
  });

  it('APIエラー時にエラーメッセージが表示されること', async () => {
    (fetch as vi.Mock).mockResolvedValue({ ok: false, status: 500 });

    render(<History />);

    expect(await screen.findByText('履歴取得に失敗しました')).toBeInTheDocument();
  });
});
