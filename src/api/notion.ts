import { Client } from '@notionhq/client';

export interface Customer {
  id: string;
  lineUid: string;
  displayName: string;
  createdAt: string;
}

export interface HistoryRecord {
  id: string;
  customerId: string;
  type: 'checkin' | 'purchase';
  timestamp: string;
  items?: Array<{
    name: string;
    quantity: number;
    price?: number;
  }>;
  total?: number;
  memo?: string;
}

export class NotionAPI {
  private client: Client;
  private customerDatabaseId: string;
  private historyDatabaseId: string;

  constructor() {
    const apiKey = process.env['NOTION_API_KEY'];
    if (!apiKey) {
      throw new Error('NOTION_API_KEY environment variable is required');
    }

    this.client = new Client({
      auth: apiKey,
    });
    this.customerDatabaseId = process.env['NOTION_CUSTOMER_DATABASE_ID'] || '';
    this.historyDatabaseId = process.env['NOTION_DATABASE_ID'] || '';
  }

  // 顧客の検索・作成
  async findOrCreateCustomer(lineUid: string, displayName: string): Promise<string> {
    try {
      // 既存顧客を検索
      const existingCustomer = await this.findCustomerByLineUid(lineUid);
      if (existingCustomer) {
        return existingCustomer.id;
      }

      // 新規顧客を作成
      const response = await this.client.pages.create({
        parent: { database_id: this.customerDatabaseId },
        properties: {
          'LINE UID': {
            title: [{ text: { content: lineUid } }]
          },
          '表示名': {
            rich_text: [{ text: { content: displayName } }]
          },
          '登録日': {
            date: { start: new Date().toISOString() }
          }
        }
      });

      return response.id;
    } catch (error) {
      console.error('Customer creation error:', error);
      throw new Error('Failed to create customer');
    }
  }

  // LINE UIDで顧客を検索
  async findCustomerByLineUid(lineUid: string): Promise<Customer | null> {
    try {
      const response = await this.client.databases.query({
        database_id: this.customerDatabaseId,
        filter: {
          property: 'LINE UID',
          title: {
            equals: lineUid
          }
        }
      });

      if (response.results.length === 0) {
        return null;
      }

      const page = response.results[0];
      if (!page) {
        return null;
      }

      return {
        id: page.id,
        lineUid: this.getPropertyValue(page, 'LINE UID', 'title'),
        displayName: this.getPropertyValue(page, '表示名', 'rich_text'),
        createdAt: this.getPropertyValue(page, '登録日', 'date')
      };
    } catch (error) {
      console.error('Customer search error:', error);
      return null;
    }
  }

  // 来店履歴を記録
  async recordCheckin(customerId: string, timestamp?: string): Promise<string> {
    try {
      const response = await this.client.pages.create({
        parent: { database_id: this.historyDatabaseId },
        properties: {
          '関連顧客': {
            relation: [{ id: customerId }]
          },
          'タイプ': {
            select: { name: '来店' }
          },
          '日時': {
            date: { start: timestamp || new Date().toISOString() }
          }
        }
      });

      return response.id;
    } catch (error) {
      console.error('Check-in recording error:', error);
      throw new Error('Failed to record check-in');
    }
  }

  // 購入履歴を記録
  async recordPurchase(
    customerId: string, 
    items: Array<{ name: string; quantity: number; price?: number }>,
    total: number,
    memo?: string,
    timestamp?: string
  ): Promise<string> {
    try {
      const response = await this.client.pages.create({
        parent: { database_id: this.historyDatabaseId },
        properties: {
          '関連顧客': {
            relation: [{ id: customerId }]
          },
          'タイプ': {
            select: { name: '購入' }
          },
          '日時': {
            date: { start: timestamp || new Date().toISOString() }
          },
          '商品名': {
            rich_text: [{ text: { content: items.map(item => `${item.name} x${item.quantity}`).join(', ') } }]
          },
          '数量': {
            number: items.reduce((sum, item) => sum + item.quantity, 0)
          },
          '合計金額': {
            number: total
          },
          'メモ': {
            rich_text: memo ? [{ text: { content: memo } }] : []
          }
        }
      });

      return response.id;
    } catch (error) {
      console.error('Purchase recording error:', error);
      throw new Error('Failed to record purchase');
    }
  }

  // 履歴を取得
  async getHistory(customerId: string, type?: 'checkin' | 'purchase', limit: number = 10): Promise<HistoryRecord[]> {
    try {
      const filter: any = {
        property: '関連顧客',
        relation: {
          contains: customerId
        }
      };

      if (type) {
        filter.and = [
          {
            property: 'タイプ',
            select: {
              equals: type === 'checkin' ? '来店' : '購入'
            }
          }
        ];
      }

      const response = await this.client.databases.query({
        database_id: this.historyDatabaseId,
        filter,
        sorts: [
          {
            property: '日時',
            direction: 'descending'
          }
        ],
        page_size: limit
      });

      return response.results.map(page => ({
        id: page.id,
        customerId,
        type: this.getPropertyValue(page, 'タイプ', 'select') === '来店' ? 'checkin' : 'purchase',
        timestamp: this.getPropertyValue(page, '日時', 'date'),
        items: this.parseItems(this.getPropertyValue(page, '商品名', 'rich_text')),
        total: this.getPropertyValue(page, '合計金額', 'number'),
        memo: this.getPropertyValue(page, 'メモ', 'rich_text')
      }));
    } catch (error) {
      console.error('History fetch error:', error);
      return [];
    }
  }

  // プロパティ値の取得（ヘルパー関数）
  private getPropertyValue(page: any, propertyName: string, type: string): any {
    const property = page.properties[propertyName];
    if (!property) return null;

    switch (type) {
      case 'title':
        return property.title?.[0]?.text?.content || '';
      case 'rich_text':
        return property.rich_text?.[0]?.text?.content || '';
      case 'number':
        return property.number || 0;
      case 'date':
        return property.date?.start || '';
      case 'select':
        return property.select?.name || '';
      default:
        return null;
    }
  }

  // 商品リストの解析（ヘルパー関数）
  private parseItems(itemsString: string): Array<{ name: string; quantity: number; price?: number }> {
    if (!itemsString) return [];
    
    return itemsString.split(', ').map(item => {
      const match = item.match(/(.+) x(\d+)/);
      if (match && match[1] && match[2]) {
        return {
          name: match[1],
          quantity: parseInt(match[2])
        };
      }
      return { name: item, quantity: 1 };
    });
  }
}
