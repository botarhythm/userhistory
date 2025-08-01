#!/usr/bin/env node

import { DatabaseIntegrityChecker } from '../src/utils/db-integrity-checker.js';
import dotenv from 'dotenv';

// 環境変数を読み込み
dotenv.config();

async function main() {
  console.log('🔍 Botarhythm Coffee Roaster データベース整合性チェック');
  console.log('==================================================\n');

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

    // 結果を表示
    console.log('📊 整合性チェック結果');
    console.log('====================');
    console.log(`総顧客数: ${result.context.totalCustomers}件`);
    console.log(`総履歴数: ${result.context.totalHistoryRecords}件`);
    console.log(`孤立レコード: ${result.context.orphanedRecords}件`);
    console.log(`無効リレーション: ${result.context.invalidRelations}件`);
    console.log(`重複顧客: ${result.context.duplicateCustomers}件\n`);

    // 問題がある場合の詳細表示
    if (result.context.orphanedRecords > 0) {
      console.log('⚠️  孤立した履歴レコード:');
      result.details.orphanedHistoryIds.forEach(id => {
        console.log(`   - ${id}`);
      });
      console.log('');
    }

    if (result.context.invalidRelations > 0) {
      console.log('⚠️  無効なリレーション:');
      result.details.invalidRelationIds.forEach(id => {
        console.log(`   - ${id}`);
      });
      console.log('');
    }

    if (result.context.duplicateCustomers > 0) {
      console.log('⚠️  重複するLINE UID:');
      result.details.duplicateLineUids.forEach(uid => {
        console.log(`   - ${uid}`);
      });
      console.log('');
    }

    if (result.details.customersWithoutHistory.length > 0) {
      console.log('ℹ️  履歴のない顧客:');
      result.details.customersWithoutHistory.forEach(id => {
        console.log(`   - ${id}`);
      });
      console.log('');
    }

    // 推奨アクション
    console.log('🎯 推奨アクション');
    console.log('===============');
    console.log(result.ai_todo);
    console.log('');

    // 問題がない場合
    if (result.context.orphanedRecords === 0 && 
        result.context.invalidRelations === 0 && 
        result.context.duplicateCustomers === 0) {
      console.log('✅ データベースは正常です！');
    } else {
      console.log('🔧 修正が必要な項目があります。');
      console.log('   手動での確認と修正を推奨します。');
    }

    console.log('\n📝 詳細情報');
    console.log('==========');
    console.log(result.human_note);

  } catch (error) {
    console.error('❌ 整合性チェックエラー:', error);
    process.exit(1);
  }
}

// スクリプト実行
main().catch(error => {
  console.error('❌ 予期しないエラー:', error);
  process.exit(1);
}); 