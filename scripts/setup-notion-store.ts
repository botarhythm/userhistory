
import { Client } from '@notionhq/client';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const NOTION_KEY = process.env.NOTION_API_KEY as string;
const DB_ID = process.env.NOTION_STORE_DB_ID as string;

if (!NOTION_KEY || !DB_ID) {
    console.error('Missing NOTION_API_KEY or NOTION_STORE_DB_ID');
    process.exit(1);
}

const client = new Client({ auth: NOTION_KEY });

async function setupStore() {
    console.log('🚀 Starting Notion Store Setup...');
    console.log(`Target Database ID: ${DB_ID}`);

    // 1. Update Schema Check
    console.log('\n[1/3] Verifying Schema...');
    const db = await client.databases.retrieve({ database_id: DB_ID });

    // Log schema for debug
    Object.entries(db.properties).forEach(([key, val]: [string, any]) => {
        console.log(`  ${key}: [${val.type}]`);
    });

    const props = db.properties;

    // Define Target Store
    const targetStore = {
        name: 'Botarhythm Coffee Roaster',
        id: 'store_001', // Prod ID
        lat: 34.96068108513542,
        lon: 139.95781847924133,
        radius: 100, // Allowed radius in meters
        isActive: true,
        qrToken: 'bota-prod-token-2024' // Fixed token for prod
    };

    // Find if exists
    const existing = await client.databases.query({
        database_id: DB_ID,
    });

    // Helper to get text
    const getText = (page: any, key: string) => {
        const p = Object.values(page.properties).find((p: any) => p.name === key) as any;
        return p?.rich_text?.[0]?.text?.content || p?.title?.[0]?.text?.content || '';
    };

    const exists = existing.results.find((p: any) => getText(p, 'store_id') === targetStore.id);

    if (exists) {
        console.log(`\n  ✅ Store ${targetStore.name} exists. Updating coordinates...`);
        // We update it to ensure coords are correct

        // Find property IDs
        const findPropId = (name: string) => Object.values(props).find((p: any) => p.name === name)?.id;

        const updateProps: any = {};

        // Helper to add update if prop exists
        const addUpdate = (name: string, val: any) => {
            const pid = findPropId(name);
            if (pid) updateProps[pid] = val;
        };

        addUpdate('latitude', { number: targetStore.lat });
        addUpdate('longitude', { number: targetStore.lon });
        addUpdate('radius', { number: targetStore.radius });
        addUpdate('is_active', { checkbox: targetStore.isActive });
        addUpdate('qr_token', { rich_text: [{ text: { content: targetStore.qrToken } }] });

        await client.pages.update({
            page_id: exists.id,
            properties: updateProps
        });
        console.log('  Updated successfully.');

    } else {
        console.log(`\n  ✨ Creating Store ${targetStore.name}...`);

        // Construct properties map dynamically based on names
        const findPropName = (key: string) => Object.values(props).find((p: any) => p.name === key)?.name;

        // Fallback names
        const nameProp = findPropName('name') || 'Name'; // Title
        const idProp = findPropName('store_id') || 'store_id';
        const latProp = findPropName('latitude') || 'latitude';
        const lonProp = findPropName('longitude') || 'longitude';
        const radProp = findPropName('radius') || 'radius';
        const tokenProp = findPropName('qr_token') || 'qr_token';
        const activeProp = findPropName('is_active') || 'is_active';

        const newProps: any = {
            [nameProp]: { rich_text: [{ text: { content: targetStore.name } }] },
            [idProp]: { title: [{ text: { content: targetStore.id } }] },
            [latProp]: { number: targetStore.lat },
            [lonProp]: { number: targetStore.lon },
            [radProp]: { number: targetStore.radius },
            [tokenProp]: { rich_text: [{ text: { content: targetStore.qrToken } }] },
            [activeProp]: { checkbox: targetStore.isActive }
        };

        await client.pages.create({
            parent: { database_id: DB_ID },
            properties: newProps
        });
        console.log('  Created successfully.');
    }

    console.log('\nSetup Complete.');
}

setupStore().catch(console.error);
