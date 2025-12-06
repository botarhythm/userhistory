
import { Client } from '@notionhq/client';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const NOTION_KEY = process.env.NOTION_API_KEY as string;
const DB_ID = process.env.NOTION_REWARD_DB_ID as string;

if (!NOTION_KEY || !DB_ID) {
    console.error('Missing NOTION_API_KEY or NOTION_REWARD_DB_ID');
    process.exit(1);
}

const client = new Client({ auth: NOTION_KEY });

async function setupRewards() {
    console.log('🚀 Starting Notion Reward Setup...');
    console.log(`Target Database ID: ${DB_ID}`);

    // 1. Update Schema (Ensure Properties Exist)
    console.log('\n[1/3] Verifying Schema...');
    let db = await client.databases.retrieve({ database_id: DB_ID });

    console.log('--- Current Database Schema ---');
    Object.entries(db.properties).forEach(([key, val]: [string, any]) => {
        console.log(`  ${key}: [${val.type}] (ID: ${val.id})`);
    });
    console.log('-------------------------------');

    let props = db.properties;

    // 1.5 Check for Name/ID Collision on 'title'
    // If we have a property named 'title' (RichText) and 'reward_id' uses ID 'title', it clashes.
    // We check if property named 'title' exists.
    const titlePropObj = Object.values(props).find((p: any) => p.name === 'title');
    if (titlePropObj) {
        console.log('  ⚠️ Detected property named "title". Renaming to "Display Name" to avoid potential ID collision...');
        try {
            await client.databases.update({
                database_id: DB_ID,
                properties: {
                    'title': { name: 'Display Name' }
                }
            });
            console.log('  ✅ Renamed successfully.');
            // Refresh DB Schema
            db = await client.databases.retrieve({ database_id: DB_ID });
            props = db.properties;
        } catch (e) {
            console.error('  ❌ Rename failed:', e);
            // Continue anyway, maybe it won't crash if we are lucky
        }
    }

    const requiredProps = {
        'reward_id': { type: 'rich_text', name: 'reward_id' },
        'points_required': { type: 'number', name: 'points_required' },
        'is_active': { type: 'checkbox', name: 'is_active' },
        'is_repeatable': { type: 'checkbox', name: 'is_repeatable' },
        'order': { type: 'number', name: 'order' },
        'description': { type: 'rich_text', name: 'description' }
    };

    const updatePayload: any = { properties: {} };
    let needsUpdate = false;

    // Helper to find prop by type/name fuzzily
    const findProp = (key: string) => {
        return Object.values(props).find((p: any) => p.name === key || p.name === requiredProps[key as keyof typeof requiredProps].name);
    };

    for (const [key, config] of Object.entries(requiredProps)) {
        const existing = findProp(key);
        if (!existing) {
            // If key is 'reward_id', verify it doesn't exist as title?
            // Assuming findProp checks name.
            console.log(`  ➕ Adding missing property: ${config.name} (${config.type})`);
            updatePayload.properties[config.name] = { [config.type]: {} };
            needsUpdate = true;
        } else {
            console.log(`  ✅ Property exists: ${existing.name}`);
        }
    }

    if (needsUpdate) {
        console.log('  Applying schema updates...');
        await client.databases.update({
            database_id: DB_ID,
            properties: updatePayload.properties
        });
        console.log('  Schema updated.');
        // Refresh again
        db = await client.databases.retrieve({ database_id: DB_ID });
        props = db.properties;
    } else {
        console.log('  Schema is up to date.');
    }

    // 2. Upsert Data
    console.log('\n[2/3] Upserting Reward Data...');

    // Define Initial Rewards
    const rewards = [
        {
            title: 'コーヒー1杯 無料券',
            id: 'reward_coffee',
            points: 10,
            desc: '美味しいコーヒーをプレゼント',
            order: 1
        },
        {
            title: 'コーヒー豆100g プレゼント',
            id: 'reward_beans',
            points: 30,
            desc: 'お好きなコーヒー豆100g',
            order: 2
        }
    ];

    // Check existing
    const existingPages = await client.databases.query({
        database_id: DB_ID,
    });

    // Helper to get text content from property
    const getText = (page: any, propName: string) => {
        const prop = page.properties[propName];
        if (!prop) return '';
        return prop.rich_text?.[0]?.text?.content || prop.title?.[0]?.text?.content || '';
    };

    // Helper to request safe type
    const getPropType = (key: string) => {
        const p = Object.values(props).find((p: any) => p.name === key);
        return p?.type || 'rich_text';
    };

    const rewardIdType = getPropType('reward_id');
    // We expect 'Display Name' if rename succeeded, or 'title' if failed/not deemed necessary
    const titleKey = Object.values(props).find((p: any) => p.name === 'Display Name' || p.name === 'title' || p.name === 'Name')?.name || 'title';
    const titleType = getPropType(titleKey);

    console.log(`  ℹ️ 'reward_id' type: ${rewardIdType}`);
    console.log(`  ℹ️ Display Field Key: '${titleKey}' (Type: ${titleType})`);

    for (const reward of rewards) {
        const exists = existingPages.results.find((p: any) => {
            const prop = p.properties['reward_id'];
            if (!prop) return false;
            const content = prop.rich_text?.[0]?.text?.content || prop.title?.[0]?.text?.content || '';
            return content === reward.id;
        });

        if (exists) {
            console.log(`  Skipping ${reward.title} (Already exists)`);
        } else {
            console.log(`  ✨ Creating ${reward.title} (ID: ${reward.id}) to DB ${DB_ID}...`);

            const properties: any = {
                'points_required': { number: reward.points },
                'is_active': { checkbox: true },
                'is_repeatable': { checkbox: true },
                'order': { number: reward.order },
                'description': { rich_text: [{ text: { content: reward.desc } }] }
            };

            // Handle reward_id
            if (rewardIdType === 'title') {
                properties['reward_id'] = { title: [{ text: { content: reward.id } }] };
            } else {
                properties['reward_id'] = { rich_text: [{ text: { content: reward.id } }] };
            }

            // Handle Display Name
            if (titleType === 'title') {
                properties[titleKey] = { title: [{ text: { content: reward.title } }] };
            } else {
                properties[titleKey] = { rich_text: [{ text: { content: reward.title } }] };
            }

            await client.pages.create({
                parent: { database_id: DB_ID },
                properties
            });
        }
    }

    console.log('\n[3/3] Setup Complete! 🎉');
}

setupRewards().catch(console.error);
