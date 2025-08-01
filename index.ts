import app from './server';

const port = 3001;

app.listen(port, () => {
  console.log(`APIサーバーがポート${port}で起動しました`);
});
