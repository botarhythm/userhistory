import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pointsRouter from './src/api/points.js';
import adminRouter from './src/api/admin.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env['PORT'] || 8080;

// Notion APIインスタンスの初期化（エラーハンドリング付き）
let notionAPI: any = null;
try {
  // Use NotionPointsAPI to access both basic history and points/rewards
  const { NotionPointsAPI } = await import('./src/api/notion-points.js');
  notionAPI = new NotionPointsAPI();
  console.log('✅ Notion API initialized successfully (with Points support)');
} catch (error) {
  console.warn('⚠️ Notion API initialization failed:', error instanceof Error ? error.message : error);
  console.warn('⚠️ Some features may not work without proper Notion configuration');
}

// 簡素化されたログ関数
const log = (operation: string, context: any, message: string) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    operation,
    context,
    message,
    environment: process.env['NODE_ENV'] || 'development'
  }));
};

// ログ設定 (最優先)
app.use((req, _res, next) => {
  // Health check noise reduction - only log if it fails or every 10th request?
  // For now, log everything to debug the crash
  const timestamp = new Date().toISOString();
  console.log(`[DEBUG] ${timestamp} Incoming request: ${req.method} ${req.path} from ${req.ip} (${req.get('User-Agent')})`);
  next();
});

// ミドルウェア設定
app.use(cors());
app.use(express.json());

// 詳細ログ設定
app.use((req, _res, next) => {
  log('http_request', {
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  }, `${req.method} ${req.path}`);
  next();
});

// 静的ファイル配信（Railwayデプロイ用）
app.use(express.static(path.join(__dirname, 'public'), {
  index: false, // index.htmlの自動配信を無効化
  maxAge: '1h', // キャッシュ設定
  etag: true,
  lastModified: true
}));

// Railway用のヘッダー設定
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ヘルスチェック
app.get('/health', (_req, res) => {
  log('health_check', {}, 'Health check requested');
  if (!notionAPI) {
    return res.status(503).json({
      status: 'error',
      message: 'Notion API not configured',
      timestamp: new Date().toISOString(),
      environment: process.env['NODE_ENV'] || 'development',
      version: '1.0.0'
    });
  }
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV'] || 'development',
    version: '1.0.0',
    gitCommit: process.env['RAILWAY_GIT_COMMIT_SHA'] || 'unknown',
    notion: 'connected'
  });
});

// LINEミニアプリ用API - ユーザー検索
app.get('/api/user/:lineUid', async (req, res) => {
  if (!notionAPI) {
    return res.status(503).json({ error: 'Notion API not configured' });
  }

  try {
    const { lineUid } = req.params;
    log('user_lookup', { lineUid }, 'User lookup requested');

    const customer = await notionAPI.findCustomerByLineUid(lineUid);

    if (customer) {
      log('user_found', { lineUid, customerId: customer.id }, 'User found in database');
      return res.json({
        lineUid,
        status: 'user_found',
        customer
      });
    } else {
      log('user_not_found', { lineUid }, 'User not found in database');
      return res.json({
        lineUid,
        status: 'user_not_found'
      });
    }
  } catch (error) {
    log('user_lookup_error', { lineUid: req.params.lineUid, error: error instanceof Error ? error.message : String(error) }, 'User lookup failed');
    console.error('User fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 来店チェックインAPI
app.post('/api/checkin', async (req, res) => {
  if (!notionAPI) {
    return res.status(503).json({ error: 'Notion API not configured' });
  }

  try {
    const { lineUid, displayName, timestamp, memo } = req.body;

    if (!lineUid) {
      log('checkin_validation_error', { lineUid, displayName }, 'Check-in request missing lineUid');
      return res.status(400).json({ error: 'lineUid is required' });
    }

    log('checkin_request', { lineUid, displayName, timestamp, hasMemo: !!memo }, 'Check-in request received');

    // 顧客を検索または作成
    const customerId = await notionAPI.findOrCreateCustomer(lineUid, displayName || 'Unknown User');

    // 来店履歴を記録
    const historyId = await notionAPI.recordCheckin(customerId, timestamp, memo);

    log('checkin_success', { lineUid, customerId, historyId }, 'Check-in recorded successfully');

    return res.json({
      success: true,
      message: 'Check-in recorded',
      customerId,
      historyId,
      timestamp: timestamp || new Date().toISOString(),
      memo: memo || undefined
    });
  } catch (error) {
    log('checkin_error', { lineUid: req.body.lineUid, error: error instanceof Error ? error.message : String(error) }, 'Check-in recording failed');
    console.error('Check-in error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 購入履歴API
app.post('/api/purchase', async (req, res) => {
  if (!notionAPI) {
    return res.status(503).json({ error: 'Notion API not configured' });
  }

  try {
    const { lineUid, displayName, items, total, memo, timestamp } = req.body;

    // 詳細なバリデーション
    const validationErrors: string[] = [];
    if (!lineUid) validationErrors.push('lineUid is missing');
    if (!items || !Array.isArray(items) || items.length === 0) validationErrors.push('items is missing or empty');
    if (total === undefined || total === null) validationErrors.push('total is missing');

    if (validationErrors.length > 0) {
      log('purchase_validation_error', {
        lineUid: !!lineUid,
        hasItems: !!items,
        itemsLength: items?.length,
        hasTotal: total !== undefined && total !== null,
        total,
        validationErrors
      }, 'Purchase request validation failed');
      return res.status(400).json({
        error: 'Validation failed'
      });
    }

    log('purchase_request', { lineUid, displayName, itemsCount: items.length, total }, 'Purchase request received');

    // 顧客を検索または作成
    const customerId = await notionAPI.findOrCreateCustomer(lineUid, displayName || 'Unknown User');

    // 購入履歴を記録
    const historyId = await notionAPI.recordPurchase(customerId, items, total, memo, timestamp);

    log('purchase_success', { lineUid, customerId, historyId, total }, 'Purchase recorded successfully');

    // ポイント付与 (1% = 100円で1ポイント, 最低1ポイント?)
    // User hasn't specified rate, assuming 1% is standard.
    const pointsToGrant = Math.floor(total / 100);
    // Use optional chaining/type guard pattern since NotionPointsAPI is dynamically imported
    if (pointsToGrant > 0 && notionAPI && typeof (notionAPI as any).createPointTransaction === 'function') {
      try {
        await (notionAPI as any).createPointTransaction(
          customerId,
          pointsToGrant,
          'PURCHASE',
          {
            reason: '商品購入'
          }
        );
        log('point_grant_success', { customerId, points: pointsToGrant }, 'Points granted for purchase');
      } catch (pointError) {
        console.error('Failed to grant points for purchase:', pointError);
        // Don't fail the whole request, just log
      }
    }

    return res.status(200).json({
      success: true
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    log('purchase_error', {
      lineUid: req.body.lineUid,
      error: errorMessage,
      stack: errorStack,
      body: req.body
    }, 'Purchase recording failed');

    console.error('Purchase error details:', {
      message: errorMessage,
      stack: errorStack,
      requestBody: req.body
    });

    return res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// 履歴取得API
app.get('/api/history/:lineUid', async (req, res) => {
  if (!notionAPI) {
    return res.status(503).json({ error: 'Notion API not configured' });
  }

  try {
    const { lineUid } = req.params;
    const { type, limit = 10 } = req.query;
    const limitNum = parseInt(limit as string);

    log('history_request', { lineUid, type, limit }, 'History request received');

    // 顧客を検索
    const customer = await notionAPI.findCustomerByLineUid(lineUid);

    if (!customer) {
      log('history_user_not_found', { lineUid }, 'User not found for history request');
      return res.status(404).json({ error: 'Customer not found' });
    }

    // 1. 通常の履歴を取得 (来店・購入)
    const basicHistoryPromise = notionAPI.getHistory(
      customer.id,
      type as 'checkin' | 'purchase',
      limitNum // Fetch limit just in case, but we might need more to merge
    );

    // 2. ポイント履歴(チケット利用)を取得
    // getTransactions returns PointTransaction[], we need to filter for REWARD type and map to HistoryRecord
    let pointHistoryPromise = Promise.resolve([]);
    // Only fetch usage if specifically requested via query param
    const includeUsage = req.query['includeUsage'] === 'true';

    if (includeUsage && (!type || type === 'usage')) {
      pointHistoryPromise = notionAPI.getTransactions(customer.id);
    }

    const [basicHistory, pointTransactions] = await Promise.all([basicHistoryPromise, pointHistoryPromise]);

    // 3. Map PointTransactions to HistoryRecord format
    const rewardHistory = (pointTransactions as any[])
      .filter(tx => ['REWARD', 'PURCHASE', 'ADMIN'].includes(tx.type))
      .map(tx => {
        const isUsage = tx.type === 'REWARD';
        return {
          id: tx.id,
          customerId: customer.id,
          type: isUsage ? 'usage' : 'earn', // 'usage' for redemption, 'earn' for gaining points
          timestamp: tx.date,
          items: [{
            name: isUsage
              ? (tx.reason?.replace('特典利用: ', '') || 'チケット利用')
              : (tx.reason || 'ポイント獲得'),
            quantity: 1
          }],
          total: tx.amount, // store amount for earn/usage display
          memo: tx.rewardId ? 'Reward Redeemed' : undefined
        };
      });

    // 4. Merge and Sort
    let allHistory = [...basicHistory, ...rewardHistory];

    // Sort by timestamp descending
    allHistory.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // 5. Apply limit
    const limitedHistory = allHistory.slice(0, limitNum);

    log('history_success', {
      lineUid,
      customerId: customer.id,
      basicCount: basicHistory.length,
      rewardCount: rewardHistory.length,
      totalReturned: limitedHistory.length
    }, 'History retrieved and merged successfully');

    return res.json({
      lineUid,
      customer,
      type,
      limit,
      history: limitedHistory
    });
  } catch (error) {
    log('history_error', { lineUid: req.params.lineUid, error: error instanceof Error ? error.message : String(error) }, 'History fetch failed');
    console.error('History fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 履歴編集API
app.patch('/api/history/:historyId', async (req, res) => {
  if (!notionAPI) {
    return res.status(503).json({ error: 'Notion API not configured' });
  }

  try {
    const { historyId } = req.params;
    const { memo, productName } = req.body;

    log('history_update_request', { historyId, memo, productName }, 'History update request received');

    // 履歴を更新
    const updatedHistory = await notionAPI.updateHistory(historyId, { memo, productName });

    if (!updatedHistory) {
      log('history_update_not_found', { historyId }, 'History record not found for update');
      return res.status(404).json({ error: 'History record not found' });
    }

    log('history_update_success', { historyId }, 'History updated successfully');

    return res.json({
      success: true,
      message: 'History updated successfully',
      history: updatedHistory
    });
  } catch (error) {
    log('history_update_error', { historyId: req.params.historyId, error: error instanceof Error ? error.message : String(error) }, 'History update failed');
    console.error('History update error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 履歴削除API
app.delete('/api/history/:historyId', async (req, res) => {
  if (!notionAPI) {
    return res.status(503).json({ error: 'Notion API not configured' });
  }

  try {
    const { historyId } = req.params;

    log('history_delete_request', { historyId }, 'History delete request received');

    // 履歴を削除
    const success = await notionAPI.deleteHistory(historyId);

    if (!success) {
      log('history_delete_not_found', { historyId }, 'History record not found for deletion');
      return res.status(404).json({ error: 'History record not found' });
    }

    log('history_delete_success', { historyId }, 'History deleted successfully');

    return res.json({
      success: true,
      message: 'History deleted successfully'
    });
  } catch (error) {
    log('history_delete_error', { historyId: req.params.historyId, error: error instanceof Error ? error.message : String(error) }, 'History deletion failed');
    console.error('History delete error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 商品一覧取得API
app.get('/api/products', async (req, res) => {
  if (!notionAPI) {
    return res.status(503).json({ error: 'Notion API not configured' });
  }

  try {
    log('get_products', { query: req.query }, 'Products requested');

    const products = await notionAPI.getProducts();

    return res.json({
      success: true,
      products: products
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log('get_products_error', { error: errorMessage }, 'Failed to get products');
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
});

// 商品検索API
app.get('/api/products/search', async (req, res): Promise<void> => {
  if (!notionAPI) {
    res.status(503).json({ error: 'Notion API not configured' });
    return;
  }

  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
      return;
    }

    log('search_products', { query: q }, 'Product search requested');

    const products = await notionAPI.searchProducts(q);

    res.json({
      success: true,
      products: products
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log('search_products_error', { error: errorMessage }, 'Failed to search products');
    res.status(500).json({
      success: false,
      error: 'Failed to search products'
    });
  }
});

// ポイントシステムAPI
app.use('/api/points', pointsRouter);

// 管理者用API
app.use('/api/admin', adminRouter);

// デバッグ用APIは ENABLE_DEBUG_ENDPOINTS=true のときだけ公開（公開リポジトリのため既定は非公開）
app.use('/api/debug', (_req, res, next) => {
  if (process.env['ENABLE_DEBUG_ENDPOINTS'] === 'true') {
    return next();
  }
  return res.status(404).json({ error: 'API endpoint not found' });
});

// データベース構造確認API（デバッグ用）
app.get('/api/debug/database-structure', async (req, res) => {
  if (!notionAPI) {
    return res.status(503).json({ error: 'Notion API not configured' });
  }

  try {
    log('database_structure_request', {}, 'Database structure check requested');

    const customerStructure = await notionAPI.getDatabaseStructure(notionAPI.customerDatabaseId);
    const historyStructure = await notionAPI.getDatabaseStructure(notionAPI.historyDatabaseId);
    const productStructure = await notionAPI.getDatabaseStructure(notionAPI.productDatabaseId);

    log('database_structure_success', {
      hasCustomerStructure: !!customerStructure,
      hasHistoryStructure: !!historyStructure,
      hasProductStructure: !!productStructure
    }, 'Database structure retrieved successfully');

    return res.json({
      success: true,
      customer: customerStructure ? {
        id: customerStructure.id,
        title: customerStructure.title,
        properties: Object.keys(customerStructure.properties)
      } : null,
      history: historyStructure ? {
        id: historyStructure.id,
        title: historyStructure.title,
        properties: Object.keys(historyStructure.properties)
      } : null,
      product: productStructure ? {
        id: productStructure.id,
        title: productStructure.title,
        properties: Object.keys(productStructure.properties)
      } : null,
      store: notionAPI.storeDbId ? await notionAPI.getDatabaseStructure(notionAPI.storeDbId).then((s: any) => s ? {
        id: s.id,
        title: s.title,
        properties: Object.keys(s.properties)
      } : null) : null,
      reward: notionAPI.rewardDbId ? await notionAPI.getDatabaseStructure(notionAPI.rewardDbId).then((s: any) => s ? {
        id: s.id,
        title: s.title,
        properties: Object.keys(s.properties)
      } : null) : null,
      pointHistory: notionAPI.pointHistoryDbId ? await notionAPI.getDatabaseStructure(notionAPI.pointHistoryDbId).then((s: any) => s ? {
        id: s.id,
        title: s.title,
        properties: Object.keys(s.properties)
      } : null) : null
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log('database_structure_error', { error: errorMessage }, 'Database structure check failed');
    return res.status(500).json({
      success: false,
      error: 'Failed to get database structure',
      details: errorMessage
    });
  }
});

// デバッグ用：ファイル一覧確認API
app.get('/api/debug/files', (req, res) => {
  try {
    const rootFiles = fs.readdirSync(__dirname);
    const publicPath = path.join(__dirname, 'public');
    const publicFiles = fs.existsSync(publicPath) ? fs.readdirSync(publicPath) : 'public dir not found';

    res.json({
      dirname: __dirname,
      rootFiles,
      publicPath,
      publicFiles
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// 環境変数デバッグ用エンドポイント
app.get('/api/debug/env', (req, res) => {
  const envKeys = Object.keys(process.env).filter(key => key.startsWith('NOTION_') || key === 'NODE_ENV' || key === 'PORT');
  res.json({
    keys: envKeys,
    hasPointHistory: !!process.env['NOTION_POINT_HISTORY_DB_ID'],
    hasStore: !!process.env['NOTION_STORE_DB_ID'],
    hasReward: !!process.env['NOTION_REWARD_DB_ID']
  });
});

// SPA用のフォールバックルート（Railway Station推奨設定）
app.get('*', (req, res) => {
  // APIルートの場合は404を返す
  if (req.path.startsWith('/api/')) {
    log('api_not_found', { path: req.path }, 'API endpoint not found');
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  // 静的ファイルの存在確認
  const staticPath = path.join(__dirname, 'public', req.path);
  const indexPath = path.join(__dirname, 'public', 'index.html');

  // ファイルが存在する場合は静的ファイルを配信
  if (fs.existsSync(staticPath) && !req.path.endsWith('/')) {
    log('static_file_served', { path: req.path }, 'Serving static file');
    return res.sendFile(staticPath);
  }

  // それ以外はSPAのindex.htmlを配信
  if (fs.existsSync(indexPath)) {
    log('spa_fallback', { path: req.path }, 'Serving SPA fallback');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.sendFile(indexPath);
  } else {
    log('spa_error', { path: req.path }, 'Index file not found');
    return res.status(500).send('Application Error: Frontend not found');
  }
});

// エラーハンドリング
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // 不正なJSONなど、リクエスト側の誤り（body-parser の 4xx）はそのまま返す
  const status = Number(err?.status || err?.statusCode);
  if (status >= 400 && status < 500) {
    log('client_error', { error: err.message, type: err.type }, 'Bad request');
    return res.status(status).json({ error: status === 400 ? 'Bad request' : 'Request error' });
  }
  log('server_error', { error: err.message, stack: err.stack }, 'Unhandled server error');
  console.error('Server error:', err);
  return res.status(500).json({ error: 'Internal server error' });
});

// サーバー起動（Railway Station推奨設定）
const server = app.listen(Number(port), '0.0.0.0', () => {
  log('server_start', { port, environment: process.env['NODE_ENV'] || 'development' }, 'Server started successfully');
  console.log(`🚀 Botarhythm Coffee Roaster API running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔗 API status: http://localhost:${port}/api/status`);
  console.log(`📝 Notion API: ${notionAPI ? '✅ Connected' : '⚠️ Not configured'}`);
  console.log(`🌐 External URL: https://userhistory-production.up.railway.app`);
  console.log(`🔧 Railway Environment: ${process.env['RAILWAY_ENVIRONMENT'] || 'unknown'}`);
  console.log(`🏗️ Railway Project: ${process.env['RAILWAY_PROJECT_ID'] || 'unknown'}`);

  console.log(`[DEBUG] Server listening setup complete`);
  console.log(`[DEBUG] Registered routes:`);

  if (app._router && app._router.stack) {
    app._router.stack.forEach((r: any) => {
      if (r.route && r.route.path) {
        console.log(`[DEBUG] - ${Object.keys(r.route.methods).join(',').toUpperCase()} ${r.route.path}`);
      }
    });
  }
});

// Railway用の最適化設定（Railway Station推奨）
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
server.maxConnections = 1000;

// Railway用の追加設定
server.setTimeout(120000);

// Railway用のエラーハンドリング
server.on('error', (error) => {
  console.error('Server error:', error);
  log('server_error', { error: error.message }, 'Server error occurred');
});

server.on('connection', (socket) => {
  socket.setTimeout(30000);
});

// グレースフルシャットダウン
process.on('SIGTERM', () => {
  log('server_shutdown', { signal: 'SIGTERM' }, 'Server shutdown initiated');
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  log('server_shutdown', { signal: 'SIGINT' }, 'Server shutdown initiated');
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});