# AI自動トラブルシューティングシステム ガイド

## 概要

AIが自動的にRailwayのデプロイ問題を診断し、修正案を提示するシステムです。デプロイ失敗時に即座にログを解析し、具体的な解決策を提供します。

## 🚀 機能一覧

### 1. 自動診断機能
- **環境変数チェック**: 必要な環境変数の存在確認
- **Railway CLI確認**: CLIツールのインストール状態確認
- **認証確認**: Railway API認証の妥当性確認
- **プロジェクト状態確認**: デプロイ対象プロジェクトの状態確認
- **環境変数確認**: Railway環境変数の設定状況確認
- **ログ取得**: 最新のデプロイログを自動取得

### 2. AI解析機能
- **Gemini CLI連携**: Google Geminiを使用したログ解析
- **エラー分類**: エラーの種類と原因を自動分類
- **影響範囲分析**: 問題の影響範囲を特定
- **修正手順生成**: 具体的な修正コマンドを提示
- **再発防止策**: 同様の問題の再発を防ぐ対策を提案

### 3. 自動修正機能
- **依存関係更新**: `npm ci`による依存関係の更新
- **テスト実行**: `npm test`による自動テスト実行
- **ビルド実行**: `npm run build`によるビルド実行
- **自動デプロイ**: Railwayへの自動再デプロイ

### 4. レポート生成機能
- **詳細レポート**: 診断結果の詳細なレポート生成
- **タイムスタンプ**: 診断実行時刻の記録
- **Markdown形式**: 読みやすいMarkdown形式での出力
- **ファイル保存**: 日付付きファイル名での自動保存

## 📋 使用方法

### 基本的な使用方法

```bash
# 診断のみ実行
npm run troubleshoot

# 診断 + 自動修正実行
npm run auto-fix
```

### 直接実行

```bash
# 診断のみ
node ai-troubleshooter.js

# 自動修正付き
node ai-troubleshooter.js --auto-fix
```

### GitHub Actions自動実行

デプロイが失敗した場合、自動的にAIトラブルシューティングが実行されます。

## 🔧 設定

### 必要な環境変数

```bash
# Railway API Token
export RAILWAY_TOKEN="your-railway-token"

# Railway Project ID
export RAILWAY_PROJECT_ID="your-project-id"
```

### GitHub Secrets設定

GitHub Actionsで自動実行する場合は、以下のSecretsを設定してください：

- `RAILWAY_TOKEN`: Railway API Token
- `RAILWAY_PROJECT_ID`: Railway Project ID

## 📊 出力例

### 正常な実行例

```
🚀 AI Railway 自動トラブルシューティング開始...
🔍 環境変数チェック中...
✅ 環境変数チェック完了
📦 Railway CLI確認中...
✅ Railway CLI確認完了
🔐 Railway認証中...
✅ Railway認証成功
📋 プロジェクト状態確認中...
✅ プロジェクト状態確認完了
🔧 Railway環境変数確認中...
✅ 環境変数確認完了
📊 最新ログ取得中...
✅ ログ取得完了
🤖 AIによるログ解析中...
✅ AI解析完了
📝 レポート生成中...
✅ レポート生成完了: /path/to/troubleshooting-report-2024-01-15.md
🎉 自動トラブルシューティング完了！
📄 レポート: /path/to/troubleshooting-report-2024-01-15.md
```

### エラー時の出力例

```
🚀 AI Railway 自動トラブルシューティング開始...
🔍 環境変数チェック中...
❌ 不足している環境変数: RAILWAY_TOKEN, RAILWAY_PROJECT_ID
💡 環境変数を設定してください:
   export RAILWAY_TOKEN="your-token"
   export RAILWAY_PROJECT_ID="your-project-id"
```

## 📝 レポート形式

生成されるレポートは以下の形式です：

```markdown
# Railway 自動トラブルシューティングレポート

**生成日時**: 2024-01-15T10:30:00.000Z
**プロジェクトID**: your-project-id

## 🔍 診断結果

### AI解析結果
[Gemini CLIによる詳細な分析結果]

### プロジェクト状態
```
[Railway status コマンドの出力]
```

### 環境変数
```
[Railway variables コマンドの出力]
```

### 最新ログ
```
[Railway logs コマンドの出力]
```

## 🛠️ 推奨アクション

1. 上記のAI解析結果に従って修正を実行
2. 必要に応じて手動での確認・修正
3. 修正後の再デプロイテスト

## 📞 サポート

問題が解決しない場合は：
- GitHub Actionsログの詳細確認
- Railwayダッシュボードでの直接確認
- Railwayサポートへの問い合わせ
```

## 🔍 トラブルシューティング

### よくある問題と対処法

#### 1. Gemini CLIが利用できない

**症状**: `Gemini CLIが利用できません` エラー

**対処法**:
```bash
# Gemini CLIをインストール
npm install -g @google/generative-ai
```

#### 2. Railway CLIがインストールされていない

**症状**: `Railway CLIがインストールされていません` エラー

**対処法**:
```bash
# Railway CLIをインストール
npm install -g @railway/cli
```

#### 3. 環境変数が設定されていない

**症状**: `不足している環境変数` エラー

**対処法**:
```bash
# 環境変数を設定
export RAILWAY_TOKEN="your-token"
export RAILWAY_PROJECT_ID="your-project-id"
```

#### 4. Railway認証失敗

**症状**: `Railway認証失敗` エラー

**対処法**:
- RAILWAY_TOKENが正しいか確認
- Tokenの権限が適切か確認
- Tokenが有効期限切れでないか確認

## 🚀 高度な使用方法

### カスタムログ解析

```bash
# 特定のログ行数で解析
railway logs --project $RAILWAY_PROJECT_ID --limit 200 | \
node ai-troubleshooter.js
```

### 定期実行

```bash
# cronで定期実行（例：毎時間）
0 * * * * cd /path/to/project && npm run troubleshoot
```

### CI/CD統合

```yaml
# GitHub Actionsでの統合例
- name: AI Troubleshooting
  if: failure()
  run: |
    export RAILWAY_TOKEN="${{ secrets.RAILWAY_TOKEN }}"
    export RAILWAY_PROJECT_ID="${{ secrets.RAILWAY_PROJECT_ID }}"
    npm run troubleshoot
```

## 📈 パフォーマンス

### 実行時間目安

- **診断のみ**: 30秒〜2分
- **自動修正付き**: 3分〜10分
- **レポート生成**: 5秒〜30秒

### リソース使用量

- **メモリ**: 50MB〜200MB
- **CPU**: 軽微
- **ネットワーク**: ログ取得量に依存

## 🔒 セキュリティ

### データ保護

- ログデータは一時的にのみ保持
- レポートファイルはローカルに保存
- 機密情報は環境変数で管理

### アクセス制御

- Railway API Tokenの最小権限原則
- プロジェクト固有のアクセス権限
- 一時的な認証トークンの使用

## 📞 サポート

### 問題報告

問題が発生した場合は、以下を確認してください：

1. 生成されたレポートファイルの内容
2. コンソール出力のエラーメッセージ
3. 環境変数の設定状況
4. Railway CLIのバージョン

### 連絡先

- GitHub Issues: プロジェクトのIssuesページ
- Railway Support: Railway公式サポート
- 開発チーム: 内部開発チーム

## 🔄 更新履歴

- **v1.0.0**: 初回リリース
  - 基本的な診断機能
  - AI解析機能
  - レポート生成機能

- **v1.1.0**: 自動修正機能追加
  - 依存関係更新
  - 自動テスト実行
  - 自動デプロイ

- **v1.2.0**: GitHub Actions統合
  - デプロイ失敗時の自動実行
  - 環境変数の自動設定
  - エラーハンドリングの改善 