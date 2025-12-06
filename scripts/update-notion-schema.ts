import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

dotenv.config();

const notionApiKey = process.env['NOTION_API_KEY'];
const pointHistoryDbId = process.env['NOTION_POINT_HISTORY_DB_ID'];
const customerDbId = process.env['NOTION_CUSTOMER_DB_ID'];
const rewardDbId = process.env['NOTION_REWARD_DB_ID'];

if (!notionApiKey || !pointHistoryDbId || !customerDbId || !rewardDbId) {
    console.error('Missing required environment variables in .env');
    process.exit(1);
}

// 型ガードで型を確定
const apiKey: string = notionApiKey;
const historyDbId: string = pointHistoryDbId;
const custDbId: string = customerDbId;
const rewDbId: string = rewardDbId;

const notion = new Client({ auth: apiKey });

async function updateSchema() {
    console.log(`Updating Point History DB: ${historyDbId}`);

    try {
        const response = await notion.databases.update({
            database_id: historyDbId,
            properties: {
                'store': {
                    select: {}
                },
                'location': {
                    rich_text: {}
                },
                'device': {
                    rich_text: {}
                },
                'reason': {
                    rich_text: {}
                },
                'type': {
                    select: {}
                },
                'amount': {
                    number: {
                        format: 'number'
                    }
                },
                'date': {
                    date: {}
                },
                'customer': {
                    relation: {
                        database_id: custDbId,
                        type: 'dual_property',
                        dual_property: {}
                    }
                },
                'reward': {
                    relation: {
                        database_id: rewDbId,
                        type: 'dual_property',
                        dual_property: {}
                    }
                }
            }
        });
        console.log('Schema updated successfully!');
        console.log(JSON.stringify(response.properties, null, 2));
    } catch (error: any) {
        console.error('Failed to update schema:', error.body || error);
    }
}

updateSchema();
