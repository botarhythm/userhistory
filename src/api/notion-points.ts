import { Client } from '@notionhq/client';
import { NotionAPI } from './notion.js';
import { PointTransaction, Store, Reward } from '../types/points.js';

export class NotionPointsAPI extends NotionAPI {
    public pointHistoryDbId: string;
    public storeDbId: string;
    public rewardDbId: string;

    constructor() {
        super();
        this.pointHistoryDbId = process.env['NOTION_POINT_HISTORY_DB_ID'] || '';
        this.storeDbId = process.env['NOTION_STORE_DB_ID'] || '';
        this.rewardDbId = process.env['NOTION_REWARD_DB_ID'] || '';

        if (!this.pointHistoryDbId || !this.storeDbId || !this.rewardDbId) {
            console.warn('Point system database IDs are not fully configured in .env');
        }
    }

    // --- Store Methods ---

    // Helper to find property ID by name (case insensitive)
    private getPropId(properties: any, possibleNames: string[]): string {
        for (const name of possibleNames) {
            // Exact match
            if (properties[name]) return name;
            // Case insensitive match
            const key = Object.keys(properties).find(k => k.toLowerCase() === name.toLowerCase());
            if (key) return key;
        }
        // Fallback: return the first name in list to rely on Notion API creating it if missing? 
        // Or null? If we return a name that doesn't exist in 'properties', API might error or create it.
        // Let's return the first candidate as a fallback assumption.
        return possibleNames[0] || '';
    }

    // --- Store Methods ---

    async getStore(storeId: string): Promise<Store | null> {
        try {
            if (!this.storeDbId) return null;

            const dbStructure = await this.getDatabaseStructure(this.storeDbId);
            if (!dbStructure) return null;

            const storeIdProp = this.getPropId(dbStructure.properties, ['store_id', '店舗ID', 'Store ID']);

            const response = await this.client.databases.query({
                database_id: this.storeDbId,
                filter: {
                    property: storeIdProp,
                    title: {
                        equals: storeId
                    }
                }
            });

            if (response.results.length === 0) return null;

            const page = response.results[0] as any;
            return this.mapPageToStore(page, dbStructure.properties);
        } catch (error) {
            console.error('Failed to get store:', error);
            return null;
        }
    }

    private mapPageToStore(page: any, properties: any): Store {
        const getVal = (names: string[], type: string) => {
            const propId = this.getPropId(page.properties, names);
            return this.extractValue(page.properties[propId], type);
        };

        return {
            id: page.id,
            storeId: getVal(['store_id', '店舗ID'], 'title'),
            name: getVal(['name', '店舗名'], 'rich_text'),
            latitude: getVal(['latitude', '緯度'], 'number'),
            longitude: getVal(['longitude', '経度'], 'number'),
            radius: getVal(['radius', '半径'], 'number'),
            qrToken: getVal(['qr_token', 'トークン'], 'rich_text'),
            nfcUrl: getVal(['nfc_url', 'NFC'], 'url'),
            isActive: getVal(['is_active', '有効'], 'checkbox')
        };
    }

    // --- Reward Methods ---

    async getActiveRewards(): Promise<Reward[]> {
        try {
            if (!this.rewardDbId) return [];

            const dbStructure = await this.getDatabaseStructure(this.rewardDbId);
            if (!dbStructure) return [];

            const isActiveProp = this.getPropId(dbStructure.properties, ['is_active', '有効']);
            const orderProp = this.getPropId(dbStructure.properties, ['order', '表示順']);

            const response = await this.client.databases.query({
                database_id: this.rewardDbId,
                filter: {
                    property: isActiveProp,
                    checkbox: {
                        equals: true
                    }
                },
                sorts: [
                    {
                        property: orderProp,
                        direction: 'ascending'
                    }
                ]
            });

            const results = response.results.map(page => this.mapPageToReward(page as any, dbStructure.properties));

            if (results.length === 0) {
                console.warn('[Points] No active rewards found. Debugging schema...');
                try {
                    const debugResponse = await this.client.databases.query({
                        database_id: this.rewardDbId,
                        page_size: 1
                    });
                    if (debugResponse.results.length > 0) {
                        const sampleProps = (debugResponse.results[0] as any).properties;
                        console.log('[Points] Reward DB Schema Keys:', Object.keys(sampleProps).join(', '));
                        console.log('[Points] Sample Page Props:', JSON.stringify(sampleProps, null, 2));
                    } else {
                        console.log('[Points] Reward DB is completely empty.');
                    }
                } catch (e) {
                    console.error('[Points] Failed to debug schema:', e);
                }
            }

            return results;
        } catch (error) {
            console.error('Failed to get rewards:', error);
            return [];
        }
    }

    async getReward(rewardId: string): Promise<Reward | null> {
        try {
            if (!this.rewardDbId) return null;

            const dbStructure = await this.getDatabaseStructure(this.rewardDbId);
            if (!dbStructure) return null;

            const rewardIdProp = this.getPropId(dbStructure.properties, ['reward_id', '特典ID']);

            const response = await this.client.databases.query({
                database_id: this.rewardDbId,
                filter: {
                    property: rewardIdProp,
                    title: {
                        equals: rewardId
                    }
                }
            });

            if (response.results.length === 0) return null;

            return this.mapPageToReward(response.results[0] as any, dbStructure.properties);
        } catch (error) {
            console.error('Failed to get reward:', error);
            return null;
        }
    }

    private mapPageToReward(page: any, properties: any): Reward {
        const getVal = (names: string[]) => {
            const propId = this.getPropId(page.properties, names);
            return this.extractValue(page.properties[propId]);
        };

        // Improved aliases for robust matching
        return {
            id: page.id,
            rewardId: getVal(['reward_id', '特典ID', 'ID', 'id']),
            title: getVal(['title', '特典名', 'name', '名前', 'Display Name']),
            description: getVal(['description', '説明']),
            pointsRequired: getVal(['points_required', '必要ポイント']),
            isRepeatable: getVal(['is_repeatable', '繰り返し可能']),
            order: getVal(['order', '表示順']),
            isActive: getVal(['is_active', '有効'])
        };
    }

    // --- Point Transaction Methods ---

    async getTransactions(customerId: string): Promise<PointTransaction[]> {
        try {
            if (!this.pointHistoryDbId) return [];

            const dbStructure = await this.getDatabaseStructure(this.pointHistoryDbId);
            if (!dbStructure) return [];

            const customerProp = this.getPropId(dbStructure.properties, ['customer', '顧客']);
            const dateProp = this.getPropId(dbStructure.properties, ['date', '日時']);

            const response = await this.client.databases.query({
                database_id: this.pointHistoryDbId,
                filter: {
                    property: customerProp,
                    relation: {
                        contains: customerId
                    }
                },
                sorts: [
                    {
                        property: dateProp,
                        direction: 'descending'
                    }
                ]
            });

            return response.results.map(page => this.mapPageToTransaction(page as any, dbStructure.properties));
        } catch (error) {
            console.error('Failed to get transactions:', error);
            return [];
        }
    }

    private mapPageToTransaction(page: any, properties: any): PointTransaction {
        const getVal = (names: string[], type: string) => {
            const propId = this.getPropId(page.properties, names);
            return this.extractValue(page.properties[propId], type);
        };

        const rewardProp = this.getPropId(page.properties, ['reward', '特典']);

        return {
            id: page.id,
            customerId: '',
            date: getVal(['date', '日時'], 'date'),
            amount: getVal(['amount', 'ポイント数'], 'number'),
            type: getVal(['type', '種類'], 'select'),
            storeId: getVal(['store', '店舗'], 'select'),
            location: getVal(['location', '位置情報'], 'rich_text'),
            deviceId: getVal(['device', '端末情報'], 'rich_text'),
            reason: getVal(['reason', '理由'], 'rich_text'),
            rewardId: page.properties[rewardProp]?.relation?.[0]?.id
        };
    }

    async createPointTransaction(
        customerId: string,
        amount: number,
        type: 'PURCHASE' | 'ADMIN' | 'REWARD',
        details: {
            storeId?: string;
            location?: string;
            deviceId?: string;
            reason?: string;
            rewardId?: string;
        }
    ): Promise<string> {
        try {
            if (!this.pointHistoryDbId) throw new Error('Point History DB ID not set');

            const dbStructure = await this.getDatabaseStructure(this.pointHistoryDbId);
            if (!dbStructure) throw new Error('Failed to get DB structure');

            const customerProp = this.getPropId(dbStructure.properties, ['customer', '顧客']);
            const dateProp = this.getPropId(dbStructure.properties, ['date', '日時']);
            const amountProp = this.getPropId(dbStructure.properties, ['amount', 'ポイント数']);
            const typeProp = this.getPropId(dbStructure.properties, ['type', '種類']);
            const storeProp = this.getPropId(dbStructure.properties, ['store', '店舗']);
            const locationProp = this.getPropId(dbStructure.properties, ['location', '位置情報']);
            const deviceProp = this.getPropId(dbStructure.properties, ['device', '端末情報']);
            const reasonProp = this.getPropId(dbStructure.properties, ['reason', '理由']);
            const rewardProp = this.getPropId(dbStructure.properties, ['reward', '特典']);
            const titleProp = this.getPropId(dbStructure.properties, ['ID', 'id']);

            const properties: any = {
                [titleProp]: {
                    title: [{ text: { content: crypto.randomUUID() } }]
                },
                [customerProp]: {
                    relation: [{ id: customerId }]
                },
                [dateProp]: {
                    date: { start: new Date().toISOString() }
                },
                [amountProp]: {
                    number: amount
                },
                [typeProp]: {
                    select: { name: type }
                }
            };

            if (details.storeId) {
                properties[storeProp] = { select: { name: details.storeId } };
            }
            if (details.location) {
                properties[locationProp] = { rich_text: [{ text: { content: details.location } }] };
            }
            if (details.deviceId) {
                properties[deviceProp] = { rich_text: [{ text: { content: details.deviceId } }] };
            }
            if (details.reason) {
                properties[reasonProp] = { rich_text: [{ text: { content: details.reason } }] };
            }
            if (details.rewardId) {
                properties[rewardProp] = { relation: [{ id: details.rewardId }] };
            }

            const response = await this.client.pages.create({
                parent: { database_id: this.pointHistoryDbId },
                properties
            });

            // Update Customer Totals
            await this.updateCustomerPointTotals(customerId, amount);

            return response.id;
        } catch (error) {
            console.error('Failed to create point transaction:', error);
            throw error;
        }
    }

    async updateCustomerPointTotals(customerId: string, amountChange: number): Promise<void> {
        try {
            // Retrieve current customer data
            const customerPage = await this.client.pages.retrieve({ page_id: customerId }) as any;
            const props = customerPage.properties;

            const getPropValue = (names: string[]) => {
                const propId = this.getPropId(props, names);
                return props[propId]?.number || 0;
            };

            const totalProp = this.getPropId(props, ['total_points', '総獲得ポイント']);
            const currentProp = this.getPropId(props, ['current_points', '現在ポイント']);
            const usedProp = this.getPropId(props, ['used_points', '使用ポイント']);
            const visitProp = this.getPropId(props, ['visit_count', '来店回数']);
            const lastVisitProp = this.getPropId(props, ['last_visit_date', '最終来店日']);

            let currentTotal = getPropValue(['total_points', '総獲得ポイント']);
            let currentAvailable = getPropValue(['current_points', '現在ポイント']);
            let currentUsed = getPropValue(['used_points', '使用ポイント']);
            let visitCount = getPropValue(['visit_count', '来店回数']);

            if (amountChange > 0) {
                currentTotal += amountChange;
                currentAvailable += amountChange;
                visitCount += 1;
            } else {
                currentAvailable += amountChange;
                currentUsed += Math.abs(amountChange);
            }

            // Update
            await this.client.pages.update({
                page_id: customerId,
                properties: {
                    [totalProp]: { number: currentTotal },
                    [currentProp]: { number: currentAvailable },
                    [usedProp]: { number: currentUsed },
                    [visitProp]: { number: visitCount },
                    [lastVisitProp]: { date: { start: new Date().toISOString() } }
                }
            });

        } catch (error) {
            console.error('Failed to update customer totals:', error);
        }
    }

    async getCustomer(lineUserId: string): Promise<any | null> {
        try {
            const customer = await this.findCustomerByLineUid(lineUserId);
            if (!customer) return null;

            if (!this.customerDatabaseId) return null;
            const dbStructure = await this.getDatabaseStructure(this.customerDatabaseId);
            if (!dbStructure) return null;

            const lineUidProp = this.getPropId(dbStructure.properties, ['LINE UID', 'LineUid']);

            const response = await this.client.databases.query({
                database_id: this.customerDatabaseId,
                filter: {
                    property: lineUidProp,
                    rich_text: {
                        equals: lineUserId
                    }
                }
            });

            if (response.results.length === 0) return null;
            const page = response.results[0] as any;
            const props = page.properties;

            const getVal = (names: string[], type: 'title' | 'rich_text' | 'number') => {
                const propId = this.getPropId(props, names);
                return this.extractValue(props[propId], type);
            };

            return {
                id: page.id,
                displayName: getVal(['表示名', 'Display Name'], 'title') || 'No Name',
                lineUid: lineUserId,
                currentPoints: getVal(['current_points', '現在ポイント'], 'number') || 0,
                totalPoints: getVal(['total_points', '総獲得ポイント'], 'number') || 0
            };

        } catch (error) {
            console.error('Get customer error:', error);
            return null;
        }
    }

    async getAllCustomers(): Promise<any[]> {
        try {
            if (!this.customerDatabaseId) return [];

            // Fetch to get properties if needed, or just query.
            // Query returns pages, we can just inspect properties on pages.

            const response = await this.client.databases.query({
                database_id: this.customerDatabaseId,
                sorts: [
                    {
                        timestamp: 'last_edited_time',
                        direction: 'descending'
                    }
                ]
            });

            return response.results.map((page: any) => {
                const props = page.properties;
                const getVal = (names: string[], type: 'title' | 'rich_text' | 'number' | 'date') => {
                    const propId = this.getPropId(props, names);
                    return this.extractValue(props[propId], type);
                };

                return {
                    id: page.id,
                    displayName: getVal(['表示名', 'Display Name'], 'title') || 'No Name',
                    lineUid: getVal(['LINE UID'], 'rich_text') || '',
                    currentPoints: getVal(['current_points', '現在ポイント'], 'number') || 0,
                    totalPoints: getVal(['total_points', '総獲得ポイント'], 'number') || 0,
                    lastVisit: getVal(['last_visit_date', '最終来店日'], 'date') || ''
                };
            });
        } catch (error) {
            console.error('Failed to fetch all customers:', error);
            return [];
        }
    }

    // Helper to extract values safely
    private extractValue(prop: any, _typeHint?: string): any {
        if (!prop) return null;
        // Use the actual property type from Notion response
        const type = prop.type;
        switch (type) {
            case 'title': return prop.title?.[0]?.text?.content || '';
            case 'rich_text': return prop.rich_text?.[0]?.text?.content || '';
            case 'number': return prop.number || 0;
            case 'checkbox': return prop.checkbox || false;
            case 'url': return prop.url || '';
            case 'select': return prop.select?.name || '';
            case 'date': return prop.date?.start || '';
            // Backward compatibility for mapped 'relation' if needed (usually handled by caller accessing .relation)
            default: return null;
        }
    }
}

