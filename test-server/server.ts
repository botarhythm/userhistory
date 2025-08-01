import express from 'express';

const app = express();
const port = process.env.PORT;

app.get('/api/hello', (_req, res) => {
  res.json({ message: 'Hello, Railway!' });
});

app.get('/health', (_req, res) => {
  res.status(200).send('ok');
});

app.listen(port, () => {
  console.log(`Test API server running on port ${port}`);
});