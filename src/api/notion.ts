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
  public client: Client;
  public customerDatabaseId: string;
  public historyDatabaseId: string;

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

  // データベース構造を取得
  async getDatabaseStructure(databaseId: string) {
    try {
      const response = await this.client.databases.retrieve({
        database_id: databaseId
      });
      return {
        id: response.id,
        title: (response as any).title || 'No title',
        properties: response.properties
      };
    } catch (error) {
      console.error('Database structure fetch error:', error);
      return null;
    }
  }

  // プロパティ名を動的に取得
  private getPropertyName(properties: any, type: string): string | null {
    for (const [name, prop] of Object.entries(properties)) {
      if ((prop as any).type === type) {
        return name;
      }
    }
    return null;
  }

  // 顧客の検索・作成
  async findOrCreateCustomer(lineUid: string, displayName: string): Promise<string> {
    try {
      // 既存顧客を検索
      const existingCustomer = await this.findCustomerByLineUid(lineUid);
      if (existingCustomer) {
        return existingCustomer.id;
      }

      // データベース構造を取得してプロパティ名を動的に決定
      const dbStructure = await this.getDatabaseStructure(this.customerDatabaseId);
      if (!dbStructure) {
        throw new Error('Failed to get database structure');
      }

      const lineUidProperty = this.getPropertyName(dbStructure.properties, 'title') || 'LINE UID';
      const displayNameProperty = this.getPropertyName(dbStructure.properties, 'rich_text') || '表示名';
      const dateProperty = this.getPropertyName(dbStructure.properties, 'date') || '登録日';

      // 新規顧客を作成
      const response = await this.client.pages.create({
        parent: { database_id: this.customerDatabaseId },
        properties: {
          [lineUidProperty]: {
            title: [{ text: { content: lineUid } }]
          },
          [displayNameProperty]: {
            rich_text: [{ text: { content: displayName } }]
          },
          [dateProperty]: {
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
      // データベース構造を取得してプロパティ名を動的に決定
      const dbStructure = await this.getDatabaseStructure(this.customerDatabaseId);
      if (!dbStructure) {
        return null;
      }

      const lineUidProperty = this.getPropertyName(dbStructure.properties, 'title') || 'LINE UID';
      const displayNameProperty = this.getPropertyName(dbStructure.properties, 'rich_text') || '表示名';
      const dateProperty = this.getPropertyName(dbStructure.properties, 'date') || '登録日';

      const response = await this.client.databases.query({
        database_id: this.customerDatabaseId,
        filter: {
          property: lineUidProperty,
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
        lineUid: this.getPropertyValue(page, lineUidProperty, 'title'),
        displayName: this.getPropertyValue(page, displayNameProperty, 'rich_text'),
        createdAt: this.getPropertyValue(page, dateProperty, 'date')
      };
    } catch (error) {
      console.error('Customer search error:', error);
      return null;
    }
  }

  // 来店履歴を記録
  async recordCheckin(customerId: string, timestamp?: string): Promise<string> {
    try {
      // データベース構造を取得してプロパティ名を動的に決定
      const dbStructure = await this.getDatabaseStructure(this.historyDatabaseId);
      if (!dbStructure) {
        throw new Error('Failed to get database structure');
      }

      const relationProperty = this.getPropertyName(dbStructure.properties, 'relation') || '関連顧客';
      const typeProperty = this.getPropertyName(dbStructure.properties, 'select') || 'タイプ';
      const dateProperty = this.getPropertyName(dbStructure.properties, 'date') || '日時';

      const response = await this.client.pages.create({
        parent: { database_id: this.historyDatabaseId },
        properties: {
          [relationProperty]: {
            relation: [{ id: customerId }]
          },
          [typeProperty]: {
            select: { name: '来店' }
          },
          [dateProperty]: {
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
      // データベース構造を取得してプロパティ名を動的に決定
      const dbStructure = await this.getDatabaseStructure(this.historyDatabaseId);
      if (!dbStructure) {
        throw new Error('Failed to get database structure');
      }

      const relationProperty = this.getPropertyName(dbStructure.properties, 'relation') || '関連顧客';
      const typeProperty = this.getPropertyName(dbStructure.properties, 'select') || 'タイプ';
      const dateProperty = this.getPropertyName(dbStructure.properties, 'date') || '日時';
      const itemProperty = this.getPropertyName(dbStructure.properties, 'rich_text') || '商品名';
      const quantityProperty = this.getPropertyName(dbStructure.properties, 'number') || '数量';
      const totalProperty = this.getPropertyName(dbStructure.properties, 'number') || '合計金額';
      const memoProperty = this.getPropertyName(dbStructure.properties, 'rich_text') || 'メモ';

      const response = await this.client.pages.create({
        parent: { database_id: this.historyDatabaseId },
        properties: {
          [relationProperty]: {
            relation: [{ id: customerId }]
          },
          [typeProperty]: {
            select: { name: '購入' }
          },
          [dateProperty]: {
            date: { start: timestamp || new Date().toISOString() }
          },
          [itemProperty]: {
            rich_text: [{ text: { content: items.map(item => `${item.name} x${item.quantity}`).join(', ') } }]
          },
          [quantityProperty]: {
            number: items.reduce((sum, item) => sum + item.quantity, 0)
          },
          [totalProperty]: {
            number: total
          },
          [memoProperty]: {
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
      // データベース構造を取得してプロパティ名を動的に決定
      const dbStructure = await this.getDatabaseStructure(this.historyDatabaseId);
      if (!dbStructure) {
        return [];
      }

      const relationProperty = this.getPropertyName(dbStructure.properties, 'relation') || '関連顧客';
      const typeProperty = this.getPropertyName(dbStructure.properties, 'select') || 'タイプ';
      const dateProperty = this.getPropertyName(dbStructure.properties, 'date') || '日時';
      const itemProperty = this.getPropertyName(dbStructure.properties, 'rich_text') || '商品名';
      const totalProperty = this.getPropertyName(dbStructure.properties, 'number') || '合計金額';
      const memoProperty = this.getPropertyName(dbStructure.properties, 'rich_text') || 'メモ';

      const filter: any = {
        property: relationProperty,
        relation: {
          contains: customerId
        }
      };

      if (type) {
        filter.and = [
          {
            property: typeProperty,
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
            property: dateProperty,
            direction: 'descending'
          }
        ],
        page_size: limit
      });

      return response.results.map(page => ({
        id: page.id,
        customerId,
        type: this.getPropertyValue(page, typeProperty, 'select') === '来店' ? 'checkin' : 'purchase',
        timestamp: this.getPropertyValue(page, dateProperty, 'date'),
        items: this.parseItems(this.getPropertyValue(page, itemProperty, 'rich_text')),
        total: this.getPropertyValue(page, totalProperty, 'number'),
        memo: this.getPropertyValue(page, memoProperty, 'rich_text')
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
