import express from 'express';
import cors from 'cors';
import { NotionAPI } from './src/api/notion';

const app = express();
const port = process.env['PORT'] || 3000;

// Notion APIインスタンスの初期化
const notionAPI = new NotionAPI();

// ミドルウェア設定
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ログ設定
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ヘルスチェック
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// APIルート
app.get('/api/status', (_req, res) => {
  res.json({ 
    message: 'Botarhythm Coffee Roaster API', 
    status: 'running',
    version: '1.0.0'
  });
});

// LINEミニアプリ用API
app.get('/api/user/:lineUid', async (req, res) => {
  try {
    const { lineUid } = req.params;
    const customer = await notionAPI.findCustomerByLineUid(lineUid);
    
    if (customer) {
      res.json({ 
        lineUid, 
        status: 'user_found',
        customer 
      });
    } else {
      res.json({ 
        lineUid, 
        status: 'user_not_found' 
      });
    }
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 来店チェックインAPI
app.post('/api/checkin', async (req, res) => {
  try {
    const { lineUid, displayName, timestamp } = req.body;
    
    if (!lineUid) {
      return res.status(400).json({ error: 'lineUid is required' });
    }

    // 顧客を検索または作成
    const customerId = await notionAPI.findOrCreateCustomer(lineUid, displayName || 'Unknown User');
    
    // 来店履歴を記録
    const historyId = await notionAPI.recordCheckin(customerId, timestamp);
    
    return res.json({ 
      success: true, 
      message: 'Check-in recorded',
      customerId,
      historyId,
      timestamp: timestamp || new Date().toISOString()
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 購入履歴API
app.post('/api/purchase', async (req, res) => {
  try {
    const { lineUid, displayName, items, total, memo, timestamp } = req.body;
    
    if (!lineUid || !items || !total) {
      return res.status(400).json({ error: 'lineUid, items, and total are required' });
    }

    // 顧客を検索または作成
    const customerId = await notionAPI.findOrCreateCustomer(lineUid, displayName || 'Unknown User');
    
    // 購入履歴を記録
    const historyId = await notionAPI.recordPurchase(customerId, items, total, memo, timestamp);
    
    return res.json({ 
      success: true, 
      message: 'Purchase recorded',
      customerId,
      historyId,
      items,
      total,
      timestamp: timestamp || new Date().toISOString()
    });
  } catch (error) {
    console.error('Purchase error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 履歴取得API
app.get('/api/history/:lineUid', async (req, res) => {
  try {
    const { lineUid } = req.params;
    const { type, limit = 10 } = req.query;
    
    // 顧客を検索
    const customer = await notionAPI.findCustomerByLineUid(lineUid);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // 履歴を取得
    const history = await notionAPI.getHistory(
      customer.id, 
      type as 'checkin' | 'purchase', 
      parseInt(limit as string)
    );
    
    return res.json({ 
      lineUid, 
      customer,
      type, 
      limit,
      history
    });
  } catch (error) {
    console.error('History fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// エラーハンドリング
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404ハンドリング
app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// サーバー起動
app.listen(Number(port), '0.0.0.0', () => {
  console.log(`🚀 Botarhythm Coffee Roaster API running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔗 API status: http://localhost:${port}/api/status`);
});

// グレースフルシャットダウン
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});