import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const dbId = process.env.NOTION_CUSTOMER_DB_ID;

async function inspectSchema() {
    if (!dbId) {
        console.error('NOTION_CUSTOMER_DB_ID not set');
        return;
    }
    console.log(`Inspecting DB: ${dbId}`);
    try {
        const response = await notion.databases.retrieve({ database_id: dbId });
        console.log('DB Title:', (response as any).title?.[0]?.plain_text);
        console.log('Properties:');
        for (const [name, prop] of Object.entries(response.properties)) {
            console.log(`- ${name}: Type=${(prop as any).type}, ID=${prop.id}`);
            if ((prop as any).type === 'formula') {
                console.log(`  Formula expression:`, (prop as any).formula);
            }
        }
    } catch (e) {
        console.error(e);
    }
}

inspectSchema();
