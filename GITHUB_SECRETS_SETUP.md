# GitHub Secrets設定手順

## 概要
Railway CI/CDで必要なGitHub Secretsを設定します。

## 必要なSecrets

### 1. RAILWAY_TOKEN
Railway API Token（Railwayアカウントから取得）

### 2. RAILWAY_SERVICE  
Railway Service ID（Railwayダッシュボードから取得）

---

## 設定手順

### Step 1: Railway API Tokenの取得

1. [Railway Account Settings](https://railway.app/account/tokens) にアクセス
2. "New Token" をクリック
3. Token名を入力（例: "GitHub Actions"）
4. "Create Token" をクリック
5. 生成されたTokenをコピー（一度しか表示されません）

### Step 2: Railway Service IDの取得

1. [Railway Dashboard](https://railway.app/dashboard) にアクセス
2. プロジェクトを選択
3. サービスを選択
4. Settings タブを開く
5. "Service ID" をコピー

### Step 3: GitHub Secrets設定

1. GitHubリポジトリの Settings タブを開く
2. 左サイドバーの "Secrets and variables" → "Actions" を選択
3. "New repository secret" をクリック

#### RAILWAY_TOKEN設定
- **Name**: `RAILWAY_TOKEN`
- **Value**: Step 1で取得したRailway API Token
- "Add secret" をクリック

#### RAILWAY_SERVICE設定
- **Name**: `RAILWAY_SERVICE`
- **Value**: Step 2で取得したRailway Service ID
- "Add secret" をクリック

---

## 確認方法

### GitHub Actionsでの確認
1. GitHubリポジトリの Actions タブを開く
2. mainブランチにpush
3. ワークフローが正常に実行されることを確認

### Railwayでの確認
1. Railwayダッシュボードでデプロイ履歴を確認
2. 最新のデプロイがGitHub Actionsから実行されていることを確認

---

## トラブルシューティング

### よくある問題

1. **"RAILWAY_TOKEN not found" エラー**
   - GitHub Secretsに正しく設定されているか確認
   - Tokenが有効か確認

2. **"RAILWAY_SERVICE not found" エラー**
   - Service IDが正しいか確認
   - Railwayプロジェクトにアクセス権限があるか確認

3. **デプロイが実行されない**
   - mainブランチにpushされているか確認
   - GitHub Actionsが有効になっているか確認

### ログ確認

```bash
# GitHub Actionsログ確認
# GitHubリポジトリの Actions タブで確認

# Railwayログ確認
railway logs
```

---

## 注意事項

- Railway API Tokenは機密情報です。絶対に公開しないでください
- Tokenは定期的に更新することを推奨します
- Service IDはプロジェクトごとに異なります 