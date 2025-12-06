import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

const app = express();
const port = Number(process.env['PORT']) || 3000;

// 基本的なミドルウェア
app.use(express.json());

// 環境変数の確認
app.get('/env', (_req: Request, res: Response) => {
    res.json({
        port: process.env['PORT'],
        nodeEnv: process.env['NODE_ENV'],
        notionApiKey: process.env['NOTION_API_KEY'] ? 'SET' : 'NOT_SET',
        notionCustomerDbId: process.env['NOTION_CUSTOMER_DB_ID'] ? 'SET' : 'NOT_SET',
        notionHistoryDbId: process.env['NOTION_HISTORY_DB_ID'] ? 'SET' : 'NOT_SET',
        notionProductDbId: process.env['NOTION_PRODUCT_DB_ID'] ? 'SET' : 'NOT_SET',
        viteLiffId: process.env['VITE_LIFF_ID'] ? 'SET' : 'NOT_SET'
    });
});

// 基本的なヘルスチェック
app.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        port: port,
        environment: process.env['NODE_ENV'] || 'development'
    });
});

// ルートパス
app.get('/', (_req: Request, res: Response) => {
    res.json({
        message: 'Test server is running',
        timestamp: new Date().toISOString(),
        port: port
    });
});

// エラーハンドリング
// エラーハンドリング
const errorHandler: ErrorRequestHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
};

app.use(errorHandler);

// サーバー起動
const server = app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Test server running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`🔗 Environment: http://localhost:${port}/env`);
    console.log(`🌐 Root: http://localhost:${port}/`);
});

// エラーハンドリング
server.on('error', (error: Error) => {
    console.error('Server error:', error);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        process.exit(0);
    });
});
