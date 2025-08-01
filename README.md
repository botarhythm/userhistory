# Botarhythm Coffee Roaster LINE Mini App

Botarhythm Coffee Roaster の顧客来店・購入履歴管理システム

## 機能

- LINEログイン（LIFF）
- 来店チェックイン
- 購入履歴記録
- 履歴一覧表示
- Notionデータベース連携

## 技術スタック

- **フロントエンド**: React + TypeScript + Tailwind CSS
- **バックエンド**: Node.js + Express + TypeScript
- **データベース**: Notion API
- **デプロイ**: Railway
- **認証**: LINE LIFF

## 環境変数

以下の環境変数を設定してください：

```bash
# Notion API
NOTION_API_KEY=your_notion_api_key
NOTION_CUSTOMER_DATABASE_ID=your_customer_database_id
NOTION_DATABASE_ID=your_history_database_id

# LINE LIFF
VITE_LIFF_ID=your_liff_id
```

## Notion MCP設定

Notion MCPサーバーを使用する場合は、以下の設定ファイルを作成してください：

### `notion-mcp-config.json`
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

## 開発

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# テスト
npm test
```

## デプロイ

Railwayを使用して自動デプロイされます。mainブランチにプッシュすると自動的にデプロイされます。

## データベース構造

### 顧客データベース
- LINE UID (Title)
- 表示名 (Rich Text)
- 登録日 (Date)

### 履歴データベース
- 関連顧客 (Relation)
- タイプ (Select: 来店/購入)
- 日時 (Date)
- 商品名 (Rich Text)
- 数量 (Number)
- 合計金額 (Number)
- メモ (Rich Text)

## ライセンス

MIT

