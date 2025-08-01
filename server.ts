import express from 'express';
import 'dotenv/config';
import { findOrCreateCustomer, recordPurchase, getHistory, getProductList } from './src/api/notion.js';
import { Client } from '@notionhq/client';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let app: express.Express;

try {
  app = express();
  const port = process.env.PORT || 3001;

  app.use(express.json());

  // サーバー起動時にdist配下のファイル一覧と参照パスを出力
  const distPaths = [
    path.join(__dirname, 'dist'),
    path.join(process.cwd(), 'dist'),
  ];
  distPaths.forEach((p) => {
    if (fs.existsSync(p)) {
      console.log(`[DEBUG] distディレクトリ: ${p}`);
      console.log('[DEBUG] dist内ファイル:', fs.readdirSync(p));
    }
  });

  const clientDistPaths = [
    path.join(__dirname, 'dist', 'client'),
    path.join(process.cwd(), 'dist', 'client'),
  ];
  clientDistPaths.forEach((p) => {
    if (fs.existsSync(p)) {
      console.log(`[DEBUG] client distディレクトリ: ${p}`);
      console.log('[DEBUG] client dist内ファイル:', fs.readdirSync(p));
    }
  });

  // 静的ファイル配信
  app.use((req, res, next) => {
    for (const base of clientDistPaths) {
      const staticPath = path.join(base, req.path);
      if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
        return res.sendFile(staticPath);
      }
    }
    next();
  });

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
      console.error('Notion API Error:', error);
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
      console.error('履歴取得エラー:', error);
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

  // SPA対応: すべてのGETリクエストでindex.htmlを返す
  app.use((req, res) => {
    for (const base of clientDistPaths) {
      const indexPath = path.join(base, 'index.html');
      if (fs.existsSync(indexPath)) {
        console.log(`[DEBUG] index.html返却パス: ${indexPath}`);
        return res.sendFile(indexPath);
      }
    }
    // res.status(404).send('index.html not found');
    // 404返却をやめ、何も返さず終了
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
} catch (error) {
  console.error('サーバー起動時の致命的エラー:', error);
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
}

export default app;