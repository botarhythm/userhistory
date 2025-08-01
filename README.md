# userhistory

Botarhythm Coffee Roaster LINEミニアプリ

## 本番運用（Railway）

### 必要な環境変数（.env.example参照）
- NOTION_API_KEY
- NOTION_CUSTOMER_DB_ID
- NOTION_HISTORY_DB_ID
- NOTION_PRODUCT_DB_ID
- LINE_LIFF_ID

### セットアップ
```sh
npm install
```

### ビルド
```sh
npm run build
```

### 本番起動
```sh
npm start
```

### Railwayデプロイ
- mainブランチpushで自動デプロイ
- Railwayダッシュボードで環境変数を設定
- Health Check Pathは `/health` に設定

---

## 開発
```sh
npm run dev
```

