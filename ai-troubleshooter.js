#!/usr/bin/env node

/**
 * AI Railway 自動トラブルシューティングシステム
 * 使用方法: 
 *   node ai-troubleshooter.js          # 診断のみ
 *   node ai-troubleshooter.js --auto-fix # 診断 + 自動修正
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// コマンドライン引数解析
const args = process.argv.slice(2);
const autoFix = args.includes('--auto-fix');

// 色付きログ出力
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'blue') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// ユーザー入力取得
function askQuestion(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

// 環境変数チェック
function checkEnvironmentVariables() {
    log('🔍 環境変数チェック中...', 'blue');
    
    const requiredVars = ['RAILWAY_TOKEN', 'RAILWAY_PROJECT_ID'];
    const missing = [];
    
    for (const varName of requiredVars) {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    }
    
    if (missing.length > 0) {
        log(`❌ 不足している環境変数: ${missing.join(', ')}`, 'red');
        log('💡 環境変数を設定してください:', 'yellow');
        log('   export RAILWAY_TOKEN="your-token"', 'yellow');
        log('   export RAILWAY_PROJECT_ID="your-project-id"', 'yellow');
        return false;
    }
    
    log('✅ 環境変数チェック完了', 'green');
    return true;
}

// Railway CLIインストール確認
function checkRailwayCLI() {
    log('📦 Railway CLI確認中...', 'blue');
    
    try {
        execSync('railway --version', { stdio: 'pipe' });
        log('✅ Railway CLI確認完了', 'green');
        return true;
    } catch (error) {
        log('⚠️ Railway CLIがインストールされていません。インストール中...', 'yellow');
        try {
            execSync('npm install -g @railway/cli', { stdio: 'inherit' });
            log('✅ Railway CLIインストール完了', 'green');
            return true;
        } catch (installError) {
            log('❌ Railway CLIインストール失敗', 'red');
            log('💡 手動でインストールしてください: npm install -g @railway/cli', 'yellow');
            return false;
        }
    }
}

// Railway認証
function authenticateRailway() {
    log('🔐 Railway認証中...', 'blue');
    
    try {
        execSync(`railway login --token ${process.env.RAILWAY_TOKEN}`, { stdio: 'pipe' });
        log('✅ Railway認証成功', 'green');
        return true;
    } catch (error) {
        log('❌ Railway認証失敗', 'red');
        log('💡 RAILWAY_TOKENが正しいか確認してください', 'yellow');
        return false;
    }
}

// プロジェクト状態確認
function checkProjectStatus() {
    log('📋 プロジェクト状態確認中...', 'blue');
    
    try {
        const status = execSync(`railway status --project ${process.env.RAILWAY_PROJECT_ID}`, { encoding: 'utf8' });
        log('✅ プロジェクト状態確認完了', 'green');
        return status;
    } catch (error) {
        log('❌ プロジェクト状態確認失敗', 'red');
        log('💡 RAILWAY_PROJECT_IDが正しいか確認してください', 'yellow');
        return null;
    }
}

// 最新ログ取得
function getRecentLogs(limit = 100) {
    log('📊 最新ログ取得中...', 'blue');
    
    try {
        const logs = execSync(`railway logs --project ${process.env.RAILWAY_PROJECT_ID} --limit ${limit}`, { encoding: 'utf8' });
        log('✅ ログ取得完了', 'green');
        return logs;
    } catch (error) {
        log('❌ ログ取得失敗', 'red');
        return null;
    }
}

// 環境変数確認
function checkRailwayVariables() {
    log('🔧 Railway環境変数確認中...', 'blue');
    
    try {
        const variables = execSync(`railway variables --project ${process.env.RAILWAY_PROJECT_ID}`, { encoding: 'utf8' });
        log('✅ 環境変数確認完了', 'green');
        return variables;
    } catch (error) {
        log('❌ 環境変数確認失敗', 'red');
        return null;
    }
}

// AIによるログ解析
function analyzeLogsWithAI(logs) {
    log('🤖 AIによるログ解析中...', 'blue');
    
    const analysisPrompt = `
以下のRailwayログを分析し、問題の原因と修正手順を日本語で提示してください：

1. エラーの種類と原因
2. 影響範囲
3. 修正手順（具体的なコマンドを含む）
4. 再発防止策

ログ内容：
${logs}

分析結果：
`;

    try {
        // Gemini CLIを使用してログ解析
        const analysis = execSync(`echo "${analysisPrompt}" | gemini chat`, { encoding: 'utf8' });
        log('✅ AI解析完了', 'green');
        return analysis;
    } catch (error) {
        log('⚠️ Gemini CLIが利用できません。手動解析が必要です。', 'yellow');
        log('💡 Gemini CLIをインストールしてください: npm install -g @google/generative-ai', 'yellow');
        return null;
    }
}

// 自動修正実行
async function runAutoFix() {
    log('🛠️ 自動修正実行中...', 'blue');
    
    try {
        // 1. 依存関係更新
        log('📦 依存関係更新中...', 'blue');
        execSync('npm ci', { stdio: 'inherit' });
        
        // 2. テスト実行
        log('🧪 テスト実行中...', 'blue');
        execSync('npm test', { stdio: 'inherit' });
        
        // 3. ビルド実行
        log('🔨 ビルド実行中...', 'blue');
        execSync('npm run build', { stdio: 'inherit' });
        
        // 4. Railwayデプロイ
        log('🚀 Railwayデプロイ実行中...', 'blue');
        execSync(`railway up --project ${process.env.RAILWAY_PROJECT_ID} --detach`, { stdio: 'inherit' });
        
        log('✅ 自動修正完了', 'green');
        return true;
    } catch (error) {
        log('❌ 自動修正失敗', 'red');
        log(`💡 エラー詳細: ${error.message}`, 'yellow');
        return false;
    }
}

// レポート生成
function generateReport(analysis, logs, status, variables) {
    log('📝 レポート生成中...', 'blue');
    
    const timestamp = new Date().toISOString();
    const report = `
# Railway 自動トラブルシューティングレポート

**生成日時**: ${timestamp}
**プロジェクトID**: ${process.env.RAILWAY_PROJECT_ID}

## 🔍 診断結果

### AI解析結果
${analysis || 'AI解析が利用できませんでした。'}

### プロジェクト状態
\`\`\`
${status || '状態確認失敗'}
\`\`\`

### 環境変数
\`\`\`
${variables || '環境変数確認失敗'}
\`\`\`

### 最新ログ
\`\`\`
${logs || 'ログ取得失敗'}
\`\`\`

## 🛠️ 推奨アクション

1. 上記のAI解析結果に従って修正を実行
2. 必要に応じて手動での確認・修正
3. 修正後の再デプロイテスト

## 📞 サポート

問題が解決しない場合は：
- GitHub Actionsログの詳細確認
- Railwayダッシュボードでの直接確認
- Railwayサポートへの問い合わせ
`;

    const reportPath = join(__dirname, `troubleshooting-report-${timestamp.split('T')[0]}.md`);
    writeFileSync(reportPath, report);
    
    log(`✅ レポート生成完了: ${reportPath}`, 'green');
    return reportPath;
}

// メイン処理
async function main() {
    log('🚀 AI Railway 自動トラブルシューティング開始...', 'blue');
    
    // 1. 環境変数チェック
    if (!checkEnvironmentVariables()) {
        process.exit(1);
    }
    
    // 2. Railway CLI確認
    if (!checkRailwayCLI()) {
        process.exit(1);
    }
    
    // 3. Railway認証
    if (!authenticateRailway()) {
        process.exit(1);
    }
    
    // 4. プロジェクト状態確認
    const status = checkProjectStatus();
    
    // 5. 環境変数確認
    const variables = checkRailwayVariables();
    
    // 6. 最新ログ取得
    const logs = getRecentLogs();
    
    // 7. AIによるログ解析
    const analysis = logs ? analyzeLogsWithAI(logs) : null;
    
    // 8. レポート生成
    const reportPath = generateReport(analysis, logs, status, variables);
    
    // 9. 自動修正実行（オプション）
    if (autoFix) {
        log('🤔 自動修正を実行しますか？ (y/N)', 'yellow');
        const answer = await askQuestion('自動修正を実行しますか？ (y/N): ');
        
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            const success = await runAutoFix();
            if (success) {
                log('🎉 自動修正が正常に完了しました！', 'green');
            } else {
                log('⚠️ 自動修正に失敗しました。手動での確認が必要です。', 'yellow');
            }
        } else {
            log('ℹ️ 自動修正をスキップしました。', 'blue');
        }
    }
    
    log('🎉 自動トラブルシューティング完了！', 'green');
    log(`📄 レポート: ${reportPath}`, 'blue');
}

// スクリプト実行
main().catch(error => {
    log(`❌ エラーが発生しました: ${error.message}`, 'red');
    process.exit(1);
}); 