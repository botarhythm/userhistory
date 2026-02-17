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
  private serviceName: string = 'userhistory';

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
    const args = ['logs', '--service', this.serviceName];
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
      const args = ['up', '--service', this.serviceName];
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
      // Use npx to ensure we use the local railway binary
      const child = spawn('npx', ['railway', ...args], {
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          RAILWAY_TOKEN: this.railwayToken // Explicitly pass token
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
          // Keep error logging for troubleshooting
          console.error(`❌ Railway CLI Error (Code ${code}):`);
          console.error(`STDOUT: ${stdout}`);
          console.error(`STDERR: ${stderr}`);
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

  // ========== MCP Server 機能 ==========

  /**
   * MCPメッセージを送信
   */
  private sendMCPMessage(message: any): void {
    console.log(JSON.stringify(message));
  }

  /**
   * MCP Serverの初期化
   */
  async initializeMCPServer(): Promise<void> {
    // MCPプロトコルの初期化メッセージを送信
    this.sendMCPMessage({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {
            listChanged: true
          }
        },
        clientInfo: {
          name: 'Cursor',
          version: '1.0.0'
        }
      }
    });

    // 初期化完了メッセージ
    this.sendMCPMessage({
      jsonrpc: '2.0',
      id: 1,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {
            listChanged: true
          }
        },
        serverInfo: {
          name: 'Railway MCP Server',
          version: '1.0.0'
        }
      }
    });

    // ツールの登録
    this.registerMCPTools();
  }

  /**
   * MCPツールを登録
   */
  private registerMCPTools(): void {
    const tools = [
      {
        name: 'railway_deploy',
        description: 'Deploy application to Railway',
        inputSchema: {
          type: 'object',
          properties: {
            environment: {
              type: 'string',
              enum: ['production', 'staging'],
              default: 'production'
            }
          }
        }
      },
      {
        name: 'railway_logs',
        description: 'Get Railway deployment logs',
        inputSchema: {
          type: 'object',
          properties: {
            follow: {
              type: 'boolean',
              default: false
            }
          }
        }
      },
      {
        name: 'railway_status',
        description: 'Check Railway deployment status',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'railway_health_check',
        description: 'Perform health check on Railway deployment',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'railway_auto_fix',
        description: 'Automatically fix Railway deployment issues',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'railway_update_env',
        description: 'Update Railway environment variables',
        inputSchema: {
          type: 'object',
          properties: {
            variables: {
              type: 'object',
              description: 'Environment variables to update'
            }
          }
        }
      }
    ];

    this.sendMCPMessage({
      jsonrpc: '2.0',
      id: 2,
      result: {
        tools: tools
      }
    });
  }

  /**
   * MCPツールを実行
   */
  async executeMCPTool(name: string, args: any = {}): Promise<any> {
    try {
      switch (name) {
        case 'railway_deploy':
          await this.deploy(args.environment || 'production');
          return {
            content: [
              {
                type: 'text',
                text: `✅ Deployment to ${args.environment || 'production'} initiated successfully`
              }
            ]
          };

        case 'railway_logs':
          await this.getLogs(args.follow || false);
          return {
            content: [
              {
                type: 'text',
                text: '📋 Railway logs retrieved successfully'
              }
            ]
          };

        case 'railway_status':
          await this.monitorDeployment();
          return {
            content: [
              {
                type: 'text',
                text: '📊 Railway deployment status retrieved'
              }
            ]
          };

        case 'railway_health_check':
          const isHealthy = await this.healthCheck();
          return {
            content: [
              {
                type: 'text',
                text: isHealthy
                  ? '✅ Railway deployment is healthy'
                  : '⚠️ Railway deployment has issues'
              }
            ]
          };

        case 'railway_auto_fix':
          await this.autoFix();
          return {
            content: [
              {
                type: 'text',
                text: '✅ Auto-fix completed'
              }
            ]
          };

        case 'railway_update_env':
          await this.updateEnvironmentVariables(args.variables || {});
          return {
            content: [
              {
                type: 'text',
                text: '✅ Environment variables updated successfully'
              }
            ]
          };

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }

  /**
   * MCPメッセージを処理
   */
  handleMCPMessage(message: string): void {
    try {
      const parsed = JSON.parse(message);

      if (parsed.method === 'tools/call') {
        this.executeMCPTool(parsed.params.name, parsed.params.arguments || {})
          .then(result => {
            this.sendMCPMessage({
              jsonrpc: '2.0',
              id: parsed.id,
              result: result
            });
          })
          .catch(error => {
            this.sendMCPMessage({
              jsonrpc: '2.0',
              id: parsed.id,
              error: {
                code: -32603,
                message: error instanceof Error ? error.message : String(error)
              }
            });
          });
      }
    } catch (error) {
      console.error('Error handling MCP message:', error);
    }
  }
}

// CLI インターフェース
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const manager = new RailwayMCPManager();

  // MCP Serverモードで起動
  if (command === 'mcp-server') {
    await manager.initializeMCPServer();

    // stdinからのメッセージ受信
    process.stdin.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        manager.handleMCPMessage(message);
      }
    });

    return;
  }

  // 通常のCLIモード
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

MCP Server Mode:
  node dist/scripts/railway-mcp.js mcp-server
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
