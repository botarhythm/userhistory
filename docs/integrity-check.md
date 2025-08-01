# データベース整合性チェック機能

## 概要

Botarhythm Coffee Roaster LINEミニアプリのデータベース整合性を自動的にチェックし、問題を検出・修正する機能です。

## 整合性チェック項目

この機能は以下の項目をチェックします：

1. **孤立した履歴レコード**: 履歴DBに存在するが、顧客DBに対応する顧客が存在しないレコード
2. **無効なリレーション**: 履歴レコードの関連顧客IDが空または無効な値
3. **重複するLINE UID**: 同じLINE UIDを持つ顧客が複数存在する
4. **履歴のない顧客**: 顧客DBに存在するが、履歴DBに履歴が存在しない顧客
5. **データベース構造の整合性**: 必要なプロパティが存在するかチェック

### データベース構造

**顧客DB:**
- `表示名` (title)
- `LINE UID` (text)
- `登録日` (created_time)

**履歴DB:**
- `商品名` (title) - 来店の場合は「来店」、購入の場合は商品名
- `日時` (date)
- `メモ` (text)
- `関連顧客ID` (relation)

**商品マスタDB:**
- `商品名` (title)
- `表示順` (number)
- `販売中` (checkbox)

## 使用方法

### CLIでの実行

```bash
npm run check-db
```

### APIエンドポイント

```bash
# 整合性チェック実行
curl -X GET http://localhost:3000/api/debug/integrity-check

# 孤立レコード削除
curl -X POST http://localhost:3000/api/debug/cleanup-orphaned-records \
  -H "Content-Type: application/json" \
  -d '{"orphanedIds": ["history-id-1", "history-id-2"]}'
```

### 管理パネル

ブラウザで `http://localhost:3000` にアクセスし、管理パネルから整合性チェックを実行できます。

## 出力形式

### 構造化ログ

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "operation": "database_integrity_check",
  "context": {
    "totalCustomers": 10,
    "totalHistoryRecords": 25,
    "orphanedRecords": 2,
    "invalidRelations": 1,
    "duplicateCustomers": 0
  },
  "message": "整合性チェック完了: 10件の顧客、25件の履歴を確認",
  "ai_todo": "孤立した履歴レコードの削除または修正を提案",
  "human_note": "問題が見つかった場合は、手動での確認と修正が必要です"
}
```

### 詳細JSON出力

```json
{
  "success": true,
  "result": {
    "operation": "database_integrity_check",
    "context": {
      "totalCustomers": 10,
      "totalHistoryRecords": 25,
      "orphanedRecords": 2,
      "invalidRelations": 1,
      "duplicateCustomers": 0
    },
    "details": {
      "orphanedHistoryIds": ["id1", "id2"],
      "invalidRelationIds": ["id3"],
      "duplicateLineUids": [],
      "customersWithoutHistory": ["id4", "id5"]
    }
  }
}
```

## エラーハンドリング

### よくあるエラーと解決方法

1. **API認証エラー**
   - 原因: Notion APIキーが無効
   - 解決: `.env`ファイルの`NOTION_API_KEY`を確認

2. **データベースアクセスエラー**
   - 原因: データベースIDが間違っている、または権限がない
   - 解決: データベースIDとインテグレーション権限を確認

3. **プロパティ名エラー**
   - 原因: データベース構造が変更された
   - 解決: データベース構造を確認し、コードを更新

## 定期実行

### GitHub Actions

```yaml
name: Database Integrity Check
on:
  schedule:
    - cron: '0 2 * * *'  # 毎日午前2時
  workflow_dispatch:

jobs:
  integrity-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run check-db
        env:
          NOTION_API_KEY: ${{ secrets.NOTION_API_KEY }}
          NOTION_CUSTOMER_DB_ID: ${{ secrets.NOTION_CUSTOMER_DB_ID }}
          NOTION_HISTORY_DB_ID: ${{ secrets.NOTION_HISTORY_DB_ID }}
```

### Railway Cron Jobs

RailwayのCron Jobs機能を使用して定期実行することも可能です。

## セキュリティ考慮事項

1. **APIキー管理**: 環境変数で安全に管理
2. **最小権限の原則**: 必要最小限の権限のみ付与
3. **ログの機密性**: 個人情報を含むログは適切に処理
4. **アクセス制御**: 管理機能へのアクセスを制限

## トラブルシューティング

### ログの確認

```bash
# サーバーログの確認
npm run dev

# 詳細ログの確認
DEBUG=* npm run check-db
```

### 環境変数の確認

```bash
# 環境変数の確認
node -e "console.log(process.env.NOTION_API_KEY ? 'API Key: OK' : 'API Key: Missing')"
```

### Notion API ステータス

- [Notion API Status](https://status.notion.so/)
- [Notion API Documentation](https://developers.notion.com/)

### データベース構造の確認

MCPサーバーを使用してデータベース構造を直接確認できます。

## 今後の改善点

1. **自動重複顧客統合**: 重複顧客の自動統合機能
2. **構造検証**: データベース構造の自動検証
3. **通知機能**: 問題検出時の自動通知
4. **バックアップ**: 修正前の自動バックアップ

## 関連ファイル

- `src/utils/db-integrity-checker.ts` - 整合性チェックロジック
- `scripts/check-db-integrity.ts` - CLIスクリプト
- `src/components/DatabaseIntegrityPanel.tsx` - 管理パネルUI
- `server.ts` - APIエンドポイント
- `src/utils/db-integrity-checker.test.ts` - テストコード 