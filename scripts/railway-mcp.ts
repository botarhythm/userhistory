#!/usr/bin/env node

import { spawn } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

interface RailwayDeployment {
  id: string;
  status: 'BUILDING' | 'DEPLOYED' | 'FAILED';
  createdAt: string;
  environment: string;
}

interface RailwayService {
  id: string;
  name: string;
  status: 'DEPLOYED' | 'FAILED' | 'BUILDING';
  url?: string;
}

class RailwayMCPManager {
  private railwayToken: string;
  private projectId: string;

  constructor() {
    this.railwayToken = process.env['RAILWAY_TOKEN'] || '';
    this.projectId = process.env['RAILWAY_PROJECT_ID'] || '';

    if (!this.railwayToken) {
      console.error('❌ RAILWAY_TOKEN environment variable is required');
      process.exit(1);
    }
  }

  /**
   * デプロイメントの状態を監視
   */
  async monitorDeployment(): Promise<void> {
    console.log('🚂 Railway deployment monitoring started...');

    try {
      const result = await this.executeRailwayCommand(['status']);
      console.log('📊 Current deployment status:');
      console.log(result);
    } catch (error) {
      console.error('❌ Failed to get deployment status:', error);
    }
  }

  /**
   * ログを取得
   */
  async getLogs(follow: boolean = false): Promise<void> {
    const args = ['logs'];
    if (follow) {
      args.push('--follow');
    }

    try {
      const result = await this.executeRailwayCommand(args);
      console.log('📋 Railway logs:');
      console.log(result);
    } catch (error) {
      console.error('❌ Failed to get logs:', error);
    }
  }

  /**
   * 新しいデプロイメントを開始
   */
  async deploy(environment: string = 'production'): Promise<void> {
    console.log(`🚀 Starting deployment to ${environment}...`);

    try {
      const args = ['up'];
      if (environment !== 'production') {
        args.push('--environment', environment);
      }

      const result = await this.executeRailwayCommand(args);
      console.log('✅ Deployment initiated successfully:');
      console.log(result);
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      throw error;
    }
  }

  /**
   * 環境変数を更新
   */
  async updateEnvironmentVariables(variables: Record<string, string>): Promise<void> {
    console.log('🔧 Updating environment variables...');

    try {
      for (const [key, value] of Object.entries(variables)) {
        await this.executeRailwayCommand(['variables', '--set', `${key}=${value}`]);
        console.log(`✅ Set ${key}=${value}`);
      }
    } catch (error) {
      console.error('❌ Failed to update environment variables:', error);
      throw error;
    }
  }

  /**
   * Railway CLIコマンドを実行
   */
  private executeRailwayCommand(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn('railway', args, {
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          RAILWAY_TOKEN: this.railwayToken
        }
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Railway command failed with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * デプロイメントの健全性チェック
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.executeRailwayCommand(['status']);
      const isHealthy = result.includes('DEPLOYED') && !result.includes('FAILED');

      if (isHealthy) {
        console.log('✅ Railway deployment is healthy');
      } else {
        console.log('⚠️ Railway deployment has issues');
      }

      return isHealthy;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }

  /**
   * 自動修復を実行
   */
  async autoFix(): Promise<void> {
    console.log('🔧 Attempting auto-fix...');

    try {
      // 1. 環境変数の整合性チェック
      await this.checkEnvironmentVariables();

      // 2. デプロイメントの再試行
      await this.deploy();

      // 3. 健全性チェック
      const isHealthy = await this.healthCheck();

      if (isHealthy) {
        console.log('✅ Auto-fix completed successfully');
      } else {
        console.log('⚠️ Auto-fix completed but issues remain');
      }
    } catch (error) {
      console.error('❌ Auto-fix failed:', error);
      throw error;
    }
  }

  /**
   * 環境変数の整合性をチェック
   */
  private async checkEnvironmentVariables(): Promise<void> {
    const requiredVars = [
      'NOTION_API_KEY',
      'NOTION_CUSTOMER_DB_ID',
      'NOTION_HISTORY_DB_ID',
      'VITE_LIFF_ID'
    ];

    console.log('🔍 Checking environment variables...');

    for (const varName of requiredVars) {
      try {
        await this.executeRailwayCommand(['variables', 'get', varName]);
        console.log(`✅ ${varName} is set`);
      } catch (error) {
        console.log(`⚠️ ${varName} is missing`);
      }
    }
  }
}

// CLI インターフェース
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const manager = new RailwayMCPManager();

  try {
    switch (command) {
      case 'deploy':
        const environment = args[1] || 'production';
        await manager.deploy(environment);
        break;

      case 'logs':
        const follow = args.includes('--follow');
        await manager.getLogs(follow);
        break;

      case 'status':
        await manager.monitorDeployment();
        break;

      case 'health':
        await manager.healthCheck();
        break;

      case 'autofix':
        await manager.autoFix();
        break;

      case 'update-env':
        const envFile = args[1] || '.env';
        const envContent = readFileSync(envFile, 'utf-8');
        const envVars: Record<string, string> = {};

        envContent.split('\n').forEach(line => {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            envVars[key.trim()] = valueParts.join('=').trim();
          }
        });

        await manager.updateEnvironmentVariables(envVars);
        break;

      default:
        console.log(`
🚂 Railway MCP Manager

Usage:
  npm run railway:deploy [environment]    - Deploy to Railway
  npm run railway:logs [--follow]         - Get deployment logs
  npm run railway:status                  - Check deployment status
  npm run railway:health                  - Health check
  npm run railway:autofix                 - Auto-fix deployment issues
  npm run railway:update-env [env-file]   - Update environment variables
        `);
    }
  } catch (error) {
    console.error('❌ Command failed:', error);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export { RailwayMCPManager };