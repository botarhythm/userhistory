import { Client } from '@notionhq/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
console.log('Current working directory:', process.cwd());
if (fs.existsSync('.env')) {
    console.log('✅ .env file found');
} else {
    console.error('❌ .env file NOT found in current directory');
}

dotenv.config();

const apiKey = process.env['NOTION_API_KEY'];
const customerDbId = process.env['NOTION_CUSTOMER_DB_ID'];

if (!apiKey) {
    console.error('Error: NOTION_API_KEY must be set in .env');
    process.exit(1);
}

const notion = new Client({ auth: apiKey });

async function checkBotIdentity() {
    try {
        const me = await notion.users.me({});
        console.log('🤖 Current Bot Identity:', me.name);
        return me.name;
    } catch (error) {
        console.error('Error fetching bot identity:', error);
        return null;
    }
}

async function listDatabases() {
    console.log('🔍 NOTION_CUSTOMER_DB_ID not found in .env');
    console.log('Listing accessible databases to help you find it...');
    try {
        const response = await notion.search({
            filter: {
                value: 'database',
                property: 'object'
            }
        });

        if (response.results.length === 0) {
            console.log('⚠️ No databases found. Please share your Notion database with the integration.');
        } else {
            console.log('\nAvailable Databases:');
            response.results.forEach((db: any) => {
                const title = db.title?.[0]?.plain_text || 'Untitled';
                console.log(`- [${title}] ID: ${db.id}`);
            });
            console.log('\nPlease copy the ID of your Customer Database and add it to .env as NOTION_CUSTOMER_DB_ID');
        }
    } catch (error: any) {
        console.error('Error listing databases:', error.body || error);
    }
}

async function createDatabases(parentId: string) {
    console.log(`Using parent ID: ${parentId}`);

    try {
        // 1. Create Point History Database
        console.log('Creating Point History Database...');
        const pointHistoryDb = await notion.databases.create({
            parent: { page_id: parentId },
            title: [{ type: 'text', text: { content: 'Botarhythm Point History' } }],
            properties: {
                'ID': { title: {} },
                'customer': { relation: { database_id: customerDbId!, type: 'dual_property', dual_property: {} } },
                'date': { date: {} },
                'amount': { number: { format: 'number' } },
                'type': {
                    select: {
                        options: [
                            { name: 'PURCHASE', color: 'blue' },
                            { name: 'ADMIN', color: 'orange' },
                            { name: 'REWARD', color: 'purple' }
                        ]
                    }
                },
                'store': { select: {} },
                'location': { rich_text: {} },
                'device': { rich_text: {} },
                'reason': { rich_text: {} },
            }
        });
        console.log(`✅ Created Point History DB: ${pointHistoryDb.id}`);

        // 2. Create Store Master Database
        console.log('Creating Store Master Database...');
        const storeMasterDb = await notion.databases.create({
            parent: { page_id: parentId },
            title: [{ type: 'text', text: { content: 'Botarhythm Store Master' } }],
            properties: {
                'store_id': { title: {} },
                'name': { rich_text: {} },
                'latitude': { number: { format: 'number' } },
                'longitude': { number: { format: 'number' } },
                'radius': { number: { format: 'number' } },
                'qr_token': { rich_text: {} },
                'nfc_url': { url: {} },
                'is_active': { checkbox: {} }
            }
        });
        console.log(`✅ Created Store Master DB: ${storeMasterDb.id}`);

        // 3. Create Reward Master Database
        console.log('Creating Reward Master Database...');
        const rewardMasterDb = await notion.databases.create({
            parent: { page_id: parentId },
            title: [{ type: 'text', text: { content: 'Botarhythm Reward Master' } }],
            properties: {
                'reward_id': { title: {} },
                'title': { rich_text: {} },
                'description': { rich_text: {} },
                'points_required': { number: { format: 'number' } },
                'is_repeatable': { checkbox: {} },
                'order': { number: { format: 'number' } },
                'is_active': { checkbox: {} }
            }
        });
        console.log(`✅ Created Reward Master DB: ${rewardMasterDb.id}`);

        // 4. Update Point History to add relation to Reward Master
        console.log('Updating Point History DB with Reward relation...');
        await notion.databases.update({
            database_id: pointHistoryDb.id,
            properties: {
                'reward': { relation: { database_id: rewardMasterDb.id, type: 'dual_property', dual_property: {} } }
            }
        });
        console.log('✅ Updated Point History DB relation');

        // 5. Update Customer DB with new properties
        console.log('Updating Customer Database schema...');
        await notion.databases.update({
            database_id: customerDbId!,
            properties: {
                'total_points': { number: { format: 'number' } },
                'current_points': { number: { format: 'number' } },
                'used_points': { number: { format: 'number' } },
                'last_visit_date': { date: {} },
                'visit_count': { number: { format: 'number' } }
            }
        });
        console.log('✅ Updated Customer DB schema');

        console.log('\n🎉 Setup Complete! Please update your .env file with the following IDs:');
        console.log(`NOTION_POINT_HISTORY_DB_ID=${pointHistoryDb.id}`);
        console.log(`NOTION_STORE_DB_ID=${storeMasterDb.id}`);
        console.log(`NOTION_REWARD_DB_ID=${rewardMasterDb.id}`);

    } catch (error: any) {
        console.error('❌ Error during database creation:', error.body || error);
    }
}

async function setupDatabases() {
    const botName = await checkBotIdentity();

    if (!customerDbId) {
        await listDatabases();
        return;
    }

    try {
        console.log('🔍 Retrieving existing Customer Database...');
        const customerDb = await notion.databases.retrieve({ database_id: customerDbId! });

        // @ts-ignore
        const parentId = customerDb.parent.type === 'page_id' ? customerDb.parent.page_id : null;

        if (!parentId) {
            console.log('🔍 Searching for "Botarhythm System" page to use as parent...');

            const response = await notion.search({
                query: 'Botarhythm System',
                filter: {
                    value: 'page',
                    property: 'object'
                }
            });

            const targetPage = response.results.find((page: any) => {
                const title = page.properties?.title?.title?.[0]?.plain_text ||
                    page.properties?.Name?.title?.[0]?.plain_text;
                // Check for exact match or contains
                return title && title.includes('Botarhythm System');
            });

            if (targetPage) {
                console.log(`✅ Found "Botarhythm System" page: ${targetPage.id}`);
                await createDatabases(targetPage.id);
                return;
            } else {
                console.error('❌ Could not find a page named "Botarhythm System".');
                console.log('Please create a Page named "Botarhythm System" in Notion and share it with the integration.');

                // List pages just in case
                console.log('Listing accessible Pages for reference:');
                if (response.results.length > 0) {
                    response.results.forEach((page: any) => {
                        const title = page.properties?.title?.title?.[0]?.plain_text ||
                            page.properties?.Name?.title?.[0]?.plain_text ||
                            'Untitled';
                        console.log(`- [${title}] ID: ${page.id}`);
                    });
                }
                process.exit(1);
            }
        } else {
            console.log(`✅ Found parent page ID from Customer DB: ${parentId}`);
            await createDatabases(parentId);
        }

    } catch (error: any) {
        console.error('❌ Error during setup:', error.body || error);
    }
}

setupDatabases();
