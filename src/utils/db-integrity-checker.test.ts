import { DatabaseIntegrityChecker, IntegrityCheckResult } from './db-integrity-checker';
import { NotionAPI } from '../api/notion';

// NotionAPIのモック
jest.mock('../api/notion', () => ({
  NotionAPI: jest.fn().mockImplementation(() => ({
    customerDatabaseId: 'customer-db-id',
    historyDatabaseId: 'history-db-id',
    client: {
      databases: {
        query: jest.fn()
      },
      pages: {
        update: jest.fn()
      }
    },
    getDatabaseStructure: jest.fn()
  }))
}));

describe('DatabaseIntegrityChecker', () => {
  let checker: DatabaseIntegrityChecker;
  let mockNotionAPI: jest.Mocked<NotionAPI>;

  beforeEach(() => {
    jest.clearAllMocks();
    checker = new DatabaseIntegrityChecker();
    mockNotionAPI = (checker as any).notionAPI;
  });

  describe('performFullIntegrityCheck', () => {
    it('should perform integrity check successfully', async () => {
      // モックデータの設定
      const mockCustomerDbStructure = {
        properties: {
          '表示名': { type: 'title' },
          'LINE UID': { type: 'rich_text' },
          '登録日': { type: 'created_time' }
        }
      };

      const mockHistoryDbStructure = {
        properties: {
          '関連顧客ID': { type: 'relation' },
          '日時': { type: 'date' },
          '商品名': { type: 'title' },
          'メモ': { type: 'rich_text' }
        }
      };

      const mockCustomers = [
        {
          id: 'customer-1',
          properties: {
            '表示名': { title: [{ text: { content: 'テスト顧客1' } }] },
            'LINE UID': { rich_text: [{ text: { content: 'line-uid-1' } }] },
            '登録日': { created_time: '2024-01-01T00:00:00Z' }
          }
        }
      ];

      const mockHistoryRecords = [
        {
          id: 'history-1',
          properties: {
            '関連顧客ID': { relation: [{ id: 'customer-1' }] },
            '日時': { date: { start: '2024-01-01T19:00:00Z' } },
            '商品名': { title: [{ text: { content: 'テスト商品 x1' } }] },
            'メモ': { rich_text: [{ text: { content: 'テストメモ' } }] }
          }
        }
      ];

      // モックの設定
      mockNotionAPI.getDatabaseStructure
        .mockResolvedValueOnce(mockCustomerDbStructure)
        .mockResolvedValueOnce(mockHistoryDbStructure);

      mockNotionAPI.client.databases.query
        .mockResolvedValueOnce({ results: mockCustomers })
        .mockResolvedValueOnce({ results: mockHistoryRecords });

      // テスト実行
      const result = await checker.performFullIntegrityCheck();

      // 結果の検証
      expect(result).toBeDefined();
      expect(result.operation).toBe('database_integrity_check');
      expect(result.context.totalCustomers).toBe(1);
      expect(result.context.totalHistoryRecords).toBe(1);
      expect(result.context.orphanedRecords).toBe(0);
      expect(result.context.invalidRelations).toBe(0);
      expect(result.context.duplicateCustomers).toBe(0);
    });

    it('should detect orphaned records', async () => {
      // モックデータの設定（孤立レコードあり）
      const mockCustomerDbStructure = {
        properties: {
          '表示名': { type: 'title' },
          'LINE UID': { type: 'rich_text' },
          '登録日': { type: 'created_time' }
        }
      };

      const mockHistoryDbStructure = {
        properties: {
          '関連顧客ID': { type: 'relation' },
          '日時': { type: 'date' },
          '商品名': { type: 'title' },
          'メモ': { type: 'rich_text' }
        }
      };

      const mockCustomers = [
        {
          id: 'customer-1',
          properties: {
            '表示名': { title: [{ text: { content: 'テスト顧客1' } }] },
            'LINE UID': { rich_text: [{ text: { content: 'line-uid-1' } }] },
            '登録日': { created_time: '2024-01-01T00:00:00Z' }
          }
        }
      ];

      const mockHistoryRecords = [
        {
          id: 'history-1',
          properties: {
            '関連顧客ID': { relation: [{ id: 'customer-1' }] },
            '日時': { date: { start: '2024-01-01T19:00:00Z' } },
            '商品名': { title: [{ text: { content: 'テスト商品 x1' } }] },
            'メモ': { rich_text: [{ text: { content: 'テストメモ' } }] }
          }
        },
        {
          id: 'history-2',
          properties: {
            '関連顧客ID': { relation: [{ id: 'non-existent-customer' }] },
            '日時': { date: { start: '2024-01-02T19:00:00Z' } },
            '商品名': { title: [{ text: { content: '孤立商品 x1' } }] },
            'メモ': { rich_text: [{ text: { content: '孤立メモ' } }] }
          }
        }
      ];

      // モックの設定
      mockNotionAPI.getDatabaseStructure
        .mockResolvedValueOnce(mockCustomerDbStructure)
        .mockResolvedValueOnce(mockHistoryDbStructure);

      mockNotionAPI.client.databases.query
        .mockResolvedValueOnce({ results: mockCustomers })
        .mockResolvedValueOnce({ results: mockHistoryRecords });

      // テスト実行
      const result = await checker.performFullIntegrityCheck();

      // 結果の検証
      expect(result.context.orphanedRecords).toBe(1);
      expect(result.details.orphanedHistoryIds).toContain('history-2');
    });

    it('should detect duplicate customers', async () => {
      // モックデータの設定（重複顧客あり）
      const mockCustomerDbStructure = {
        properties: {
          '表示名': { type: 'title' },
          'LINE UID': { type: 'rich_text' },
          '登録日': { type: 'created_time' }
        }
      };

      const mockHistoryDbStructure = {
        properties: {
          '関連顧客ID': { type: 'relation' },
          '日時': { type: 'date' },
          '商品名': { type: 'title' },
          'メモ': { type: 'rich_text' }
        }
      };

      const mockCustomers = [
        {
          id: 'customer-1',
          properties: {
            '表示名': { title: [{ text: { content: 'テスト顧客1' } }] },
            'LINE UID': { rich_text: [{ text: { content: 'line-uid-1' } }] },
            '登録日': { created_time: '2024-01-01T00:00:00Z' }
          }
        },
        {
          id: 'customer-2',
          properties: {
            '表示名': { title: [{ text: { content: 'テスト顧客2' } }] },
            'LINE UID': { rich_text: [{ text: { content: 'line-uid-1' } }] },
            '登録日': { created_time: '2024-01-02T00:00:00Z' }
          }
        }
      ];

      const mockHistoryRecords: any[] = [];

      // モックの設定
      mockNotionAPI.getDatabaseStructure
        .mockResolvedValueOnce(mockCustomerDbStructure)
        .mockResolvedValueOnce(mockHistoryDbStructure);

      mockNotionAPI.client.databases.query
        .mockResolvedValueOnce({ results: mockCustomers })
        .mockResolvedValueOnce({ results: mockHistoryRecords });

      // テスト実行
      const result = await checker.performFullIntegrityCheck();

      // 結果の検証
      expect(result.context.duplicateCustomers).toBe(1);
      expect(result.details.duplicateLineUids).toContain('line-uid-1');
    });
  });

  describe('cleanupOrphanedRecords', () => {
    it('should cleanup orphaned records successfully', async () => {
      const orphanedIds = ['history-1', 'history-2'];
      
      mockNotionAPI.client.pages.update
        .mockResolvedValueOnce({} as any)
        .mockResolvedValueOnce({} as any);

      const result = await checker.cleanupOrphanedRecords(orphanedIds);

      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(mockNotionAPI.client.pages.update).toHaveBeenCalledTimes(2);
    });

    it('should handle cleanup failures', async () => {
      const orphanedIds = ['history-1', 'history-2'];
      
      mockNotionAPI.client.pages.update
        .mockResolvedValueOnce({} as any)
        .mockRejectedValueOnce(new Error('Update failed'));

      const result = await checker.cleanupOrphanedRecords(orphanedIds);

      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
    });
  });

  describe('mergeDuplicateCustomers', () => {
    it('should merge duplicate customers successfully', async () => {
      const duplicateLineUids = ['line-uid-1'];

      // モックデータの設定
      const mockCustomerDbStructure = {
        properties: {
          '表示名': { type: 'title' },
          'LINE UID': { type: 'rich_text' },
          '登録日': { type: 'created_time' }
        }
      };

      const mockHistoryDbStructure = {
        properties: {
          '関連顧客ID': { type: 'relation' },
          '日時': { type: 'date' },
          '商品名': { type: 'title' },
          'メモ': { type: 'rich_text' }
        }
      };

      const mockCustomers = [
        {
          id: 'customer-1',
          properties: {
            '表示名': { title: [{ text: { content: 'テスト顧客1' } }] },
            'LINE UID': { rich_text: [{ text: { content: 'line-uid-1' } }] },
            '登録日': { created_time: '2024-01-01T00:00:00Z' }
          }
        },
        {
          id: 'customer-2',
          properties: {
            '表示名': { title: [{ text: { content: 'テスト顧客2' } }] },
            'LINE UID': { rich_text: [{ text: { content: 'line-uid-1' } }] },
            '登録日': { created_time: '2024-01-02T00:00:00Z' }
          }
        }
      ];

      const mockHistoryRecords = [
        {
          id: 'history-1',
          properties: {
            '関連顧客ID': { relation: [{ id: 'customer-2' }] },
            '日時': { date: { start: '2024-01-01T19:00:00Z' } },
            '商品名': { title: [{ text: { content: 'テスト商品 x1' } }] },
            'メモ': { rich_text: [{ text: { content: 'テストメモ' } }] }
          }
        }
      ];

      // モックの設定
      mockNotionAPI.getDatabaseStructure
        .mockResolvedValue(mockCustomerDbStructure);

      mockNotionAPI.client.databases.query
        .mockResolvedValueOnce({ results: mockCustomers })
        .mockResolvedValueOnce({ results: mockHistoryRecords });

      mockNotionAPI.client.pages.update
        .mockResolvedValue({} as any);

      const result = await checker.mergeDuplicateCustomers(duplicateLineUids);

      expect(result.merged).toBe(1);
      expect(result.failed).toBe(0);
    });
  });
}); 