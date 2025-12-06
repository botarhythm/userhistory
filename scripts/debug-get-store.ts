
import { NotionPointsAPI } from '../src/api/notion-points';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function debug() {
    console.log('Debugging getStore...');
    const api = new NotionPointsAPI();

    // Debug helper to spy on behavior? 
    // Actually we can just call it and see result.
    // Ideally we want to see the QUERY it constructs.
    // But NotionPointsAPI is opaque.

    // We can manually query here to compare.
    const dbId = process.env.NOTION_STORE_DB_ID!;
    console.log(`DB ID: ${dbId}`);

    // Check DB Structure
    const db = await api.client.databases.retrieve({ database_id: dbId });
    console.log('DB Props:', Object.keys(db.properties));
    const storeIdProp = Object.values(db.properties).find((p: any) =>
        ['store_id', '店舗ID', 'Store ID'].includes(p.name)
    );
    console.log('Store ID Prop:', storeIdProp);

    if (storeIdProp) {
        // Try Query Manual
        console.log('Trying manual query for store_001...');
        const res = await api.client.databases.query({
            database_id: dbId,
            filter: {
                property: storeIdProp.id, // Use ID usually works best
                title: { equals: 'store_001' }
            } as any
        });
        console.log(`Manual Query Found: ${res.results.length}`);
        if (res.results.length > 0) {
            console.log('First Result Props:', JSON.stringify((res.results[0] as any).properties, null, 2));
        }
    }

    // Try API
    console.log('Calling api.getStore("store_001")...');
    const store = await api.getStore('store_001');
    console.log('Result:', store);
}

debug().catch(console.error);
