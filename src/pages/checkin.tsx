import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CheckinPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memo, setMemo] = useState<string>('');

  const handleCheckin = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lineUid: 'test-user', // 実際のLINE UIDに置き換え
          displayName: 'テストユーザー',
          timestamp: new Date().toISOString(),
          memo: memo.trim() || undefined
        }),
      });

      if (response.ok) {
        alert('来店チェックインを記録しました');
        navigate('/history');
      } else {
        const error = await response.json();
        alert(`エラー: ${error.error || 'チェックインの記録に失敗しました'}`);
      }
    } catch (error) {
      console.error('Checkin error:', error);
      alert('チェックインの記録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            来店チェックイン
          </h1>
          <p className="text-gray-600">
            Botarhythm Coffee Roasterに来店しました
          </p>
        </div>

        <div className="space-y-6">
          {/* 現在時刻表示 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">チェックイン時刻</div>
            <div className="text-lg font-semibold text-gray-900">
              {new Date().toLocaleString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>

          {/* メモセクション */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メモ (任意)
            </label>
            <textarea
              placeholder="特記事項があれば入力してください"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          {/* チェックインボタン */}
          <button
            onClick={handleCheckin}
            disabled={isSubmitting}
            className="w-full bg-green-600 text-white py-4 px-6 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                チェックイン中...
              </div>
            ) : (
              'チェックインする'
            )}
          </button>

          {/* 履歴確認ボタン */}
          <button
            onClick={() => navigate('/history')}
            className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            履歴を確認
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckinPage; 