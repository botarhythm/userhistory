const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// 基本的なミドルウェア
app.use(express.json());

// 環境変数の確認
app.get('/env', (req, res) => {
  res.json({
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
    notionApiKey: process.env.NOTION_API_KEY ? 'SET' : 'NOT_SET',
    notionCustomerDbId: process.env.NOTION_CUSTOMER_DB_ID ? 'SET' : 'NOT_SET',
    notionHistoryDbId: process.env.NOTION_HISTORY_DB_ID ? 'SET' : 'NOT_SET',
    notionProductDbId: process.env.NOTION_PRODUCT_DB_ID ? 'SET' : 'NOT_SET',
    viteLiffId: process.env.VITE_LIFF_ID ? 'SET' : 'NOT_SET'
  });
});

// 基本的なヘルスチェック
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: port,
    environment: process.env.NODE_ENV || 'development'
  });
});

// ルートパス
app.get('/', (req, res) => {
  res.json({
    message: 'Test server is running',
    timestamp: new Date().toISOString(),
    port: port
  });
});

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// サーバー起動
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Test server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔗 Environment: http://localhost:${port}/env`);
  console.log(`🌐 Root: http://localhost:${port}/`);
});

// エラーハンドリング
server.on('error', (error) => {
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