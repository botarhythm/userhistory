#!/usr/bin/env node

import { DatabaseIntegrityChecker } from '../src/utils/db-integrity-checker.js';
import dotenv from 'dotenv';

// 環境変数を読み込み
dotenv.config();

async function main() {
  console.log('🔧 Botarhythm Coffee Roaster データベース自動修正');
  console.log('================================================\n');

  try {
    // 環境変数の確認
    const requiredEnvVars = [
      'NOTION_API_KEY',
      'NOTION_CUSTOMER_DB_ID',
      'NOTION_HISTORY_DB_ID'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.error('❌ 必要な環境変数が設定されていません:');
      missingVars.forEach(varName => console.error(`   - ${varName}`));
      process.exit(1);
    }

    console.log('✅ 環境変数の確認完了\n');

    // 整合性チェックを実行
    const integrityChecker = new DatabaseIntegrityChecker();
    const result = await integrityChecker.performFullIntegrityCheck();

    console.log('📊 修正前の状態');
    console.log('==============');
    console.log(`総顧客数: ${result.context.totalCustomers}件`);
    console.log(`総履歴数: ${result.context.totalHistoryRecords}件`);
    console.log(`孤立レコード: ${result.context.orphanedRecords}件`);
    console.log(`無効リレーション: ${result.context.invalidRelations}件`);
    console.log(`重複顧客: ${result.context.duplicateCustomers}件\n`);

    // 問題がない場合は終了
    if (result.context.orphanedRecords === 0 && 
        result.context.invalidRelations === 0 && 
        result.context.duplicateCustomers === 0) {
      console.log('✅ データベースは正常です。修正は不要です。');
      return;
    }

    // 孤立レコードの削除
    if (result.details.orphanedHistoryIds.length > 0) {
      console.log('🗑️  孤立レコードの削除を開始...');
      const cleanupResult = await integrityChecker.cleanupOrphanedRecords(
        result.details.orphanedHistoryIds
      );
      
      console.log(`✅ 孤立レコード削除完了: 成功${cleanupResult.success}件, 失敗${cleanupResult.failed}件\n`);
    }

    // 重複顧客の統合
    if (result.details.duplicateLineUids.length > 0) {
      console.log('🔄 重複顧客の統合を開始...');
      const mergeResult = await integrityChecker.mergeDuplicateCustomers(
        result.details.duplicateLineUids
      );
      
      console.log(`✅ 重複顧客統合完了: 統合${mergeResult.merged}件, 失敗${mergeResult.failed}件\n`);
    }

    // 修正後の整合性チェック
    console.log('🔍 修正後の整合性チェックを実行...');
    const finalResult = await integrityChecker.performFullIntegrityCheck();

    console.log('📊 修正後の状態');
    console.log('==============');
    console.log(`総顧客数: ${finalResult.context.totalCustomers}件`);
    console.log(`総履歴数: ${finalResult.context.totalHistoryRecords}件`);
    console.log(`孤立レコード: ${finalResult.context.orphanedRecords}件`);
    console.log(`無効リレーション: ${finalResult.context.invalidRelations}件`);
    console.log(`重複顧客: ${finalResult.context.duplicateCustomers}件\n`);

    // 最終結果
    if (finalResult.context.orphanedRecords === 0 && 
        finalResult.context.invalidRelations === 0 && 
        finalResult.context.duplicateCustomers === 0) {
      console.log('✅ 自動修正完了！データベースは正常になりました。');
    } else {
      console.log('⚠️  一部の問題が残っています。手動での確認が必要です。');
      console.log('   残存問題:');
      if (finalResult.context.orphanedRecords > 0) {
        console.log(`   - 孤立レコード: ${finalResult.context.orphanedRecords}件`);
      }
      if (finalResult.context.invalidRelations > 0) {
        console.log(`   - 無効リレーション: ${finalResult.context.invalidRelations}件`);
      }
      if (finalResult.context.duplicateCustomers > 0) {
        console.log(`   - 重複顧客: ${finalResult.context.duplicateCustomers}件`);
      }
    }

  } catch (error) {
    console.error('❌ 自動修正エラー:', error);
    process.exit(1);
  }
}

// スクリプト実行
main().catch(error => {
  console.error('❌ 予期しないエラー:', error);
  process.exit(1);
}); 