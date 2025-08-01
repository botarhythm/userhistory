import React, { useState, useEffect } from 'react';

interface IntegrityCheckResult {
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

interface CleanupResult {
  success: number;
  failed: number;
}

export const DatabaseIntegrityPanel: React.FC = () => {
  const [integrityResult, setIntegrityResult] = useState<IntegrityCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);

  const performIntegrityCheck = async () => {
    setLoading(true);
    setError(null);
    setIntegrityResult(null);

    try {
      const response = await fetch('/api/debug/integrity-check');
      if (!response.ok) {
        throw new Error(`整合性チェックに失敗しました: ${response.status}`);
      }

      const data = await response.json();
      setIntegrityResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const cleanupOrphanedRecords = async () => {
    if (!integrityResult || integrityResult.details.orphanedHistoryIds.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/debug/cleanup-orphaned-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orphanedIds: integrityResult.details.orphanedHistoryIds
        })
      });

      if (!response.ok) {
        throw new Error(`クリーンアップに失敗しました: ${response.status}`);
      }

      const data = await response.json();
      setCleanupResult(data.result);
      
      // クリーンアップ後に再度整合性チェックを実行
      await performIntegrityCheck();
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // コンポーネントマウント時に自動で整合性チェックを実行
    performIntegrityCheck();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🔍 データベース整合性チェック
        </h1>
        <p className="text-gray-600">
          Notionデータベースの整合性を確認し、問題のあるレコードを検出・修正します
        </p>
      </div>

      {/* 操作ボタン */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={performIntegrityCheck}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'チェック中...' : '整合性チェック実行'}
        </button>

        {integrityResult && integrityResult.details.orphanedHistoryIds.length > 0 && (
          <button
            onClick={cleanupOrphanedRecords}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'クリーンアップ中...' : '孤立レコード削除'}
          </button>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">エラー</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* クリーンアップ結果 */}
      {cleanupResult && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">クリーンアップ完了</h3>
              <div className="mt-2 text-sm text-green-700">
                成功: {cleanupResult.success}件, 失敗: {cleanupResult.failed}件
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 整合性チェック結果 */}
      {integrityResult && (
        <div className="space-y-6">
          {/* 概要統計 */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {integrityResult.context.totalCustomers}
              </div>
              <div className="text-sm text-blue-800">総顧客数</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {integrityResult.context.totalHistoryRecords}
              </div>
              <div className="text-sm text-green-800">総履歴数</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {integrityResult.context.orphanedRecords}
              </div>
              <div className="text-sm text-red-800">孤立レコード</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {integrityResult.context.invalidRelations}
              </div>
              <div className="text-sm text-yellow-800">無効リレーション</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {integrityResult.context.duplicateCustomers}
              </div>
              <div className="text-sm text-purple-800">重複顧客</div>
            </div>
          </div>

          {/* 詳細情報 */}
          <div className="space-y-4">
            {/* 孤立レコード */}
            {integrityResult.details.orphanedHistoryIds.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  ⚠️ 孤立した履歴レコード ({integrityResult.details.orphanedHistoryIds.length}件)
                </h3>
                <div className="text-sm text-red-700 mb-3">
                  存在しない顧客IDを参照している履歴レコードです。削除することを推奨します。
                </div>
                <div className="bg-white rounded border p-3 max-h-40 overflow-y-auto">
                  {integrityResult.details.orphanedHistoryIds.map((id, index) => (
                    <div key={index} className="text-sm font-mono text-red-600">
                      {id}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 無効リレーション */}
            {integrityResult.details.invalidRelationIds.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  ⚠️ 無効なリレーション ({integrityResult.details.invalidRelationIds.length}件)
                </h3>
                <div className="text-sm text-yellow-700 mb-3">
                  顧客IDが空の履歴レコードです。手動での確認が必要です。
                </div>
                <div className="bg-white rounded border p-3 max-h-40 overflow-y-auto">
                  {integrityResult.details.invalidRelationIds.map((id, index) => (
                    <div key={index} className="text-sm font-mono text-yellow-600">
                      {id}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 重複顧客 */}
            {integrityResult.details.duplicateLineUids.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">
                  ⚠️ 重複するLINE UID ({integrityResult.details.duplicateLineUids.length}件)
                </h3>
                <div className="text-sm text-purple-700 mb-3">
                  同じLINE UIDを持つ複数の顧客が存在します。統合が必要です。
                </div>
                <div className="bg-white rounded border p-3 max-h-40 overflow-y-auto">
                  {integrityResult.details.duplicateLineUids.map((uid, index) => (
                    <div key={index} className="text-sm font-mono text-purple-600">
                      {uid}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 履歴のない顧客 */}
            {integrityResult.details.customersWithoutHistory.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  ℹ️ 履歴のない顧客 ({integrityResult.details.customersWithoutHistory.length}件)
                </h3>
                <div className="text-sm text-blue-700 mb-3">
                  まだ来店や購入履歴がない顧客です。正常な状態です。
                </div>
                <div className="bg-white rounded border p-3 max-h-40 overflow-y-auto">
                  {integrityResult.details.customersWithoutHistory.map((id, index) => (
                    <div key={index} className="text-sm font-mono text-blue-600">
                      {id}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 推奨アクション */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              🎯 推奨アクション
            </h3>
            <div className="text-sm text-gray-700 mb-3">
              {integrityResult.ai_todo}
            </div>
            <div className="text-xs text-gray-500">
              {integrityResult.human_note}
            </div>
          </div>

          {/* 正常状態の表示 */}
          {integrityResult.context.orphanedRecords === 0 && 
           integrityResult.context.invalidRelations === 0 && 
           integrityResult.context.duplicateCustomers === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">データベースは正常です！</h3>
                  <div className="mt-2 text-sm text-green-700">
                    整合性の問題は検出されませんでした。データベースは健全な状態です。
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ローディング表示 */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">処理中...</span>
        </div>
      )}
    </div>
  );
}; 