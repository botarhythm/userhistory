# Notion MCPサーバー設定ガイド

## 概要

Notion MCPサーバーを使用して、AIが直接Notionデータベースにアクセスし、データの取得・更新・分析を行うことができます。

## 🚀 設定手順

### 1. MCPサーバーのインストール

```bash
# Notion MCPサーバーをインストール
npm install -g @modelcontextprotocol/server-notion
```

### 2. 環境変数の設定

```bash
# Notion API Keyを設定
export NOTION_API_KEY="your-notion-api-key"
```

### 3. Cursor設定ファイルの配置

`notion-mcp-config.json`を以下の場所に配置：

#### Windows (Cursor)
```
C:\Users\[USERNAME]\AppData\Roaming\Cursor\User\globalStorage\cursor.mcp\mcp-servers.json
```

#### macOS (Cursor)
```
~/Library/Application Support/Cursor/User/globalStorage/cursor.mcp/mcp-servers.json
```

#### Linux (Cursor)
```
~/.config/Cursor/User/globalStorage/cursor.mcp/mcp-servers.json
```

### 4. 設定ファイルの内容

```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-notion"],
      "env": {
        "NOTION_API_KEY": "${NOTION_API_KEY}"
      }
    }
  }
}
```

## 🔧 使用方法

### AIによる直接的なNotion操作

設定完了後、AIは以下のような操作が可能になります：

```bash
# データベース一覧取得
mcp_notion_list_databases

# ページ一覧取得
mcp_notion_list_pages

# データベースクエリ実行
mcp_notion_query_database

# ページ作成
mcp_notion_create_page

# ページ更新
mcp_notion_update_page
```

### 具体的な使用例

#### 1. 顧客データベースの確認
```bash
# 顧客データベースの構造を確認
mcp_notion_retrieve_database --database-id YOUR_CUSTOMER_DB_ID
```

#### 2. 履歴データの取得
```bash
# 特定顧客の履歴を取得
mcp_notion_query_database --database-id YOUR_HISTORY_DB_ID --filter "customer_id equals CUSTOMER_ID"
```

#### 3. 新しい来店記録の作成
```bash
# 来店記録を作成
mcp_notion_create_page --parent-database-id YOUR_HISTORY_DB_ID --properties '{"type": "来店", "customer_id": "CUSTOMER_ID", "date": "2024-01-15"}'
```

## 📊 現在のプロジェクトとの統合

### 既存のNotion API実装との違い

| 項目 | 既存のNotion API | Notion MCPサーバー |
|------|------------------|-------------------|
| **アクセス方法** | プログラムコード内 | AIによる直接操作 |
| **用途** | アプリケーション機能 | データ分析・管理 |
| **操作者** | 開発者・ユーザー | AIアシスタント |
| **リアルタイム性** | 高 | 高 |

### 統合メリット

1. **AIによる自動データ分析**: 顧客行動パターンの自動分析
2. **リアルタイム監視**: データベースの状態をリアルタイムで監視
3. **自動データ修正**: 不整合データの自動検出・修正
4. **レポート生成**: 自動的なレポート生成

## 🔍 トラブルシューティング

### よくある問題

#### 1. MCPサーバーが起動しない
```bash
# ログを確認
npx @modelcontextprotocol/server-notion --debug

# 環境変数を確認
echo $NOTION_API_KEY
```

#### 2. 権限エラー
- Notion API Keyの権限を確認
- データベースへのアクセス権限を確認

#### 3. 接続エラー
```bash
# ネットワーク接続を確認
curl -H "Authorization: Bearer $NOTION_API_KEY" \
     -H "Notion-Version: 2022-06-28" \
     https://api.notion.com/v1/users/me
```

## 📈 高度な使用方法

### 1. 自動データ分析

```bash
# 顧客の来店頻度分析
mcp_notion_query_database --database-id HISTORY_DB_ID --filter "type equals 来店" --sorts "date descending"
```

### 2. データ整合性チェック

```bash
# 孤立した履歴レコードの検出
mcp_notion_query_database --database-id HISTORY_DB_ID --filter "customer_id is empty"
```

### 3. パフォーマンス監視

```bash
# データベースサイズの監視
mcp_notion_retrieve_database --database-id CUSTOMER_DB_ID
```

## 🔒 セキュリティ

### 推奨事項

1. **API Keyの管理**: 環境変数での管理を徹底
2. **権限の最小化**: 必要最小限の権限のみ付与
3. **アクセスログ**: 定期的なアクセスログの確認
4. **バックアップ**: 重要なデータの定期的なバックアップ

## 📞 サポート

### 問題が発生した場合

1. **MCPサーバーログ**: デバッグモードでログを確認
2. **Notion API Status**: Notion APIの稼働状況を確認
3. **権限確認**: API Keyとデータベース権限を確認
4. **ネットワーク**: ネットワーク接続を確認

### 参考リンク

- [Notion MCP Server Documentation](https://github.com/modelcontextprotocol/server-notion)
- [Notion API Documentation](https://developers.notion.com/)
- [MCP Protocol Documentation](https://modelcontextprotocol.io/) 