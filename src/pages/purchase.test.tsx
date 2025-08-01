import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Purchase from './purchase';

// LIFFとfetchのモック
vi.mock('@line/liff', () => ({
  default: {
    init: vi.fn(),
    isLoggedIn: vi.fn(() => true),
    getProfile: vi.fn(() => Promise.resolve({ userId: 'test-user-id', displayName: 'Test User' })),
  },
}));

global.fetch = vi.fn();

describe('Purchase Page', () => {
  it('フォームが正しくレンダリングされること', async () => {
    render(<Purchase />);
    expect(screen.getByLabelText('商品名:')).toBeInTheDocument();
    expect(screen.getByLabelText('数量:')).toBeInTheDocument();
    expect(screen.getByLabelText('メモ (任意):')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '購入を記録' })).toBeInTheDocument();
  });

  it('フォーム入力がstateに反映されること', async () => {
    render(<Purchase />);
    const itemNameInput = screen.getByLabelText('商品名:') as HTMLInputElement;
    const quantityInput = screen.getByLabelText('数量:') as HTMLInputElement;
    const memoInput = screen.getByLabelText('メモ (任意):') as HTMLTextAreaElement;

    fireEvent.change(itemNameInput, { target: { value: 'テスト商品' } });
    fireEvent.change(quantityInput, { target: { value: '5' } });
    fireEvent.change(memoInput, { target: { value: 'テストメモ' } });

    expect(itemNameInput.value).toBe('テスト商品');
    expect(quantityInput.value).toBe('5');
    expect(memoInput.value).toBe('テストメモ');
  });

  it('購入記録ボタンクリックでAPIが呼ばれること', async () => {
    (fetch as vi.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({ message: '成功' }) });

    render(<Purchase />);

    // LIFFのプロファイル取得を待つ
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    fireEvent.change(screen.getByLabelText('商品名:'), { target: { value: 'テスト商品' } });
    await act(async () => { // ここにactを追加
      fireEvent.click(screen.getByRole('button', { name: '購入を記録' }));
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/recordPurchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lineUserId: 'test-user-id',
          lineDisplayName: 'Test User',
          itemName: 'テスト商品',
          quantity: 1,
          memo: '',
        }),
      });
    });

    expect(await screen.findByText('成功')).toBeInTheDocument();
  });
});