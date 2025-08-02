#!/usr/bin/env node

import { spawn } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Railway MCP Server
 * Model Context Protocol server for Railway deployment management
 */

class RailwayMCPServer {
  constructor() {
    this.railwayToken = process.env.RAILWAY_TOKEN || '';
    this.projectId = process.env.RAILWAY_PROJECT_ID || '';
    
    if (!this.railwayToken) {
      console.error('❌ RAILWAY_TOKEN environment variable is required');
      process.exit(1);
    }
  }

  /**
   * MCPサーバーの初期化
   */
  async initialize() {
    // MCPプロトコルの初期化メッセージを送信
    this.sendMessage({
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
    this.sendMessage({
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
    this.registerTools();
  }

  /**
   * ツールの登録
   */
  registerTools() {
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

    this.sendMessage({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {
        tools: tools
      }
    });

    // ツールリスト完了メッセージ
    this.sendMessage({
      jsonrpc: '2.0',
      id: 2,
      result: {
        tools: tools
      }
    });
  }

  /**
   * ツールの実行
   */
  async executeTool(name, arguments_) {
    try {
      switch (name) {
        case 'railway_deploy':
          return await this.deploy(arguments_.environment || 'production');
          
        case 'railway_logs':
          return await this.getLogs(arguments_.follow || false);
          
        case 'railway_status':
          return await this.getStatus();
          
        case 'railway_health_check':
          return await this.healthCheck();
          
        case 'railway_auto_fix':
          return await this.autoFix();
          
        case 'railway_update_env':
          return await this.updateEnvironmentVariables(arguments_.variables || {});
          
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error executing ${name}: ${error.message}`
          }
        ]
      };
    }
  }

  /**
   * デプロイメント実行
   */
  async deploy(environment = 'production') {
    try {
      const args = ['up'];
      if (environment !== 'production') {
        args.push('--environment', environment);
      }

      const result = await this.executeRailwayCommand(args);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Deployment to ${environment} initiated successfully:\n\n${result}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Deployment failed: ${error.message}`);
    }
  }

  /**
   * ログ取得
   */
  async getLogs(follow = false) {
    try {
      const args = ['logs'];
      if (follow) {
        args.push('--follow');
      }

      const result = await this.executeRailwayCommand(args);
      
      return {
        content: [
          {
            type: 'text',
            text: `📋 Railway logs:\n\n${result}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to get logs: ${error.message}`);
    }
  }

  /**
   * ステータス確認
   */
  async getStatus() {
    try {
      const result = await this.executeRailwayCommand(['status']);
      
      return {
        content: [
          {
            type: 'text',
            text: `📊 Railway deployment status:\n\n${result}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to get status: ${error.message}`);
    }
  }

  /**
   * 健全性チェック
   */
  async healthCheck() {
    try {
      const result = await this.executeRailwayCommand(['status']);
      const isHealthy = result.includes('DEPLOYED') && !result.includes('FAILED');
      
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
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }

  /**
   * 自動修復
   */
  async autoFix() {
    try {
      // 1. 環境変数の整合性チェック
      await this.checkEnvironmentVariables();
      
      // 2. デプロイメントの再試行
      await this.deploy();
      
      // 3. 健全性チェック
      const isHealthy = await this.healthCheck();
      
      return {
        content: [
          {
            type: 'text',
            text: isHealthy 
              ? '✅ Auto-fix completed successfully' 
              : '⚠️ Auto-fix completed but issues remain'
          }
        ]
      };
    } catch (error) {
      throw new Error(`Auto-fix failed: ${error.message}`);
    }
  }

  /**
   * 環境変数更新
   */
  async updateEnvironmentVariables(variables) {
    try {
      for (const [key, value] of Object.entries(variables)) {
        await this.executeRailwayCommand(['variables', 'set', key, value]);
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Environment variables updated successfully`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to update environment variables: ${error.message}`);
    }
  }

  /**
   * Railway CLIコマンド実行
   */
  async executeRailwayCommand(args) {
    return new Promise((resolve, reject) => {
      const child = spawn('railway', args, {
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
   * 環境変数の整合性チェック
   */
  async checkEnvironmentVariables() {
    const requiredVars = [
      'NOTION_API_KEY',
      'NOTION_CUSTOMER_DB_ID',
      'NOTION_HISTORY_DB_ID',
      'VITE_LIFF_ID'
    ];

    for (const varName of requiredVars) {
      try {
        await this.executeRailwayCommand(['variables', 'get', varName]);
      } catch (error) {
        console.log(`⚠️ ${varName} is missing`);
      }
    }
  }

  /**
   * MCPメッセージ送信
   */
  sendMessage(message) {
    console.log(JSON.stringify(message));
  }

  /**
   * MCPメッセージ受信処理
   */
  handleMessage(message) {
    try {
      const parsed = JSON.parse(message);
      
      if (parsed.method === 'tools/call') {
        this.executeTool(parsed.params.name, parsed.params.arguments || {})
          .then(result => {
            this.sendMessage({
              jsonrpc: '2.0',
              id: parsed.id,
              result: result
            });
          })
          .catch(error => {
            this.sendMessage({
              jsonrpc: '2.0',
              id: parsed.id,
              error: {
                code: -32603,
                message: error.message
              }
            });
          });
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }
}

// サーバーの起動
const server = new RailwayMCPServer();

// stdinからのメッセージ受信
process.stdin.on('data', (data) => {
  const message = data.toString().trim();
  if (message) {
    server.handleMessage(message);
  }
});

// 初期化
server.initialize().catch(error => {
  console.error('Failed to initialize Railway MCP server:', error);
  process.exit(1);
});

export { RailwayMCPServer }; 