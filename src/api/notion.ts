import { Client } from '@notionhq/client';

console.log('NOTION_API_KEY:', process.env.NOTION_API_KEY);
console.log('NOTION_DATABASE_ID:', process.env.NOTION_DATABASE_ID);
console.log('NOTION_CUSTOMER_DATABASE_ID:', process.env.NOTION_CUSTOMER_DATABASE_ID);

if (!process.env.NOTION_API_KEY || !process.env.NOTION_CUSTOMER_DATABASE_ID || !process.env.NOTION_DATABASE_ID) {
  console.error('Notionの環境変数が正しく設定されていません。');
  process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_API_KEY! });

(async () => {
  const db = await notion.databases.retrieve({ database_id: process.env.NOTION_DATABASE_ID! });
  console.log('履歴DBのプロパティ一覧:', Object.keys(db.properties));
})();

/**
 * LINEユーザーIDを元に顧客DBを検索または新規作成し、NotionのページIDを返す
 */
export const findOrCreateCustomer = async (lineUserId: string, lineDisplayName: string): Promise<string> => {
  const searchResponse = await notion.databases.query({
    database_id: process.env.NOTION_CUSTOMER_DATABASE_ID!,
    filter: {
      property: 'LINE UID',
      rich_text: { equals: lineUserId },
    },
  });
  if (searchResponse.results.length > 0) {
    // 既存レコードがあれば「表示名」を上書き
    const pageId = searchResponse.results[0].id;
    await notion.pages.update({
      page_id: pageId,
      properties: {
        '表示名': { title: [{ text: { content: lineDisplayName } }] },
      },
    });
    return pageId;
  }
  // 新規作成
  const createResponse = await notion.pages.create({
    parent: { database_id: process.env.NOTION_CUSTOMER_DATABASE_ID! },
    properties: {
      '表示名': { title: [{ text: { content: lineDisplayName } }] },
      'LINE UID': { rich_text: [{ text: { content: lineUserId } }] },
      '登録日': { date: { start: new Date().toISOString() } },
    },
  });
  return createResponse.id;
};

/**
 * 購入履歴をNotionに記録する
 */
export const recordPurchase = async (customerPageId: string, itemName: string, memo: string) => {
  return notion.pages.create({
    parent: { database_id: process.env.NOTION_DATABASE_ID! },
    properties: {
      '商品名': { title: [{ text: { content: itemName } }] },
      'メモ': { rich_text: [{ text: { content: memo } }] },
      '日時': { date: { start: new Date().toISOString() } },
      '関連顧客ID': { relation: [{ id: customerPageId }] }
    },
  });
};

/**
 * 指定した顧客の購入履歴をNotionから取得する
 */
export const getHistory = async (customerPageId: string) => {
  const response = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID!,
    filter: {
      property: '関連顧客ID',
      relation: { contains: customerPageId },
    },
    sorts: [{ property: '日時', direction: 'descending' }],
  });

  return response.results.map((page: any) => ({
    id: page.id,
    itemName: page.properties['商品名']?.title?.[0]?.plain_text || '',
    memo: page.properties['メモ']?.rich_text?.[0]?.plain_text || '',
    date: page.properties['日時']?.date?.start || '',
  }));
};

export const getProductList = async (): Promise<string[]> => {
  const response = await notion.databases.query({
    database_id: process.env.NOTION_PRODUCT_DATABASE_ID!,
    filter: {
      property: '販売中',
      checkbox: { equals: true }
    },
    sorts: [{ property: '表示順', direction: 'ascending' }],
  });
  return response.results.map((page: any) =>
    page.properties['商品名']?.title?.[0]?.plain_text?.trim() || ''
  ).filter((name: string) => !!name);
};
