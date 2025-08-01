#!/bin/bash

# Railway デプロイ失敗時の自動修正スクリプト
# 使用方法: ./auto-fix-deployment.sh

set -e  # エラー時に停止

# 色付きログ出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 環境変数チェック
check_env_vars() {
    log_info "環境変数チェック中..."
    
    if [ -z "$RAILWAY_TOKEN" ]; then
        log_error "RAILWAY_TOKENが設定されていません"
        exit 1
    fi
    
    if [ -z "$RAILWAY_PROJECT_ID" ]; then
        log_error "RAILWAY_PROJECT_IDが設定されていません"
        exit 1
    fi
    
    log_success "環境変数チェック完了"
}

# Railway CLIインストール
install_railway_cli() {
    log_info "Railway CLIインストール中..."
    
    if ! command -v railway &> /dev/null; then
        npm install -g @railway/cli
        log_success "Railway CLIインストール完了"
    else
        log_info "Railway CLIは既にインストール済み"
    fi
}

# Railway認証
authenticate_railway() {
    log_info "Railway認証中..."
    
    railway login --token $RAILWAY_TOKEN
    
    if [ $? -eq 0 ]; then
        log_success "Railway認証成功"
    else
        log_error "Railway認証失敗"
        exit 1
    fi
}

# プロジェクト状態確認
check_project_status() {
    log_info "プロジェクト状態確認中..."
    
    railway status --project $RAILWAY_PROJECT_ID
    
    if [ $? -eq 0 ]; then
        log_success "プロジェクト状態確認完了"
    else
        log_error "プロジェクト状態確認失敗"
        exit 1
    fi
}

# 環境変数確認
check_railway_variables() {
    log_info "Railway環境変数確認中..."
    
    railway variables --project $RAILWAY_PROJECT_ID
    
    log_success "環境変数確認完了"
}

# 最新ログ取得
get_recent_logs() {
    log_info "最新ログ取得中..."
    
    railway logs --project $RAILWAY_PROJECT_ID --limit 50
    
    log_success "ログ取得完了"
}

# 自動修正実行
run_auto_fix() {
    log_info "自動修正実行中..."
    
    # 1. 依存関係更新
    log_info "依存関係更新中..."
    npm ci
    
    # 2. テスト実行
    log_info "テスト実行中..."
    npm test
    
    # 3. ビルド実行
    log_info "ビルド実行中..."
    npm run build
    
    # 4. Railwayデプロイ
    log_info "Railwayデプロイ実行中..."
    railway up --project $RAILWAY_PROJECT_ID --detach
    
    log_success "自動修正完了"
}

# デプロイ状態確認
check_deployment_status() {
    log_info "デプロイ状態確認中..."
    
    sleep 10  # デプロイ完了まで待機
    
    railway status --project $RAILWAY_PROJECT_ID
    
    log_success "デプロイ状態確認完了"
}

# メイン処理
main() {
    log_info "🚀 Railway デプロイ失敗時の自動修正を開始..."
    
    check_env_vars
    install_railway_cli
    authenticate_railway
    check_project_status
    check_railway_variables
    get_recent_logs
    run_auto_fix
    check_deployment_status
    
    log_success "🎉 自動修正処理が完了しました！"
}

# スクリプト実行
main "$@" 