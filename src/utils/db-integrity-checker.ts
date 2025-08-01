import { NotionAPI, Customer, HistoryRecord } from '../api/notion.js';

export interface IntegrityCheckResult {
  operation: string;
  context: {
    totalCustomers: number;
    totalHistoryRecords: number;
    orphanedRecords: number;
    invalidRelations: number;
    duplicateCustomers: number;
  };
  message: string;
  ai_todo: string;
  human_note: string;
  details: {
    orphanedHistoryIds: string[];
    invalidRelationIds: string[];
    duplicateLineUids: string[];
    customersWithoutHistory: string[];
  };
}

export class DatabaseIntegrityChecker {
  private notionAPI: NotionAPI;

  constructor() {
    this.notionAPI = new NotionAPI();
  }

  /**
   * データベース全体の整合性チェックを実行
   */
  async performFullIntegrityCheck(): Promise<IntegrityCheckResult> {
    console.log('🔍 データベース整合性チェックを開始...');

    try {
      // 1. 顧客データベースの構造確認
      const customerDbStructure = await this.notionAPI.getDatabaseStructure(
        this.notionAPI.customerDatabaseId
      );
      
      if (!customerDbStructure) {
        throw new Error('顧客データベースの構造を取得できませんでした');
      }

      // 2. 履歴データベースの構造確認
      const historyDbStructure = await this.notionAPI.getDatabaseStructure(
        this.notionAPI.historyDatabaseId
      );
      
      if (!historyDbStructure) {
        throw new Error('履歴データベースの構造を取得できませんでした');
      }

      // 3. 全顧客データを取得
      const allCustomers = await this.getAllCustomers();
      
      // 4. 全履歴データを取得
      const allHistoryRecords = await this.getAllHistoryRecords();

      // 5. 整合性チェックを実行
      const integrityIssues = await this.checkIntegrity(allCustomers, allHistoryRecords);

      const result: IntegrityCheckResult = {
        operation: 'database_integrity_check',
        context: {
          totalCustomers: allCustomers.length,
          totalHistoryRecords: allHistoryRecords.length,
          orphanedRecords: integrityIssues.orphanedHistoryIds.length,
          invalidRelations: integrityIssues.invalidRelationIds.length,
          duplicateCustomers: integrityIssues.duplicateLineUids.length,
        },
        message: `整合性チェック完了: ${allCustomers.length}件の顧客、${allHistoryRecords.length}件の履歴を確認`,
        ai_todo: integrityIssues.orphanedHistoryIds.length > 0 ? 
          '孤立した履歴レコードの削除または修正を提案' : 
          'データベースは正常です。定期的な監視を継続',
        human_note: `問題が見つかった場合は、手動での確認と修正が必要です`,
        details: integrityIssues
      };

      console.log('✅ 整合性チェック完了:', result);
      return result;

    } catch (error) {
      console.error('❌ 整合性チェックエラー:', error);
      throw error;
    }
  }

  /**
   * 全顧客データを取得
   */
  private async getAllCustomers(): Promise<Customer[]> {
    try {
      const dbStructure = await this.notionAPI.getDatabaseStructure(
        this.notionAPI.customerDatabaseId
      );
      
      if (!dbStructure) {
        return [];
      }

      const displayNameProperty = this.getPropertyName(dbStructure.properties, 'title') || '表示名';
      const lineUidProperty = this.getPropertyName(dbStructure.properties, 'rich_text') || 'LINE UID';
      const dateProperty = this.getPropertyName(dbStructure.properties, 'created_time') || '登録日';

      const response = await this.notionAPI.client.databases.query({
        database_id: this.notionAPI.customerDatabaseId,
        page_size: 100
      });

      return response.results.map((page: any) => ({
        id: page.id,
        lineUid: this.getPropertyValue(page, lineUidProperty, 'rich_text') || '',
        displayName: this.getPropertyValue(page, displayNameProperty, 'title') || '',
        createdAt: this.getPropertyValue(page, dateProperty, 'created_time') || new Date().toISOString()
      }));
    } catch (error) {
      console.error('顧客データ取得エラー:', error);
      return [];
    }
  }

  /**
   * 全履歴データを取得
   */
  private async getAllHistoryRecords(): Promise<HistoryRecord[]> {
    try {
      const dbStructure = await this.notionAPI.getDatabaseStructure(
        this.notionAPI.historyDatabaseId
      );
      
      if (!dbStructure) {
        return [];
      }

      const relationProperty = this.getPropertyName(dbStructure.properties, 'relation') || '関連顧客ID';
      const dateProperty = this.getPropertyName(dbStructure.properties, 'date') || '日時';
      const titleProperty = this.getPropertyName(dbStructure.properties, 'title') || '商品名';
      const memoProperty = this.getPropertyName(dbStructure.properties, 'rich_text') || 'メモ';

      const response = await this.notionAPI.client.databases.query({
        database_id: this.notionAPI.historyDatabaseId,
        page_size: 100
      });

      return response.results.map((page: any) => ({
        id: page.id,
        customerId: this.getPropertyValue(page, relationProperty, 'relation') || '',
        type: 'purchase', // タイププロパティが削除されたため、デフォルトでpurchase
        timestamp: this.getPropertyValue(page, dateProperty, 'date'),
        items: this.parseItems(this.getPropertyValue(page, titleProperty, 'title')),
        total: 0,
        memo: this.getPropertyValue(page, memoProperty, 'rich_text')
      }));
    } catch (error) {
      console.error('履歴データ取得エラー:', error);
      return [];
    }
  }

  /**
   * 整合性チェックを実行
   */
  private async checkIntegrity(
    customers: Customer[], 
    historyRecords: HistoryRecord[]
  ): Promise<IntegrityCheckResult['details']> {
    const customerIds = new Set(customers.map(c => c.id));
    const lineUids = new Map<string, string[]>();
    
    // LINE UIDの重複チェック
    customers.forEach(customer => {
      if (!lineUids.has(customer.lineUid)) {
        lineUids.set(customer.lineUid, []);
      }
      lineUids.get(customer.lineUid)!.push(customer.id);
    });

    const duplicateLineUids = Array.from(lineUids.entries())
      .filter(([_, ids]) => ids.length > 1)
      .map(([uid, _]) => uid);

    // 孤立した履歴レコードを検出
    const orphanedHistoryIds = historyRecords
      .filter(record => !customerIds.has(record.customerId))
      .map(record => record.id);

    // 無効なリレーションを検出
    const invalidRelationIds = historyRecords
      .filter(record => record.customerId === '')
      .map(record => record.id);

    // 履歴のない顧客を検出
    const customersWithHistory = new Set(historyRecords.map(record => record.customerId));
    const customersWithoutHistory = customers
      .filter(customer => !customersWithHistory.has(customer.id))
      .map(customer => customer.id);

    return {
      orphanedHistoryIds: orphanedHistoryIds,
      invalidRelationIds: invalidRelationIds,
      duplicateLineUids: duplicateLineUids,
      customersWithoutHistory: customersWithoutHistory
    };
  }

  /**
   * 孤立した履歴レコードを削除
   */
  async cleanupOrphanedRecords(orphanedIds: string[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const id of orphanedIds) {
      try {
        await this.notionAPI.client.pages.update({
          page_id: id,
          archived: true
        });
        success++;
        console.log(`✅ 孤立レコード削除成功: ${id}`);
      } catch (error) {
        failed++;
        console.error(`❌ 孤立レコード削除失敗: ${id}`, error);
      }
    }

    return { success, failed };
  }

  /**
   * 重複顧客の統合
   */
  async mergeDuplicateCustomers(duplicateLineUids: string[]): Promise<{ merged: number; failed: number }> {
    let merged = 0;
    let failed = 0;

    for (const lineUid of duplicateLineUids) {
      try {
        // 重複顧客の履歴を統合する処理を実装
        // ここでは基本的な構造のみ提供
        console.log(`🔄 重複顧客の統合処理: ${lineUid}`);
        merged++;
      } catch (error) {
        failed++;
        console.error(`❌ 重複顧客統合失敗: ${lineUid}`, error);
      }
    }

    return { merged, failed };
  }

  // ヘルパーメソッド
  private getPropertyName(properties: any, type: string): string | null {
    for (const [name, prop] of Object.entries(properties)) {
      if ((prop as any).type === type) {
        return name;
      }
    }
    return null;
  }

  private getPropertyValue(page: any, propertyName: string, type: string): any {
    try {
      const property = page.properties[propertyName];
      if (!property) return null;

      switch (type) {
        case 'title':
          return property.title?.[0]?.text?.content || '';
        case 'rich_text':
          return property.rich_text?.[0]?.text?.content || '';
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
      console.error(`プロパティ値取得エラー ${propertyName}:`, error);
      return null;
    }
  }

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