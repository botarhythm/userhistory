# Botarhythm Coffee Roaster - LINE Mini App

LINEミニアプリを使用した顧客の来店・購入履歴管理システム

## 機能

- **LINEログイン**: LIFFを使用した認証
- **来店チェックイン**: ワンタップで来店記録
- **購入履歴記録**: 商品・数量・価格を記録
- **履歴閲覧**: 過去の来店・購入履歴を確認
- **スタッフ機能**: 顧客代理での履歴入力

## 技術スタック

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js, TypeScript
- **Database**: Notion API
- **Authentication**: LINE LIFF
- **Deployment**: Railway
- **CI/CD**: GitHub Actions

## 前提条件

- Node.js 20以上
- Notion API Key
- LINE Developers Console アカウント
- Railway アカウント

## セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd userhistory
npm install
```

### 2. Notionデータベースの設定

1. [Notion Developers](https://developers.notion.com/) でAPI Keyを取得
2. 新しいページで以下のデータベースを作成：

#### 顧客DB
| プロパティ名 | タイプ | 説明 |
|-------------|--------|------|
| LINE UID | Title | 一意識別子 |
| 表示名 | Text | 顧客の表示名 |
| 登録日 | Date | 初回登録日 |

#### 履歴DB
| プロパティ名 | タイプ | 説明 |
|-------------|--------|------|
| 関連顧客 | Relation | 顧客DBとの関連 |
| タイプ | Select | 来店/購入 |
| 日時 | Date | 記録日時 |
| 商品名 | Text | 購入商品名 |
| 数量 | Number | 購入数量 |
| 価格 | Number | 購入価格 |
| メモ | Text | 特記事項 |

3. データベースIDをコピー（URLの最後の部分）

### 3. LINE Developers Console設定

1. [LINE Developers Console](https://developers.line.biz/) でチャネルを作成
2. LIFFアプリを追加
3. Endpoint URLを設定（開発時は `http://localhost:5173`）
4. LIFF IDをコピー

### 4. 環境変数の設定

#### ローカル開発
```bash
cp env.example .env
```

`.env` ファイルを編集：
```env
# Railway Deployment Configuration
PORT=3000
NODE_ENV=production

# Notion API Configuration
NOTION_API_KEY=your_notion_api_key_here
NOTION_CUSTOMER_DB_ID=your_customer_db_id_here
NOTION_HISTORY_DB_ID=your_history_db_id_here

# LINE LIFF Configuration (for frontend)
VITE_LIFF_ID=your_line_liff_id_here

# Development Configuration (for local development)
# NODE_ENV=development 
```

#### Railway本番環境
Railwayダッシュボードで環境変数を設定：
- `NOTION_API_KEY`
- `NOTION_CUSTOMER_DB_ID`
- `NOTION_HISTORY_DB_ID`
- `VITE_LIFF_ID`

#### GitHub Secrets設定（CI/CD用）
GitHubリポジトリの Settings > Secrets and variables > Actions で以下を設定：

**必須Secrets:**
- `RAILWAY_TOKEN`: Railway API Token（[Railway Account Settings](https://railway.app/account/tokens) で取得）
- `RAILWAY_SERVICE`: Railway Service ID（Railwayダッシュボードで確認）

**設定手順:**
1. GitHubリポジトリの Settings タブを開く
2. 左サイドバーの "Secrets and variables" → "Actions" を選択
3. "New repository secret" をクリック
4. 上記の2つのSecretsを追加

## 開発サーバー

```bash
# フロントエンド + バックエンド同時起動
npm run dev

# フロントエンドのみ（ポート5173）
npm run dev:client

# バックエンドのみ（ポート3000）
npm run dev:server
```

## ビルド

```bash
# 本番用ビルド
npm run build

# プレビュー
npm run preview
```

## Railwayデプロイ

### 自動デプロイ（推奨）
1. GitHubリポジトリをRailwayに連携
2. 環境変数をRailwayダッシュボードで設定
3. mainブランチへのpushで自動デプロイ

### 手動デプロイ
```bash
# Railway CLIインストール
npm install -g @railway/cli

# ログイン
railway login

# プロジェクト作成
railway init

# デプロイ
railway up
```

## API エンドポイント

### ヘルスチェック
```
GET /health
```

### 来店チェックイン
```
POST /api/checkin
Content-Type: application/json

{
  "lineUid": "string",
  "displayName": "string"
}
```

### 購入履歴記録
```
POST /api/purchase
Content-Type: application/json

{
  "lineUid": "string",
  "displayName": "string",
  "items": [
    {
      "name": "string",
      "quantity": number,
      "price": number
    }
  ],
  "total": number,
  "memo": "string",
  "timestamp": "string"
}
```

### 履歴取得
```
GET /api/history/:lineUid?type=checkin&limit=50
```

## ログ形式

構造化JSONログを使用：

```json
{
  "timestamp": "2024-01-01T10:00:00.000Z",
  "operation": "checkin",
  "context": {
    "lineUid": "user123",
    "displayName": "Test User"
  },
  "message": "User checked in successfully",
  "ai_todo": "Monitor checkin patterns",
  "human_note": "First time user",
  "environment": "production"
}
```

## テスト

```bash
# 全テスト実行
npm test

# カバレッジ付きテスト
npm test -- --coverage

# 特定のテストファイル
npm test -- src/pages/history.test.tsx
```

## プロジェクト構造

```
userhistory/
├── src/
│   ├── api/
│   │   └── notion.ts          # Notion API ラッパー
│   ├── components/            # 再利用可能コンポーネント
│   ├── pages/
│   │   ├── purchase.tsx       # 購入履歴入力ページ
│   │   └── history.tsx        # 履歴閲覧ページ
│   ├── styles/
│   │   └── tailwind.css       # Tailwind CSS
│   ├── App.tsx               # メインアプリケーション
│   └── main.tsx              # エントリーポイント
├── server.ts                 # Express.js サーバー
├── railway.json              # Railway設定
├── vite.config.mjs           # Vite設定
├── tailwind.config.cjs       # Tailwind設定
├── jest.config.js            # Jest設定
└── package.json
```

## トラブルシューティング

### よくある問題

1. **LIFF初期化エラー**
   - VITE_LIFF_IDが正しく設定されているか確認
   - LINE Developers ConsoleでEndpoint URLが正しいか確認

2. **Notion API エラー**
   - NOTION_API_KEYが有効か確認
   - データベースIDが正しいか確認
   - データベースの権限設定を確認

3. **Railwayデプロイエラー**
   - 環境変数が正しく設定されているか確認
   - Railwayダッシュボードでログを確認

### ログ確認

```bash
# Railwayログ確認
railway logs

# ローカルログ確認
npm run dev:server
```

## ライセンス

MIT License

