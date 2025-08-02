import { Client } from '@notionhq/client';

export interface Customer {
  id: string;
  lineUid: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  price?: number;
  category?: string;
  description?: string;
  order?: number;
  available?: boolean;
}

export interface HistoryRecord {
  id: string;
  customerId: string;
  type: 'checkin' | 'purchase';
  timestamp: string;
  items: Array<{
    name: string;
    quantity: number;
    price?: number;
  }> | undefined;
  total?: number | undefined;
  memo?: string;
}

export class NotionAPI {
  public client: Client;
  public customerDatabaseId: string;
  public historyDatabaseId: string;
  public productDatabaseId: string;

  constructor() {
    const apiKey = process.env['NOTION_API_KEY'];
    if (!apiKey) {
      throw new Error('NOTION_API_KEY environment variable is required');
    }

    this.client = new Client({
      auth: apiKey,
    });
    this.customerDatabaseId = process.env['NOTION_CUSTOMER_DB_ID'] || '';
    this.historyDatabaseId = process.env['NOTION_HISTORY_DB_ID'] || '';
    this.productDatabaseId = process.env['NOTION_PRODUCT_DB_ID'] || '';
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
    const candidates: string[] = [];
    
    for (const [name, prop] of Object.entries(properties)) {
      if ((prop as any).type === type) {
        candidates.push(name);
      }
    }
    
    // デバッグ用にログ出力
    if (candidates.length === 0) {
      console.warn(`No properties found for type: ${type}`);
      console.warn('Available properties:', Object.keys(properties));
      console.warn('Property types:', Object.entries(properties).map(([name, prop]) => ({ name, type: (prop as any).type })));
    } else if (candidates.length > 1) {
      console.warn(`Multiple properties found for type ${type}:`, candidates);
    }
    
    return candidates[0] || null;
  }

  // 商品一覧を取得
  async getProducts(): Promise<Product[]> {
    try {
      if (!this.productDatabaseId) {
        console.warn('Product database ID not configured');
        return [];
      }

      const dbStructure = await this.getDatabaseStructure(this.productDatabaseId);
      if (!dbStructure) {
        throw new Error('Failed to get product database structure');
      }

      const nameProperty = this.getPropertyName(dbStructure.properties, 'title') || '商品名';
      const orderProperty = this.getPropertyName(dbStructure.properties, 'number') || '表示順';
      const availableProperty = this.getPropertyName(dbStructure.properties, 'checkbox') || '販売中';

      const response = await this.client.databases.query({
        database_id: this.productDatabaseId,
        filter: {
          property: availableProperty,
          checkbox: {
            equals: true
          }
        },
        sorts: [
          {
            property: orderProperty,
            direction: 'ascending'
          }
        ]
      });

      return response.results.map((page: any) => ({
        id: page.id,
        name: this.getPropertyValue(page, nameProperty, 'title') || '',
        price: 0, // 価格は現在のDBには含まれていないため0を設定
        category: '', // カテゴリは現在のDBには含まれていないため空文字を設定
        description: '', // 説明は現在のDBには含まれていないため空文字を設定
        order: this.getPropertyValue(page, orderProperty, 'number') || 0,
        available: this.getPropertyValue(page, availableProperty, 'checkbox') || false
      }));
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return [];
    }
  }

  // 商品を検索
  async searchProducts(query: string): Promise<Product[]> {
    try {
      if (!this.productDatabaseId) {
        return [];
      }

      const allProducts = await this.getProducts();
      const lowerQuery = query.toLowerCase();
      
      return allProducts.filter(product => 
        product.name.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Failed to search products:', error);
      return [];
    }
  }

  // 顧客の検索・作成
  async findOrCreateCustomer(lineUid: string, displayName: string): Promise<string> {
    try {
      // 既存顧客を検索
      const existingCustomer = await this.findCustomerByLineUid(lineUid);
      if (existingCustomer) {
        // 既存顧客の表示名を更新
        await this.updateCustomerDisplayName(existingCustomer.id, displayName);
        return existingCustomer.id;
      }

      // データベース構造を取得してプロパティ名を動的に決定
      const dbStructure = await this.getDatabaseStructure(this.customerDatabaseId);
      if (!dbStructure) {
        throw new Error('Failed to get database structure');
      }

      const displayNameProperty = this.getPropertyName(dbStructure.properties, 'title') || '表示名';
      const lineUidProperty = this.getPropertyName(dbStructure.properties, 'rich_text') || 'LINE UID';
      const updatedAtProperty = this.getPropertyName(dbStructure.properties, 'date') || '最終更新日';

      const now = new Date().toISOString();

      // 新規顧客を作成
      const response = await this.client.pages.create({
        parent: { database_id: this.customerDatabaseId },
        properties: {
          [displayNameProperty]: {
            title: [{ text: { content: displayName } }]
          },
          [lineUidProperty]: {
            rich_text: [{ text: { content: lineUid } }]
          },
          [updatedAtProperty]: {
            date: { start: now }
          }
        }
      });

      return response.id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to create customer details:', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        lineUid,
        displayName
      });
      throw new Error(`Failed to create customer: ${errorMessage}`);
    }
  }

  // 顧客の表示名を更新
  async updateCustomerDisplayName(customerId: string, displayName: string): Promise<void> {
    try {
      // データベース構造を取得してプロパティ名を動的に決定
      const dbStructure = await this.getDatabaseStructure(this.customerDatabaseId);
      if (!dbStructure) {
        throw new Error('Failed to get database structure');
      }

      const displayNameProperty = this.getPropertyName(dbStructure.properties, 'title') || '表示名';
      const updatedAtProperty = this.getPropertyName(dbStructure.properties, 'date') || '最終更新日';

      const now = new Date().toISOString();

      // 顧客の表示名と最終更新日を更新
      await this.client.pages.update({
        page_id: customerId,
        properties: {
          [displayNameProperty]: {
            title: [{ text: { content: displayName } }]
          },
          [updatedAtProperty]: {
            date: { start: now }
          }
        }
      });
    } catch (error) {
      console.error('Failed to update customer display name:', error);
      // エラーが発生しても処理を継続（表示名の更新は重要ではないため）
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

      const displayNameProperty = this.getPropertyName(dbStructure.properties, 'title') || '表示名';
      const lineUidProperty = this.getPropertyName(dbStructure.properties, 'rich_text') || 'LINE UID';
      const dateProperty = this.getPropertyName(dbStructure.properties, 'created_time') || '登録日';
      const updatedAtProperty = this.getPropertyName(dbStructure.properties, 'date') || '最終更新日';

      // LINE UIDで検索
      const response = await this.client.databases.query({
        database_id: this.customerDatabaseId,
        filter: {
          property: lineUidProperty,
          rich_text: {
            equals: lineUid
          }
        }
      });

      if (response.results.length === 0) {
        return null;
      }

      const page = response.results[0] as any;
      return {
        id: page.id || '',
        lineUid: this.getPropertyValue(page, lineUidProperty, 'rich_text') || '',
        displayName: this.getPropertyValue(page, displayNameProperty, 'title') || '',
        createdAt: this.getPropertyValue(page, dateProperty, 'created_time') || new Date().toISOString(),
        updatedAt: this.getPropertyValue(page, updatedAtProperty, 'date') || new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to find customer:', error);
      return null;
    }
  }

  // 来店履歴を記録
  async recordCheckin(customerId: string, timestamp?: string, memo?: string): Promise<string> {
    try {
      // データベース構造を取得してプロパティ名を動的に決定
      const dbStructure = await this.getDatabaseStructure(this.historyDatabaseId);
      if (!dbStructure) {
        throw new Error('Failed to get database structure');
      }

      const relationProperty = this.getPropertyName(dbStructure.properties, 'relation') || '関連顧客ID';
      const dateProperty = this.getPropertyName(dbStructure.properties, 'date') || '日時';
      const memoProperty = this.getPropertyName(dbStructure.properties, 'rich_text') || 'メモ';
      const titleProperty = this.getPropertyName(dbStructure.properties, 'title') || '商品名';

      const properties: any = {
        [relationProperty]: {
          relation: [{ id: customerId }]
        },
        [dateProperty]: {
          date: { start: timestamp || new Date().toISOString() }
        },
        [titleProperty]: {
          title: [{ text: { content: '来店' } }]
        }
      };

      // メモがある場合のみ追加
      if (memo && memo.trim()) {
        properties[memoProperty] = {
          rich_text: [{ text: { content: memo.trim() } }]
        };
      }

      const response = await this.client.pages.create({
        parent: { database_id: this.historyDatabaseId },
        properties
      });

      // 顧客の最終更新日も更新
      try {
        const customerDbStructure = await this.getDatabaseStructure(this.customerDatabaseId);
        if (customerDbStructure) {
          const updatedAtProperty = this.getPropertyName(customerDbStructure.properties, 'date') || '最終更新日';
          const now = new Date().toISOString();
          
          await this.client.pages.update({
            page_id: customerId,
            properties: {
              [updatedAtProperty]: {
                date: { start: now }
              }
            }
          });
        }
      } catch (error) {
        console.warn('Failed to update customer last updated date:', error);
        // 最終更新日の更新に失敗しても履歴記録は継続
      }

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

      const relationProperty = this.getPropertyName(dbStructure.properties, 'relation') || '関連顧客ID';
      const dateProperty = this.getPropertyName(dbStructure.properties, 'date') || '日時';
      const titleProperty = this.getPropertyName(dbStructure.properties, 'title') || '商品名';
      const memoProperty = this.getPropertyName(dbStructure.properties, 'rich_text') || 'メモ';

      const itemNames = items.map(item => item.name).join(', ');

      const properties: any = {
        [relationProperty]: {
          relation: [{ id: customerId }]
        },
        [dateProperty]: {
          date: { start: timestamp || new Date().toISOString() }
        },
        [titleProperty]: {
          title: [{ text: { content: itemNames } }]
        }
      };

      // メモがある場合のみ追加
      if (memo && memo.trim()) {
        properties[memoProperty] = {
          rich_text: [{ text: { content: memo.trim() } }]
        };
      }

      const response = await this.client.pages.create({
        parent: { database_id: this.historyDatabaseId },
        properties
      });

      // 顧客の最終更新日も更新
      try {
        const customerDbStructure = await this.getDatabaseStructure(this.customerDatabaseId);
        if (customerDbStructure) {
          const updatedAtProperty = this.getPropertyName(customerDbStructure.properties, 'date') || '最終更新日';
          const now = new Date().toISOString();
          
          await this.client.pages.update({
            page_id: customerId,
            properties: {
              [updatedAtProperty]: {
                date: { start: now }
              }
            }
          });
        }
      } catch (error) {
        console.warn('Failed to update customer last updated date:', error);
        // 最終更新日の更新に失敗しても履歴記録は継続
      }

      return response.id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Purchase recording error details:', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        customerId,
        items,
        total,
        memo,
        timestamp
      });
      throw new Error(`Failed to record purchase: ${errorMessage}`);
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

      const relationProperty = this.getPropertyName(dbStructure.properties, 'relation') || '関連顧客ID';
      const dateProperty = this.getPropertyName(dbStructure.properties, 'date') || '日時';
      const titleProperty = this.getPropertyName(dbStructure.properties, 'title') || '商品名';
      const memoProperty = this.getPropertyName(dbStructure.properties, 'rich_text') || 'メモ';

      const filter: any = {
        property: relationProperty,
        relation: {
          contains: customerId
        }
      };

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

      return response.results.map(page => {
        const title = this.getPropertyValue(page, titleProperty, 'title');
        const memo = this.getPropertyValue(page, memoProperty, 'rich_text');
        
        // 商品名から履歴タイプを判定（「来店」の場合はcheckin、それ以外はpurchase）
        const recordType = title === '来店' ? 'checkin' : 'purchase';
        
        return {
          id: page.id,
          customerId,
          type: recordType,
          timestamp: this.getPropertyValue(page, dateProperty, 'date'),
          items: recordType === 'purchase' ? this.parseItems(title) : undefined,
          total: recordType === 'purchase' ? 0 : undefined, // 購入の場合は0、来店の場合はundefined
          memo: memo
        };
      });
    } catch (error) {
      console.error('History fetch error:', error);
      return [];
    }
  }

  // プロパティ値を動的に取得
  private getPropertyValue(page: any, propertyName: string, type: string): any {
    try {
      const property = page.properties[propertyName];
      if (!property) return null;

      switch (type) {
        case 'title':
          return property.title?.[0]?.text?.content || '';
        case 'rich_text':
          return property.rich_text?.[0]?.text?.content || '';
        case 'number':
          return property.number || 0;
        case 'select':
          return property.select?.name || '';
        case 'date':
          return property.date?.start || '';
        case 'created_time':
          return property.created_time || '';
        case 'relation':
          return property.relation?.[0]?.id || '';
        default:
          return null;
      }
    } catch (error) {
      console.error(`Error getting property value for ${propertyName}:`, error);
      return null;
    }
  }

  // 商品リストの解析（ヘルパー関数）
  private parseItems(itemsString: string): Array<{ name: string; quantity: number; price?: number }> {
    if (!itemsString) return [];
    
    return itemsString.split(', ').map(item => {
      // 数量情報（x1, x2など）を除去して商品名のみを取得
      const cleanName = item.replace(/\s*x\d+$/, '');
      return {
        name: cleanName,
        quantity: 1 // 常に数量1として扱う
      };
    });
  }

  // 履歴を更新
  async updateHistory(historyId: string, updates: { memo?: string; productName?: string }): Promise<HistoryRecord | null> {
    try {
      // データベース構造を取得してプロパティ名を動的に決定
      const dbStructure = await this.getDatabaseStructure(this.historyDatabaseId);
      if (!dbStructure) {
        throw new Error('Failed to get database structure');
      }

      const memoProperty = this.getPropertyName(dbStructure.properties, 'rich_text') || 'メモ';
      const titleProperty = this.getPropertyName(dbStructure.properties, 'title') || '商品名';

      const properties: any = {};

      // メモの更新
      if (updates.memo !== undefined) {
        properties[memoProperty] = {
          rich_text: updates.memo ? [{ text: { content: updates.memo } }] : []
        };
      }

      // 商品名の更新（購入履歴の場合のみ）
      if (updates.productName !== undefined) {
        properties[titleProperty] = {
          title: [{ text: { content: updates.productName } }]
        };
      }

      // ページを更新
      await this.client.pages.update({
        page_id: historyId,
        properties
      });

      // 更新された履歴を取得
      const response = await this.client.pages.retrieve({ page_id: historyId });
      const page = response as any;

      // 履歴レコードを構築
      const relationProperty = this.getPropertyName(dbStructure.properties, 'relation') || '関連顧客ID';
      const dateProperty = this.getPropertyName(dbStructure.properties, 'date') || '日時';

      const timestamp = this.getPropertyValue(page, dateProperty, 'date');
      const title = this.getPropertyValue(page, titleProperty, 'title');
      const memo = this.getPropertyValue(page, memoProperty, 'rich_text');

      // 商品名から履歴タイプを判定
      const recordType = title === '来店' ? 'checkin' : 'purchase';

      const result: HistoryRecord = {
        id: page.id,
        customerId: this.getPropertyValue(page, relationProperty, 'relation') || '',
        type: recordType,
        timestamp: timestamp || new Date().toISOString(),
        items: recordType === 'purchase' ? this.parseItems(title || '') : undefined,
        total: recordType === 'purchase' ? 0 : undefined, // 購入の場合は0、来店の場合はundefined
        memo: memo || undefined
      };

      return result;
    } catch (error) {
      console.error('Failed to update history:', error);
      return null;
    }
  }

  // 履歴を削除
  async deleteHistory(historyId: string): Promise<boolean> {
    try {
      console.log('Deleting history record:', historyId);
      
      // ページを削除
      await this.client.pages.update({
        page_id: historyId,
        archived: true // Notionではarchived=trueで削除扱い
      });

      console.log('History record deleted successfully:', historyId);
      return true;
    } catch (error) {
      console.error('Failed to delete history:', error);
      return false;
    }
  }
}

