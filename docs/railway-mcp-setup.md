# Railway MCP サーバー設定ガイド

このガイドでは、Botarhythm Coffee Roaster LINEミニアプリのRailway MCPサーバーの設定方法を説明します。

## 🚂 Railway MCP サーバーとは

Railway MCPサーバーは、Model Context Protocolを使用してRailwayのデプロイメントと管理を自動化するためのサーバーです。AIが直接Railwayの操作を行うことができ、デプロイメントの監視、ログ取得、自動修復などの機能を提供します。

## 📋 前提条件

- Node.js 20以上
- Railway CLI（MCPサーバーが使用できない場合のフォールバック用）
- Railwayアカウントとプロジェクト
- Railway API トークン

## 🔧 セットアップ手順

### 1. Railway CLIのインストール（フォールバック用）

```bash
npm install -g @railway/cli
```

**注意**: Railway CLIはMCPサーバーが使用できない場合のフォールバックとしてのみ使用します。

### 2. Railway API トークンの取得

1. [Railway Dashboard](https://railway.app/dashboard)にアクセス
2. 右上のプロフィールアイコンをクリック
3. "Account Settings"を選択
4. "API"タブをクリック
5. "Generate Token"をクリックしてトークンを生成
6. トークンをコピーして保存

### 3. プロジェクトIDの確認

現在のプロジェクトID: `093e4f04-ebb8-44d8-b87c-8e9e06743e54`

### 4. MCPサーバーの設定

Cursorの設定ファイル（`.cursor/mcp.json`）に以下を追加：

```json
{
  "mcpServers": {
    "Notion": {
      "url": "https://mcp.notion.com/mcp",
      "headers": {}
    },
    "Railway": {
      "command": "node",
      "args": ["scripts/railway-mcp-server.js"],
      "env": {
        "RAILWAY_TOKEN": "${RAILWAY_TOKEN}",
        "RAILWAY_PROJECT_ID": "093e4f04-ebb8-44d8-b87c-8e9e06743e54"
      }
    }
  }
}
```

## 🛠️ 利用可能な機能

### デプロイメント管理

- **railway_deploy**: アプリケーションをRailwayにデプロイ
- **railway_status**: デプロイメント状態の確認
- **railway_health_check**: デプロイメントの健全性チェック

### ログ監視

- **railway_logs**: デプロイメントログの取得
- **railway_logs_follow**: リアルタイムログの監視

### 自動修復

- **railway_auto_fix**: 問題の自動検出と修復
- **railway_update_env**: 環境変数の更新

## 📝 使用方法

### AIからの使用（推奨）

CursorでAIと対話する際に、以下のような自然言語でRailwayの操作を実行できます：

```
"Railwayにデプロイして"
"デプロイメントのログを確認して"
"デプロイメントの状態を教えて"
"問題があれば自動修復して"
```

### コマンドラインからの使用（フォールバック）

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

## 🔍 トラブルシューティング

### よくある問題

1. **RAILWAY_TOKENが設定されていない**
   ```
   ❌ RAILWAY_TOKEN environment variable is required
   ```
   → 環境変数にRAILWAY_TOKENを設定してください

2. **MCPサーバーが応答しない**
   ```
   MCP server not responding
   ```
   → Cursorを再起動してMCPサーバーを再初期化してください

3. **権限エラー**
   ```
   Railway command failed with code 401
   ```
   → Railway API トークンの権限を確認してください

### デバッグ方法

```bash
# MCPサーバーのテスト
node scripts/railway-mcp-server.js

# 環境変数の確認
echo $RAILWAY_TOKEN

# Railway CLIのバージョン確認（フォールバック用）
railway --version
```

## 🔒 セキュリティ

- Railway API トークンは機密情報です
- `.env`ファイルはGitにコミットしないでください
- 本番環境では環境変数として設定してください
- 定期的にAPI トークンを更新してください

## 📚 関連ドキュメント

- [Railway CLI Documentation](https://docs.railway.app/reference/cli)
- [Railway API Documentation](https://docs.railway.app/reference/public-api)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## 🤝 サポート

問題が発生した場合は、以下を確認してください：

1. MCPサーバーの設定
2. 環境変数の設定
3. Railwayプロジェクトの権限
4. ネットワーク接続

MCPサーバーが使用できない場合は、Railway CLIを使用したフォールバック方法を試してください。 