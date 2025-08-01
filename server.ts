import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import { findOrCreateCustomer, recordPurchase, getHistory, getProductList } from './src/api/notion.js';
import { Client } from '@notionhq/client';

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(cors()); // CORS対応

// APIエンドポイント
app.post('/api/recordPurchase', async (req, res) => {
  const { lineUserId, lineDisplayName, itemName, memo } = req.body;
  if (!lineUserId || !lineDisplayName || !itemName) {
    return res.status(400).json({ error: '必須パラメータが不足しています' });
  }
  try {
    const customerPageId = await findOrCreateCustomer(lineUserId, lineDisplayName);
    await recordPurchase(customerPageId, itemName, memo);
    res.status(200).json({ message: '購入履歴を記録しました' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'データベース処理中にエラーが発生しました' });
  }
});

app.get('/api/getHistory', async (req, res) => {
  const { lineUserId } = req.query;
  if (!lineUserId) {
    return res.status(400).json({ error: 'lineUserIdが必要です' });
  }
  try {
    const customerPageId = await findOrCreateCustomer(lineUserId as string, '');
    const histories = await getHistory(customerPageId);
    res.status(200).json({ histories });
  } catch (error) {
    res.status(500).json({ error: '履歴取得中にエラーが発生しました' });
  }
});

app.post('/api/updateMemo', async (req, res) => {
  const { historyId, memo } = req.body;
  if (!historyId) {
    return res.status(400).json({ error: 'historyIdが必要です' });
  }
  try {
    const notion = new Client({ auth: process.env.NOTION_API_KEY! });
    await notion.pages.update({
      page_id: historyId,
      properties: {
        'メモ': { rich_text: [{ text: { content: memo || '' } }] },
      },
    });
    res.status(200).json({ message: 'メモを更新しました' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'メモ更新エラー' });
  }
});

app.get('/api/products', async (_req, res) => {
  try {
    const products = await getProductList();
    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '商品リスト取得エラー' });
  }
});

// ヘルスチェック用
app.get('/health', (_req, res) => {
  res.status(200).send('ok');
});

// グローバルエラーハンドラ
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

app.listen(port, () => {
  console.log(`APIサーバーがポート${port}で起動しました`);
});

export default app;