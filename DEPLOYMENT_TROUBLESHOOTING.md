# デプロイ失敗時のトラブルシューティング

## 概要
GitHub ActionsからRailwayへのデプロイが失敗した場合の対処法

## よくある失敗原因と対処法

### 1. Railway CLI認証エラー

**症状**: `Authentication failed` エラー

**原因**: 
- RAILWAY_TOKENが無効
- Tokenの権限不足

**対処法**:
1. [Railway Account Settings](https://railway.app/account/tokens) で新しいTokenを生成
2. GitHub Secretsの`RAILWAY_TOKEN`を更新

### 2. プロジェクトIDエラー

**症状**: `Project not found` エラー

**原因**:
- RAILWAY_PROJECT_IDが間違っている
- プロジェクトへのアクセス権限がない

**対処法**:
1. Railwayダッシュボードで正しいProject IDを確認
2. GitHub Secretsの`RAILWAY_PROJECT_ID`を更新

### 3. ビルドエラー

**症状**: `Build failed` エラー

**原因**:
- TypeScriptコンパイルエラー
- 依存関係の問題

**対処法**:
1. ローカルで`npm run build`を実行してエラーを確認
2. TypeScriptエラーを修正
3. 依存関係を更新

### 4. 環境変数エラー

**症状**: `Environment variable not found` エラー

**原因**:
- Railwayで必要な環境変数が設定されていない

**対処法**:
1. Railwayダッシュボードで環境変数を設定:
   - `NOTION_API_KEY`
   - `NOTION_CUSTOMER_DB_ID`
   - `NOTION_HISTORY_DB_ID`
   - `VITE_LIFF_ID`

## デバッグ手順

### Step 1: GitHub Actionsログ確認

1. GitHubリポジトリの Actions タブを開く
2. 失敗したワークフローをクリック
3. 失敗したステップのログを確認

### Step 2: ローカルテスト

```bash
# 依存関係インストール
npm ci

# テスト実行
npm test

# ビルド実行
npm run build

# Railway CLIテスト
npm install -g @railway/cli
railway login --token YOUR_TOKEN
railway status
```

### Step 3: Railway CLI直接テスト

```bash
# Railway CLIで直接デプロイ
railway up --project YOUR_PROJECT_ID
```

## 代替デプロイ方法

### 方法1: Railway CLI（現在使用中）

```yaml
- name: Deploy to Railway
  run: |
    npm install -g @railway/cli
    railway login --token ${{ secrets.RAILWAY_TOKEN }}
    railway up --project ${{ secrets.RAILWAY_PROJECT_ID }}
```

### 方法2: Railway GitHub Action

```yaml
- name: Deploy to Railway
  uses: railway/deploy@v1
  with:
    service: ${{ secrets.RAILWAY_PROJECT_ID }}
    token: ${{ secrets.RAILWAY_TOKEN }}
```

### 方法3: 手動デプロイ

```bash
# ローカルから手動デプロイ
git push origin main
# または
railway up
```

## 緊急時の対処法

### 1. 手動デプロイ

```bash
# Railway CLIで直接デプロイ
railway up --project YOUR_PROJECT_ID
```

### 2. Railwayダッシュボードからデプロイ

1. Railwayダッシュボードにアクセス
2. プロジェクトを選択
3. "Deploy" ボタンをクリック

### 3. ロールバック

```bash
# 前のバージョンに戻す
railway rollback
```

## 予防策

### 1. 事前テスト

```bash
# デプロイ前に必ず実行
npm test
npm run build
```

### 2. 環境変数チェック

```bash
# 必要な環境変数が設定されているか確認
railway variables
```

### 3. ログ監視

```bash
# デプロイ後のログ確認
railway logs
```

## サポート

問題が解決しない場合は：

1. GitHub Actionsログの詳細を確認
2. Railwayダッシュボードのログを確認
3. ローカル環境での再現を試行
4. 必要に応じてRailwayサポートに問い合わせ 