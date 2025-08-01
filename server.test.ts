import request from 'supertest';
import express from 'express';
import { vi } from 'vitest';

// モックの設定
vi.mock('./src/api/notion', () => ({
  findOrCreateCustomer: vi.fn(),
  recordPurchase: vi.fn(),
  getHistory: vi.fn(),
}));

// server.tsのコードをインポートする前にモックを設定する必要があるため、
// server.tsのコードをここにインポートします。
const { default: app } = await import('./server');

describe('API Endpoints', () => {
  it('POST /api/recordPurchase should record a purchase', async () => {
    const { findOrCreateCustomer, recordPurchase } = await import('./src/api/notion');
    (findOrCreateCustomer as vi.Mock).mockResolvedValue('customer-page-id');
    (recordPurchase as vi.Mock).mockResolvedValue({});

    const response = await request(app)
      .post('/api/recordPurchase')
      .send({
        lineUserId: 'test-user',
        lineDisplayName: 'Test User',
        itemName: 'テスト商品',
        quantity: 1,
        memo: 'テストメモ',
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('購入履歴を記録しました');
  });

  it('GET /api/getHistory should return history', async () => {
    const { findOrCreateCustomer, getHistory } = await import('./src/api/notion');
    (findOrCreateCustomer as vi.Mock).mockResolvedValue('customer-page-id');
    (getHistory as vi.Mock).mockResolvedValue([{ id: '1', itemName: 'テスト商品' }]);

    const response = await request(app).get('/api/getHistory?lineUserId=test-user');

    expect(response.status).toBe(200);
    expect(response.body.histories).toEqual([{ id: '1', itemName: 'テスト商品' }]);
  });
});
