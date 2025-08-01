import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.get('/api/hello', (_req, res) => {
  res.json({ message: 'Hello, Railway!' });
});

app.get('/health', (_req, res) => {
  res.status(200).send('ok');
});

app.listen(port, () => {
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