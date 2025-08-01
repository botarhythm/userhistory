import { DatabaseIntegrityChecker, IntegrityCheckResult } from './db-integrity-checker';
import { NotionAPI } from '../api/notion';

// NotionAPIのモック
jest.mock('../api/notion');

describe('DatabaseIntegrityChecker', () => {
  let integrityChecker: DatabaseIntegrityChecker;
  let mockNotionAPI: jest.Mocked<NotionAPI>;

  beforeEach(() => {
    // モックをリセット
    jest.clearAllMocks();
    
    // NotionAPIのモックインスタンスを作成
    mockNotionAPI = {
      client: {
        databases: {
          retrieve: jest.fn(),
          query: jest.fn()
        },
        pages: {
          update: jest.fn()
        }
      },
      customerDatabaseId: 'test-customer-db',
      historyDatabaseId: 'test-history-db',
      productDatabaseId: 'test-product-db',
      getDatabaseStructure: jest.fn(),
      getProducts: jest.fn(),
      searchProducts: jest.fn(),
      findOrCreateCustomer: jest.fn(),
      findCustomerByLineUid: jest.fn(),
      recordCheckin: jest.fn(),
      recordPurchase: jest.fn(),
      getHistory: jest.fn()
    } as any;

    // DatabaseIntegrityCheckerのコンストラクタをモック
    jest.spyOn(DatabaseIntegrityChecker.prototype as any, 'notionAPI').mockReturnValue(mockNotionAPI);
    
    integrityChecker = new DatabaseIntegrityChecker();
  });

  describe('performFullIntegrityCheck', () => {
    it('正常なデータベースの整合性チェックを実行できる', async () => {
      // モックデータの設定
      const mockCustomerDbStructure = {
        id: 'test-customer-db',
        title: '顧客DB',
        properties: {
          '表示名': { type: 'title' },
          'LINE UID': { type: 'rich_text' },
          '登録日': { type: 'created_time' }
        }
      };

      const mockHistoryDbStructure = {
        id: 'test-history-db',
        title: '履歴DB',
        properties: {
          '関連顧客ID': { type: 'relation' },
          'タイプ': { type: 'select' },
          '日時': { type: 'date' },
          '商品名': { type: 'title' },
          'メモ': { type: 'rich_text' }
        }
      };

      const mockCustomers = [
        {
          id: 'customer-1',
          lineUid: 'line-uid-1',
          displayName: 'テストユーザー1',
          createdAt: '2024-01-01T00:00:00Z'
        }
      ];

      const mockHistoryRecords = [
        {
          id: 'history-1',
          customerId: 'customer-1',
          type: 'checkin' as const,
          timestamp: '2024-01-01T10:00:00Z',
          items: [],
          total: 0,
          memo: ''
        }
      ];

      // モックの戻り値を設定
      mockNotionAPI.getDatabaseStructure
        .mockResolvedValueOnce(mockCustomerDbStructure)
        .mockResolvedValueOnce(mockHistoryDbStructure);

      // プライベートメソッドをモック
      jest.spyOn(integrityChecker as any, 'getAllCustomers').mockResolvedValue(mockCustomers);
      jest.spyOn(integrityChecker as any, 'getAllHistoryRecords').mockResolvedValue(mockHistoryRecords);

      // 整合性チェックを実行
      const result = await integrityChecker.performFullIntegrityCheck();

      // 結果の検証
      expect(result).toBeDefined();
      expect(result.operation).toBe('database_integrity_check');
      expect(result.context.totalCustomers).toBe(1);
      expect(result.context.totalHistoryRecords).toBe(1);
      expect(result.context.orphanedRecords).toBe(0);
      expect(result.context.invalidRelations).toBe(0);
      expect(result.context.duplicateCustomers).toBe(0);
      expect(result.message).toContain('整合性チェック完了');
    });

    it('孤立した履歴レコードを検出できる', async () => {
      const mockCustomerDbStructure = {
        id: 'test-customer-db',
        title: '顧客DB',
        properties: {
          '表示名': { type: 'title' },
          'LINE UID': { type: 'rich_text' },
          '登録日': { type: 'created_time' }
        }
      };

      const mockHistoryDbStructure = {
        id: 'test-history-db',
        title: '履歴DB',
        properties: {
          '関連顧客ID': { type: 'relation' },
          'タイプ': { type: 'select' },
          '日時': { type: 'date' },
          '商品名': { type: 'title' },
          'メモ': { type: 'rich_text' }
        }
      };

      const mockCustomers = [
        {
          id: 'customer-1',
          lineUid: 'line-uid-1',
          displayName: 'テストユーザー1',
          createdAt: '2024-01-01T00:00:00Z'
        }
      ];

      const mockHistoryRecords = [
        {
          id: 'history-1',
          customerId: 'customer-1',
          type: 'checkin' as const,
          timestamp: '2024-01-01T10:00:00Z',
          items: [],
          total: 0,
          memo: ''
        },
        {
          id: 'history-2',
          customerId: 'customer-2', // 存在しない顧客ID
          type: 'purchase' as const,
          timestamp: '2024-01-01T11:00:00Z',
          items: [],
          total: 0,
          memo: ''
        }
      ];

      mockNotionAPI.getDatabaseStructure
        .mockResolvedValueOnce(mockCustomerDbStructure)
        .mockResolvedValueOnce(mockHistoryDbStructure);

      jest.spyOn(integrityChecker as any, 'getAllCustomers').mockResolvedValue(mockCustomers);
      jest.spyOn(integrityChecker as any, 'getAllHistoryRecords').mockResolvedValue(mockHistoryRecords);

      const result = await integrityChecker.performFullIntegrityCheck();

      expect(result.context.orphanedRecords).toBe(1);
      expect(result.details.orphanedHistoryIds).toContain('history-2');
    });

    it('重複するLINE UIDを検出できる', async () => {
      const mockCustomerDbStructure = {
        id: 'test-customer-db',
        title: '顧客DB',
        properties: {
          '表示名': { type: 'title' },
          'LINE UID': { type: 'rich_text' },
          '登録日': { type: 'created_time' }
        }
      };

      const mockHistoryDbStructure = {
        id: 'test-history-db',
        title: '履歴DB',
        properties: {
          '関連顧客ID': { type: 'relation' },
          'タイプ': { type: 'select' },
          '日時': { type: 'date' },
          '商品名': { type: 'title' },
          'メモ': { type: 'rich_text' }
        }
      };

      const mockCustomers = [
        {
          id: 'customer-1',
          lineUid: 'line-uid-1',
          displayName: 'テストユーザー1',
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'customer-2',
          lineUid: 'line-uid-1', // 重複するLINE UID
          displayName: 'テストユーザー2',
          createdAt: '2024-01-02T00:00:00Z'
        }
      ];

      const mockHistoryRecords: any[] = [];

      mockNotionAPI.getDatabaseStructure
        .mockResolvedValueOnce(mockCustomerDbStructure)
        .mockResolvedValueOnce(mockHistoryDbStructure);

      jest.spyOn(integrityChecker as any, 'getAllCustomers').mockResolvedValue(mockCustomers);
      jest.spyOn(integrityChecker as any, 'getAllHistoryRecords').mockResolvedValue(mockHistoryRecords);

      const result = await integrityChecker.performFullIntegrityCheck();

      expect(result.context.duplicateCustomers).toBe(1);
      expect(result.details.duplicateLineUids).toContain('line-uid-1');
    });
  });

  describe('cleanupOrphanedRecords', () => {
    it('孤立したレコードを削除できる', async () => {
      const orphanedIds = ['history-1', 'history-2'];
      
      mockNotionAPI.client.pages.update
        .mockResolvedValueOnce({} as any)
        .mockResolvedValueOnce({} as any);

      const result = await integrityChecker.cleanupOrphanedRecords(orphanedIds);

      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(mockNotionAPI.client.pages.update).toHaveBeenCalledTimes(2);
    });

    it('削除に失敗したレコードを適切に処理できる', async () => {
      const orphanedIds = ['history-1', 'history-2'];
      
      mockNotionAPI.client.pages.update
        .mockResolvedValueOnce({} as any)
        .mockRejectedValueOnce(new Error('削除失敗'));

      const result = await integrityChecker.cleanupOrphanedRecords(orphanedIds);

      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
    });
  });

  describe('mergeDuplicateCustomers', () => {
    it('重複顧客の統合処理を実行できる', async () => {
      const duplicateLineUids = ['line-uid-1', 'line-uid-2'];

      const result = await integrityChecker.mergeDuplicateCustomers(duplicateLineUids);

      expect(result.merged).toBe(2);
      expect(result.failed).toBe(0);
    });
  });
}); 