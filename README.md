# Botarhythm Coffee Roaster LINE Mini App

Botarhythm Coffee Roaster の顧客来店・購入履歴管理用LINEミニアプリ

## 🚀 機能

- LINEログイン（LIFF）
- 来店チェックイン
- 購入履歴登録
- 履歴閲覧
- Notion連携

## 🛠️ 開発環境

- Node.js 22+
- React + TypeScript
- Vite
- Tailwind CSS
- Railway (デプロイ)

## 📦 インストール

```bash
npm install
```

## 🚀 開発サーバー起動

```bash
npm run dev
```

## 🧪 テスト実行

```bash
npm test
```

## 🔨 ビルド

```bash
npm run build
```

## 🤖 AI自動トラブルシューティング

デプロイ失敗時や問題発生時に、AIが自動的にログを解析し修正案を提示します。

### 使用方法

```bash
# 診断のみ実行
npm run troubleshoot

# 診断 + 自動修正実行
npm run auto-fix
```

### 機能

- 🔍 **自動診断**: Railwayログの自動取得・解析
- 🤖 **AI解析**: Gemini CLIを使用したログ分析
- 📊 **レポート生成**: 詳細な診断レポート
- 🛠️ **自動修正**: 依存関係更新・ビルド・デプロイ
- 📝 **ログ監視**: リアルタイムログ確認

### 必要な環境変数

```bash
export RAILWAY_TOKEN="your-railway-token"
export RAILWAY_PROJECT_ID="your-project-id"
```

### 自動実行

GitHub Actionsでデプロイが失敗した場合、自動的にAIトラブルシューティングが実行されます。

## 📚 ドキュメント

- [GitHub Secrets設定手順](GITHUB_SECRETS_SETUP.md)
- [デプロイ失敗時の自動修正ガイド](DEPLOYMENT_TROUBLESHOOTING.md)
- [AI自動トラブルシューティングガイド](AI_TROUBLESHOOTING_GUIDE.md)
- [Notion MCPサーバー設定ガイド](notion-mcp-setup.md)

## 🔧 環境変数

### Railway環境変数（本番環境）

Railwayダッシュボードで以下の環境変数を設定してください：

- `NOTION_API_KEY`: Notion API キー
- `NOTION_CUSTOMER_DB_ID`: 顧客データベースID
- `NOTION_HISTORY_DB_ID`: 履歴データベースID
- `NOTION_PRODUCT_DB_ID`: 商品データベースID
- `VITE_LIFF_ID`: LINE LIFF ID

### 開発環境設定

ローカル開発時は、プロジェクトルートに `.env.local` ファイルを作成し、`env.example`の内容をコピーして使用してください：

```bash
# .env.local
# Railway Deployment Configuration
PORT=3000
NODE_ENV=development

# Notion API Configuration
NOTION_API_KEY=your_notion_api_key_here
NOTION_CUSTOMER_DB_ID=your_customer_db_id_here
NOTION_HISTORY_DB_ID=your_history_db_id_here
NOTION_PRODUCT_DB_ID=your_product_db_id_here

# LINE LIFF Configuration (for frontend)
VITE_LIFF_ID=your_line_liff_id_here
```

**重要**: 
- `.env`ファイルは直接編集せず、Railwayダッシュボードで設定してください
- ローカル開発時は`.env.local`ファイルを使用してください
- 機密情報は絶対にGitにコミットしないでください

## 🔗 Notion MCPサーバー設定

AIが直接Notionデータベースにアクセスしてデータ分析・管理を行うためのMCPサーバー設定が利用可能です。

### 設定手順

1. **MCPサーバーインストール**:
   ```bash
   npm install -g @modelcontextprotocol/server-notion
   ```

2. **環境変数設定**:
   ```bash
   export NOTION_API_KEY="your-notion-api-key"
   ```

3. **設定ファイル配置**: `notion-mcp-config.json`をCursorの設定ディレクトリに配置

詳細は[Notion MCPサーバー設定ガイド](notion-mcp-setup.md)を参照してください。

### 利用可能な機能

- 📊 **データベース分析**: 顧客行動パターンの自動分析
- 🔍 **リアルタイム監視**: データベース状態の監視
- 🛠️ **自動データ修正**: 不整合データの検出・修正
- 📈 **レポート生成**: 自動的なレポート生成

## 📄 ライセンス

MIT License

