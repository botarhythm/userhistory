import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

console.log('process.env.PORT:', process.env.PORT);
console.log(`サーバーlistenポート: ${port}`);

// ルートエンドポイントを追加
app.get('/', (_req, res) => {
  res.json({ message: 'Botarhythm Coffee Roaster API', status: 'running' });
});

app.get('/api/hello', (_req, res) => {
  res.json({ message: 'Hello, Railway!' });
});

app.get('/health', (_req, res) => {
  res.status(200).send('ok');
});

// 0.0.0.0でリッスンしてRailwayのルーティングに対応
app.listen(Number(port), '0.0.0.0', () => {
  console.log(`Test API server running on port ${port}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});
process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});