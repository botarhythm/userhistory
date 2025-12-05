# Botarhythm Coffee Roaster LINE Mini App

Botarhythm Coffee Roaster の顧客来店・購入履歴管理用LINEミニアプリです。

## 🚀 開発状況

### ✅ 実装済み機能

1. **LIFF認証システム**
   - LINEログイン機能
   - ユーザー情報の取得と表示
   - 開発環境でのモックユーザー対応

2. **来店チェックイン機能**
   - ワンタップチェックイン
   - メモ機能付き
   - 実際のLINEユーザー情報での記録

3. **購入履歴記録機能**
   - 商品検索・選択機能
   - 数量・価格入力
   - 複数商品対応
   - 合計金額計算

4. **履歴閲覧機能**
   - 来店・購入履歴の一覧表示
   - フィルタリング機能
   - 実際のLINEユーザーの履歴取得

5. **管理機能**
   - データベース整合性チェック
   - 自動修復機能

6. **Railway MCPサーバー**
   - デプロイメント自動化
   - ログ監視
   - 自動修復機能

### 🔧 技術スタック

- **フロントエンド**: React + TypeScript + Vite
- **バックエンド**: Node.js + Express
- **スタイリング**: Tailwind CSS
- **データベース**: Notion API
- **認証**: LINE LIFF
- **デプロイ**: Railway
- **MCP**: Railway MCP Server

## 🚂 Railway MCP サーバー設定

このプロジェクトはRailway MCPサーバーを使用してデプロイメントと管理を自動化しています。

### セットアップ

1. **Railway CLIのインストール（フォールバック用）**
```bash
npm install -g @railway/cli
```

2. **環境変数の設定**
```bash
# .envファイルに以下を追加
RAILWAY_TOKEN=your_railway_token_here
RAILWAY_PROJECT_ID=093e4f04-ebb8-44d8-b87c-8e9e06743e54
```

3. **GitHubシークレットの設定（重要）**

GitHubのリポジトリで以下のシークレットを設定する必要があります：

1. GitHubリポジトリの「Settings」タブを開く
2. 左サイドバーの「Secrets and variables」→「Actions」をクリック
3. 「New repository secret」をクリックして以下のシークレットを追加：

#### 必要なシークレット

| シークレット名 | 説明 | 取得方法 |
|---------------|------|----------|
| `RAILWAY_TOKEN` | Railway API トークン | [Railway Dashboard](https://railway.app/dashboard) → Account Settings → API → Generate Token |
| `RAILWAY_PROJECT_ID` | Railway プロジェクトID | `093e4f04-ebb8-44d8-b87c-8e9e06743e54`（固定値） |

#### Railway API トークンの取得手順

1. [Railway Dashboard](https://railway.app/dashboard)にアクセス
2. 右上のプロフィールアイコンをクリック
3. "Account Settings"を選択
4. "API"タブをクリック
5. "Generate Token"をクリックしてトークンを生成
6. トークンをコピーしてGitHubシークレットに設定

#### シークレット設定後の確認

シークレットが正しく設定されているか確認するには：

1. GitHubリポジトリの「Actions」タブを開く
2. 最新のワークフロー実行を確認
3. 「Check Railway secrets」ステップで「✅ RAILWAY_TOKEN is set」「✅ RAILWAY_PROJECT_ID is set」が表示されることを確認

### 使用方法

#### AIからの使用（推奨）

CursorでAIと対話する際に、以下のような自然言語でRailwayの操作を実行できます：

```
"Railwayにデプロイして"
"デプロイメントのログを確認して"
"デプロイメントの状態を教えて"
"問題があれば自動修復して"
```

#### コマンドラインからの使用（フォールバック）

MCPサーバーが使用できない場合のみ、以下のコマンドを使用してください：

```bash
# 本番環境にデプロイ
npm run railway:deploy

# ステージング環境にデプロイ
npm run railway:deploy:staging

# ログの確認
npm run railway:logs

# リアルタイムログの確認
npm run railway:logs:follow

# ステータスの確認
npm run railway:status

# 健全性チェック
npm run railway:health

# 自動修復
npm run railway:autofix

# 環境変数の更新
npm run railway:update-env
```

## 開発環境

### 必要な環境変数

```bash
# Railway Deployment Configuration
PORT=3000
NODE_ENV=production

# Railway MCP Server Configuration
RAILWAY_TOKEN=your_railway_token_here
RAILWAY_PROJECT_ID=093e4f04-ebb8-44d8-b87c-8e9e06743e54

# Notion API Configuration
NOTION_API_KEY=your_notion_api_key_here
NOTION_CUSTOMER_DB_ID=your_customer_database_id_here
NOTION_HISTORY_DB_ID=your_history_database_id_here
NOTION_PRODUCT_DB_ID=your_product_database_id_here

# LINE LIFF Configuration (for frontend) - 重要：LINE認証に必須
VITE_LIFF_ID=your_line_liff_id_here
```

## 🔍 LINE認証のトラブルシューティング

LINE認証で問題が発生した場合：

### 1. 開発環境での診断
- 開発環境でアプリを起動
- `/debug` ページにアクセス
- 「診断実行」ボタンをクリック
- 診断結果を確認

### 2. よくある問題と解決方法
- **`VITE_LIFF_ID`が未設定** → Railwayで設定後、再デプロイ
- **LINEアプリ外でアクセス** → LINEアプリからミニアプリを開く
- **ブラウザキャッシュ問題** → ブラウザのキャッシュをクリア
- **LIFF初期化エラー** → LIFF IDの形式を確認

### 3. LIFF IDの取得方法
1. LINE Developers Console にアクセス
2. チャンネルを選択
3. 「LIFF」タブで新しいLIFFアプリを作成
4. エンドポイントURLを設定（例：`https://your-app.railway.app`）
5. LIFF IDをコピーしてRailwayの環境変数に設定

### 開発サーバーの起動

```bash
# 開発環境の起動
npm run dev

# サーバーのみ起動
npm run dev:server

# クライアントのみ起動
npm run dev:client
```

### ビルド

```bash
# 全体のビルド
npm run build

# サーバーのビルド
npm run build:server

# クライアントのビルド
npm run build:client
```

### テスト

```bash
# テストの実行
npm run test

# 型チェック
npm run type-check

# リント
npm run lint
```

## データベース整合性チェック

```bash
# 整合性チェック
npm run check-integrity

# 自動修復
npm run fix-integrity
```

## プロジェクト構造

```
userhistory/
├── src/
│   ├── api/           # Notion API連携
│   ├── components/    # Reactコンポーネント
│   ├── contexts/      # React Context (LIFF)
│   ├── pages/         # ページコンポーネント
│   ├── styles/        # スタイルファイル
│   └── utils/         # ユーティリティ
├── scripts/           # 管理スクリプト
├── public/            # 静的ファイル
└── docs/              # ドキュメント
```

## 📋 次のステップ

### 1. LINE LIFF設定
- [ ] LINE Developers ConsoleでLIFFアプリを作成
- [ ] LIFF IDを環境変数に設定
- [ ] 本番環境でのLIFF動作確認

### 2. Notionデータベース設定
- [ ] 顧客データベースの作成
- [ ] 履歴データベースの作成
- [ ] 商品データベースの作成
- [ ] APIキーの取得と設定

### 3. 本番デプロイ
- [ ] Railwayでの本番環境構築
- [ ] 環境変数の設定
- [ ] 動作確認

### 4. 機能拡張
- [ ] リッチメニューとの連携
- [ ] プッシュ通知機能
- [ ] 統計・分析機能
- [ ] スタッフ向け管理画面

## ライセンス

MIT License

