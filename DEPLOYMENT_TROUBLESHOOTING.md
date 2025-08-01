# Railway デプロイ失敗時の自動修正ガイド

## 概要
GitHub ActionsからRailwayへのデプロイが失敗した場合の自動修正とトラブルシューティング

## 🚨 緊急時の自動修正手順

### 1. AIによる自動ログ解析
デプロイ失敗時、以下のコマンドでAIが自動的にログを解析し修正案を提示：

```bash
# Railwayログの自動取得・解析
railway logs --project YOUR_PROJECT_ID | gemini chat "デプロイ失敗の原因を分析し、修正案を提示してください"

# GitHub Actionsログの解析
# GitHubリポジトリの Actions タブでログをコピーして以下を実行
echo "ログ内容" | gemini chat "GitHub Actionsのデプロイ失敗原因を分析し、修正手順を提示してください"
```

### 2. 自動修正スクリプト
```bash
#!/bin/bash
# auto-fix-deployment.sh

echo "🔍 デプロイ失敗の自動診断を開始..."

# 1. Railway CLIの状態確認
echo "📋 Railway CLI状態確認..."
railway status --project $RAILWAY_PROJECT_ID

# 2. 環境変数チェック
echo "🔧 環境変数チェック..."
railway variables --project $RAILWAY_PROJECT_ID

# 3. 最新ログ取得
echo "📊 最新ログ取得..."
railway logs --project $RAILWAY_PROJECT_ID --limit 50

# 4. 自動修正実行
echo "🛠️ 自動修正実行..."
railway up --project $RAILWAY_PROJECT_ID --detach

echo "✅ 自動修正完了"
```

## よくある失敗原因と対処法

### 1. Railway CLI認証エラー

**症状**: `Authentication failed` エラー

**原因**: 
- RAILWAY_TOKENが無効
- Tokenの権限不足

**自動修正手順**:
```bash
# 1. 新しいToken生成（手動）
# https://railway.app/account/tokens

# 2. GitHub Secrets更新（手動）
# GitHubリポジトリ → Settings → Secrets → Actions

# 3. 自動再デプロイ
railway up --project $RAILWAY_PROJECT_ID
```

### 2. プロジェクトIDエラー

**症状**: `Project not found` エラー

**原因**:
- RAILWAY_PROJECT_IDが間違っている
- プロジェクトへのアクセス権限がない

**自動修正手順**:
```bash
# 1. 正しいProject ID確認
railway projects

# 2. GitHub Secrets更新
# RAILWAY_PROJECT_IDを正しい値に更新

# 3. 自動再デプロイ
railway up --project $RAILWAY_PROJECT_ID
```

### 3. ビルドエラー

**症状**: `Build failed` エラー

**原因**:
- TypeScriptコンパイルエラー
- 依存関係の問題
- Node.jsバージョン不一致

**自動修正手順**:
```bash
# 1. ローカルビルドテスト
npm ci
npm run build

# 2. TypeScriptエラー修正
npm run type-check

# 3. 依存関係更新
npm update

# 4. 自動再デプロイ
git add .
git commit -m "Fix build errors"
git push origin main
```

### 4. 環境変数エラー

**症状**: `Environment variable not found` エラー

**原因**:
- Railwayで必要な環境変数が設定されていない

**自動修正手順**:
```bash
# 1. 必要な環境変数設定
railway variables set NOTION_API_KEY=$NOTION_API_KEY
railway variables set NOTION_CUSTOMER_DB_ID=$NOTION_CUSTOMER_DB_ID
railway variables set NOTION_HISTORY_DB_ID=$NOTION_HISTORY_DB_ID
railway variables set VITE_LIFF_ID=$VITE_LIFF_ID

# 2. 環境変数確認
railway variables

# 3. 自動再デプロイ
railway up --project $RAILWAY_PROJECT_ID
```

## 🤖 AI支援デバッグ手順

### Step 1: 自動ログ解析
```bash
# Railwayログの自動解析
railway logs --project $RAILWAY_PROJECT_ID --limit 100 | \
gemini chat "以下のRailwayログを分析し、デプロイ失敗の原因と修正手順を日本語で提示してください："
```

### Step 2: コード自動修正
```bash
# TypeScriptエラーの自動修正
npm run type-check 2>&1 | \
gemini chat "以下のTypeScriptエラーを修正してください。修正後のコードを提示してください："
```

### Step 3: 設定ファイル自動修正
```bash
# package.jsonの依存関係チェック
cat package.json | \
gemini chat "このpackage.jsonの依存関係に問題がないかチェックし、修正案を提示してください："
```

## 🚀 代替デプロイ方法

### 方法1: Railway CLI（推奨）
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

## 🆘 緊急時の対処法

### 1. 即座の手動デプロイ
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

## 🔧 予防策

### 1. 事前テスト自動化
```bash
# デプロイ前に必ず実行
npm test
npm run build
npm run type-check
```

### 2. 環境変数自動チェック
```bash
# 必要な環境変数が設定されているか確認
railway variables --project $RAILWAY_PROJECT_ID
```

### 3. ログ監視自動化
```bash
# デプロイ後のログ確認
railway logs --project $RAILWAY_PROJECT_ID --limit 20
```

## 📊 監視とアラート

### 1. デプロイ状態監視
```bash
# デプロイ状態の定期確認
railway status --project $RAILWAY_PROJECT_ID
```

### 2. パフォーマンス監視
```bash
# アプリケーションのパフォーマンス確認
railway logs --project $RAILWAY_PROJECT_ID --limit 50 | grep -i "error\|warning"
```

## 🆘 サポート

問題が解決しない場合は：

1. **AI支援**: 上記のgeminiコマンドで自動解析
2. **GitHub Actionsログ**: 詳細なエラー情報を確認
3. **Railwayダッシュボード**: リアルタイムログを確認
4. **ローカル環境**: 再現テストを実行
5. **Railwayサポート**: 必要に応じて問い合わせ

## 📝 ログ解析テンプレート

### Railwayログ解析
```bash
railway logs --project $RAILWAY_PROJECT_ID --limit 100 | \
gemini chat "
以下のRailwayログを分析してください：

1. エラーの種類と原因
2. 影響範囲
3. 修正手順
4. 再発防止策

ログ内容：
"
```

### GitHub Actionsログ解析
```bash
echo "GitHub Actionsログ内容" | \
gemini chat "
以下のGitHub Actionsログを分析してください：

1. 失敗したステップ
2. エラーメッセージの詳細
3. 修正方法
4. 次回の予防策

ログ内容：
"
``` 