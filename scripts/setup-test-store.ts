import 'dotenv/config';
import { NotionPointsAPI } from '../src/api/notion-points.js';

async function setupTestStore() {
    const api = new NotionPointsAPI();

    if (!api.storeDbId) {
        console.error('NOTION_STORE_DB_ID is not set');
        process.exit(1);
    }

    console.log('Checking for existing test store...');
    const existingStore = await api.getStore('test-store-001');

    if (existingStore) {
        console.log('Test store already exists:');
        console.log(JSON.stringify(existingStore, null, 2));
        return;
    }

    console.log('Creating new test store...');

    // We need to get the DB structure to know property names/ids if we want to be robust,
    // but for creation we usually need to specify property names that match the schema.
    // The schema was defined in setup-notion-db.ts.
    // Let's assume standard names or fetch structure.

    const dbStructure = await api.getDatabaseStructure(api.storeDbId);
    if (!dbStructure) {
        console.error('Failed to get store DB structure');
        process.exit(1);
    }

    // Helper to find prop name by type/name
    const getPropName = (type: string, nameHint: string) => {
        const found = Object.entries(dbStructure.properties).find(([key, val]: [string, any]) =>
            val.type === type && key.toLowerCase().includes(nameHint.toLowerCase())
        );
        return found ? found[0] : null;
    };

    const nameProp = getPropName('rich_text', 'name') || 'Name';
    const storeIdProp = getPropName('title', 'store_id') || 'Store ID';
    const latProp = getPropName('number', 'latitude') || 'Latitude';
    const lngProp = getPropName('number', 'longitude') || 'Longitude';
    const radiusProp = getPropName('number', 'radius') || 'Radius';
    const qrTokenProp = getPropName('rich_text', 'qr_token') || 'QR Token';
    const isActiveProp = getPropName('checkbox', 'is_active') || 'Is Active';

    try {
        const response = await api.client.pages.create({
            parent: { database_id: api.storeDbId },
            properties: {
                [storeIdProp]: {
                    title: [{ text: { content: 'test-store-001' } }]
                },
                [nameProp]: {
                    rich_text: [{ text: { content: 'Test Store Tokyo' } }]
                },
                [latProp]: {
                    number: 35.681236
                },
                [lngProp]: {
                    number: 139.767125
                },
                [radiusProp]: {
                    number: 100
                },
                [qrTokenProp]: {
                    rich_text: [{ text: { content: 'test-qr-token-123' } }]
                },
                [isActiveProp]: {
                    checkbox: true
                }
            }
        });

        console.log('Test store created successfully!');
        console.log('ID:', response.id);
        console.log('Store ID: test-store-001');
        console.log('QR Token: test-qr-token-123');

    } catch (error) {
        console.error('Failed to create test store:', error);
        process.exit(1);
    }
}

setupTestStore();
