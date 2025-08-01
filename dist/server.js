import express from 'express';
import cors from 'cors';
import { NotionAPI } from './src/api/notion';
import path from 'path';
const app = express();
const port = process.env['PORT'] || 3000;
// Notion APIインスタンスの初期化
const notionAPI = new NotionAPI();
// 構造化ログ関数
const log = (operation, context, message, ai_todo, human_note) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        operation,
        context,
        message,
        ai_todo,
        human_note,
        environment: process.env['NODE_ENV'] || 'development'
    };
    console.log(JSON.stringify(logEntry));
};
// ミドルウェア設定
app.use(cors());
app.use(express.json());
// 静的ファイル配信（Railwayデプロイ用）
app.use(express.static(path.join(__dirname, 'public')));
// ログ設定
app.use((req, _res, next) => {
    log('http_request', {
        method: req.method,
        path: req.path,
        userAgent: req.get('User-Agent'),
        ip: req.ip
    }, `${req.method} ${req.path}`, 'Continue processing request');
    next();
});
// ヘルスチェック
app.get('/health', (_req, res) => {
    log('health_check', {}, 'Health check requested', 'Monitor system health');
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env['NODE_ENV'] || 'development',
        version: '1.0.0'
    });
});
// ルートパス
app.get('/', (_req, res) => {
    log('root_access', {}, 'Root path accessed', 'Serve frontend application');
    res.json({
        message: 'Botarhythm Coffee Roaster LINE Mini App API',
        status: 'running',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            status: '/api/status',
            user: '/api/user/:lineUid',
            checkin: '/api/checkin',
            purchase: '/api/purchase',
            history: '/api/history/:lineUid'
        }
    });
});
// APIテスト用エンドポイント
app.get('/api/hello', (_req, res) => {
    log('api_test', {}, 'API test endpoint accessed', 'Verify API connectivity');
    res.json({
        message: 'Hello from Botarhythm Coffee Roaster API!',
        timestamp: new Date().toISOString()
    });
});
// APIルート
app.get('/api/status', (_req, res) => {
    log('api_status', {}, 'API status requested', 'Monitor API health');
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
        log('user_lookup', { lineUid }, 'User lookup requested', 'Find or create user in Notion');
        const customer = await notionAPI.findCustomerByLineUid(lineUid);
        if (customer) {
            log('user_found', { lineUid, customerId: customer.id }, 'User found in database', 'Return user data');
            res.json({
                lineUid,
                status: 'user_found',
                customer
            });
        }
        else {
            log('user_not_found', { lineUid }, 'User not found in database', 'Create new user on next interaction');
            res.json({
                lineUid,
                status: 'user_not_found'
            });
        }
    }
    catch (error) {
        log('user_lookup_error', { lineUid: req.params.lineUid, error: error instanceof Error ? error.message : String(error) }, 'User lookup failed', 'Check Notion API connection and database configuration');
        console.error('User fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// 来店チェックインAPI
app.post('/api/checkin', async (req, res) => {
    try {
        const { lineUid, displayName, timestamp } = req.body;
        if (!lineUid) {
            log('checkin_validation_error', { lineUid, displayName }, 'Check-in request missing lineUid', 'Validate required fields');
            return res.status(400).json({ error: 'lineUid is required' });
        }
        log('checkin_request', { lineUid, displayName, timestamp }, 'Check-in request received', 'Process check-in in Notion');
        // 顧客を検索または作成
        const customerId = await notionAPI.findOrCreateCustomer(lineUid, displayName || 'Unknown User');
        // 来店履歴を記録
        const historyId = await notionAPI.recordCheckin(customerId, timestamp);
        log('checkin_success', { lineUid, customerId, historyId }, 'Check-in recorded successfully', 'Notify user of successful check-in');
        return res.json({
            success: true,
            message: 'Check-in recorded',
            customerId,
            historyId,
            timestamp: timestamp || new Date().toISOString()
        });
    }
    catch (error) {
        log('checkin_error', { lineUid: req.body.lineUid, error: error instanceof Error ? error.message : String(error) }, 'Check-in recording failed', 'Check Notion API and database permissions');
        console.error('Check-in error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// 購入履歴API
app.post('/api/purchase', async (req, res) => {
    try {
        const { lineUid, displayName, items, total, memo, timestamp } = req.body;
        if (!lineUid || !items || !total) {
            log('purchase_validation_error', { lineUid, hasItems: !!items, hasTotal: !!total }, 'Purchase request missing required fields', 'Validate purchase data');
            return res.status(400).json({ error: 'lineUid, items, and total are required' });
        }
        log('purchase_request', { lineUid, displayName, itemsCount: items.length, total }, 'Purchase request received', 'Process purchase in Notion');
        // 顧客を検索または作成
        const customerId = await notionAPI.findOrCreateCustomer(lineUid, displayName || 'Unknown User');
        // 購入履歴を記録
        const historyId = await notionAPI.recordPurchase(customerId, items, total, memo, timestamp);
        log('purchase_success', { lineUid, customerId, historyId, total }, 'Purchase recorded successfully', 'Notify user of successful purchase recording');
        return res.json({
            success: true,
            message: 'Purchase recorded',
            customerId,
            historyId,
            items,
            total,
            timestamp: timestamp || new Date().toISOString()
        });
    }
    catch (error) {
        log('purchase_error', { lineUid: req.body.lineUid, error: error instanceof Error ? error.message : String(error) }, 'Purchase recording failed', 'Check Notion API and database configuration');
        console.error('Purchase error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// 履歴取得API
app.get('/api/history/:lineUid', async (req, res) => {
    try {
        const { lineUid } = req.params;
        const { type, limit = 10 } = req.query;
        log('history_request', { lineUid, type, limit }, 'History request received', 'Fetch user history from Notion');
        // 顧客を検索
        const customer = await notionAPI.findCustomerByLineUid(lineUid);
        if (!customer) {
            log('history_user_not_found', { lineUid }, 'User not found for history request', 'Create user first or check LINE UID');
            return res.status(404).json({ error: 'Customer not found' });
        }
        // 履歴を取得
        const history = await notionAPI.getHistory(customer.id, type, parseInt(limit));
        log('history_success', { lineUid, customerId: customer.id, historyCount: history.length }, 'History retrieved successfully', 'Display history to user');
        return res.json({
            lineUid,
            customer,
            type,
            limit,
            history
        });
    }
    catch (error) {
        log('history_error', { lineUid: req.params.lineUid, error: error instanceof Error ? error.message : String(error) }, 'History fetch failed', 'Check Notion API connection');
        console.error('History fetch error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// SPA用のフォールバックルート
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        log('api_not_found', { path: req.path }, 'API endpoint not found', 'Check API route configuration');
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    // フロントエンドのルートを配信
    log('spa_fallback', { path: req.path }, 'Serving SPA fallback', 'Ensure frontend routing works');
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// エラーハンドリング
app.use((err, _req, res, _next) => {
    log('server_error', { error: err.message, stack: err.stack }, 'Unhandled server error', 'Review error logs and fix root cause');
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
// サーバー起動
app.listen(Number(port), '0.0.0.0', () => {
    log('server_start', { port, environment: process.env['NODE_ENV'] || 'development' }, 'Server started successfully', 'Monitor server health and performance');
    console.log(`🚀 Botarhythm Coffee Roaster API running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`🔗 API status: http://localhost:${port}/api/status`);
});
// グレースフルシャットダウン
process.on('SIGTERM', () => {
    log('server_shutdown', { signal: 'SIGTERM' }, 'Server shutdown initiated', 'Ensure graceful shutdown completes');
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    log('server_shutdown', { signal: 'SIGINT' }, 'Server shutdown initiated', 'Ensure graceful shutdown completes');
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});
//# sourceMappingURL=server.js.map