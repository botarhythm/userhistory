# データベース整合性チェック機能

## 概要

Botarhythm Coffee Roaster LINEミニアプリのNotionデータベース整合性チェック機能は、顧客データベースと履歴データベース間のリレーションシップの整合性を確認し、問題のあるレコードを検出・修正するためのツールです。

## 機能

### 1. 整合性チェック項目

- **孤立した履歴レコード**: 存在しない顧客IDを参照している履歴レコード
- **無効なリレーション**: 顧客IDが空の履歴レコード
- **重複するLINE UID**: 同じLINE UIDを持つ複数の顧客
- **履歴のない顧客**: まだ来店や購入履歴がない顧客（正常な状態）

### 2. 自動修正機能

- **孤立レコード削除**: 存在しない顧客を参照する履歴レコードの自動削除
- **重複顧客統合**: 同じLINE UIDを持つ顧客の統合（手動確認が必要）

## 使用方法

### CLIスクリプトでの実行

```bash
# 整合性チェックを実行
npm run check-db
```

### APIエンドポイントでの実行

```bash
# 整合性チェック実行
curl -X GET http://localhost:3000/api/debug/integrity-check

# 孤立レコード削除
curl -X POST http://localhost:3000/api/debug/cleanup-orphaned-records \
  -H "Content-Type: application/json" \
  -d '{"orphanedIds": ["history-id-1", "history-id-2"]}'
```

### 管理画面での実行

1. ブラウザで管理画面にアクセス
2. 「データベース整合性チェック」パネルを表示
3. 「整合性チェック実行」ボタンをクリック
4. 問題がある場合は「孤立レコード削除」ボタンで自動修正

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
    "invalidRelations": 0,
    "duplicateCustomers": 1
  },
  "message": "整合性チェック完了: 10件の顧客、25件の履歴を確認",
  "ai_todo": "孤立した履歴レコードの削除または修正を提案",
  "human_note": "問題が見つかった場合は、手動での確認と修正が必要です",
  "environment": "production"
}
```

### 詳細結果

```json
{
  "success": true,
  "result": {
    "operation": "database_integrity_check",
    "context": {
      "totalCustomers": 10,
      "totalHistoryRecords": 25,
      "orphanedRecords": 2,
      "invalidRelations": 0,
      "duplicateCustomers": 1
    },
    "message": "整合性チェック完了: 10件の顧客、25件の履歴を確認",
    "ai_todo": "孤立した履歴レコードの削除または修正を提案",
    "human_note": "問題が見つかった場合は、手動での確認と修正が必要です",
    "details": {
      "orphanedHistoryIds": ["history-id-1", "history-id-2"],
      "invalidRelationIds": [],
      "duplicateLineUids": ["line-uid-1"],
      "customersWithoutHistory": ["customer-id-1", "customer-id-2"]
    }
  }
}
```

## エラーハンドリング

### よくあるエラーと対処法

1. **NOTION_API_KEY環境変数が設定されていない**
   ```
   解決策: .envファイルまたはRailwayの環境変数でNOTION_API_KEYを設定
   ```

2. **データベースIDが無効**
   ```
   解決策: env.exampleのデータベースIDを確認し、正しいIDに更新
   ```

3. **Notion APIの権限不足**
   ```
   解決策: Notionインテグレーションの権限設定を確認
   ```

4. **ネットワークエラー**
   ```
   解決策: インターネット接続とNotion APIの可用性を確認
   ```

## 定期実行

### GitHub Actionsでの定期実行

```yaml
name: Database Integrity Check
on:
  schedule:
    - cron: '0 2 * * *'  # 毎日午前2時に実行

jobs:
  integrity-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run check-db
        env:
          NOTION_API_KEY: ${{ secrets.NOTION_API_KEY }}
          NOTION_CUSTOMER_DB_ID: ${{ secrets.NOTION_CUSTOMER_DB_ID }}
          NOTION_HISTORY_DB_ID: ${{ secrets.NOTION_HISTORY_DB_ID }}
```

### Railwayでの定期実行

RailwayのCron Jobs機能を使用して定期実行を設定できます。

## セキュリティ考慮事項

1. **APIキーの管理**: Notion APIキーは環境変数で管理し、リポジトリにコミットしない
2. **権限の最小化**: 必要最小限の権限のみをNotionインテグレーションに付与
3. **ログの機密性**: 顧客情報を含むログは適切にマスキングまたは削除
4. **アクセス制御**: 管理画面へのアクセスは認証済みユーザーのみに制限

## トラブルシューティング

### 問題の診断

1. **ログの確認**: 構造化ログでエラーの詳細を確認
2. **環境変数の確認**: 必要な環境変数が正しく設定されているか確認
3. **Notion APIの状態確認**: Notion APIの可用性を確認
4. **データベース構造の確認**: Notionデータベースのプロパティ名が正しいか確認

### 手動修正

1. **孤立レコードの手動削除**: Notion UIで直接削除
2. **重複顧客の手動統合**: 履歴を統合してから重複顧客を削除
3. **無効リレーションの修正**: 正しい顧客IDにリレーションを修正

## 今後の改善予定

- [ ] 重複顧客の自動統合機能
- [ ] データベース構造の自動検証
- [ ] 整合性チェック結果のメール通知
- [ ] より詳細な統計情報の提供
- [ ] 履歴データのバックアップ機能

## 関連ファイル

- `src/utils/db-integrity-checker.ts`: 整合性チェックのコアロジック
- `scripts/check-db-integrity.ts`: CLIスクリプト
- `src/components/DatabaseIntegrityPanel.tsx`: 管理画面コンポーネント
- `server.ts`: APIエンドポイント
- `src/utils/db-integrity-checker.test.ts`: テストファイル 