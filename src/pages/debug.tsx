/**
 * LINE認証デバッグページ
 * 開発環境でのみ表示される診断ツール
 */

import React, { useState, useEffect } from 'react';
import { useLiff } from '../contexts/LiffContext';
import { LiffDebugger } from '../utils/debug-liff';

const DebugPage: React.FC = () => {
  const { runDiagnosis, debugInfo } = useLiff();
  const [diagnosisResult, setDiagnosisResult] = useState<any>(null);
  const [autoFixResult, setAutoFixResult] = useState<string | null>(null);
  const liffDebugger = LiffDebugger.getInstance();

  const handleDiagnosis = async () => {
    await runDiagnosis();
    const result = await liffDebugger.diagnose();
    setDiagnosisResult(result);
  };

  const handleAutoFix = async () => {
    setAutoFixResult('自動修復を実行中...');
    const success = await liffDebugger.attemptAutoFix();
    setAutoFixResult(success ? '✅ 自動修復が成功しました' : '❌ 自動修復に失敗しました');
  };

  const copyDiagnosisToClipboard = () => {
    const text = JSON.stringify(diagnosisResult || debugInfo, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      alert('診断結果をクリップボードにコピーしました');
    });
  };

  // 開発環境でない場合は表示しない
  if (import.meta.env.PROD) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-4">
            デバッグページ
          </h1>
          <p className="text-gray-600">
            このページは開発環境でのみ利用できます
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🔍 LINE認証デバッグツール
          </h1>

          {/* アクションボタン */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={handleDiagnosis}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              🔍 診断実行
            </button>
            <button
              onClick={handleAutoFix}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
            >
              🔧 自動修復
            </button>
            <button
              onClick={copyDiagnosisToClipboard}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
              disabled={!diagnosisResult && !debugInfo}
            >
              📋 結果をコピー
            </button>
          </div>

          {/* 自動修復結果 */}
          {autoFixResult && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800">{autoFixResult}</p>
            </div>
          )}

          {/* 診断結果 */}
          {(diagnosisResult || debugInfo) && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">
                診断結果
              </h2>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-bold mb-2">基本情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">診断時刻:</span>
                    <span className="ml-2 text-gray-600">
                      {(diagnosisResult || debugInfo)?.timestamp}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">環境:</span>
                    <span className="ml-2 text-gray-600">
                      {(diagnosisResult || debugInfo)?.environment}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">URL:</span>
                    <span className="ml-2 text-gray-600 break-all">
                      {(diagnosisResult || debugInfo)?.location}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">LIFF ID:</span>
                    <span className="ml-2 text-gray-600">
                      {(diagnosisResult || debugInfo)?.liffId ? '✅ 設定済み' : '❌ 未設定'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">LINEアプリ内:</span>
                    <span className="ml-2 text-gray-600">
                      {(diagnosisResult || debugInfo)?.isInClient ? '✅ はい' : '❌ いいえ'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">ログイン状態:</span>
                    <span className="ml-2 text-gray-600">
                      {(diagnosisResult || debugInfo)?.isLoggedIn ? '✅ ログイン済み' : '❌ 未ログイン'}
                    </span>
                  </div>
                </div>
              </div>

              {(diagnosisResult || debugInfo)?.error && (
                <div className="bg-red-50 p-4 border border-red-200 rounded-md">
                  <h3 className="font-bold text-red-800 mb-2">エラー情報</h3>
                  <p className="text-red-700">
                    {(diagnosisResult || debugInfo)?.error}
                  </p>
                </div>
              )}

              {/* 詳細なJSON表示 */}
              <details className="bg-gray-50 p-4 rounded-md">
                <summary className="font-bold cursor-pointer">
                  詳細な診断データ (JSON)
                </summary>
                <pre className="mt-4 text-xs text-gray-600 whitespace-pre-wrap overflow-auto">
                  {JSON.stringify(diagnosisResult || debugInfo, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {/* 推奨アクション */}
          <div className="mt-8 bg-yellow-50 p-4 border border-yellow-200 rounded-md">
            <h3 className="font-bold text-yellow-800 mb-2">
              💡 よくある問題と解決方法
            </h3>
            <ul className="text-yellow-700 space-y-1 text-sm">
              <li>• <strong>LIFF ID未設定:</strong> RailwayダッシュボードでVITE_LIFF_IDを設定し、再デプロイ</li>
              <li>• <strong>LINEアプリ外アクセス:</strong> LINEアプリからミニアプリを開く</li>
              <li>• <strong>未ログイン:</strong> LINEアプリでログイン状態を確認</li>
              <li>• <strong>初期化エラー:</strong> ブラウザのキャッシュをクリアして再試行</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;
