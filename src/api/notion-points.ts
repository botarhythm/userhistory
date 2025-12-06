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

    async getStore(storeId: string): Promise<Store | null> {
        try {
            if (!this.storeDbId) return null;

            const dbStructure = await this.getDatabaseStructure(this.storeDbId);
            if (!dbStructure) return null;

            const storeIdProp = this.getPropertyName(dbStructure.properties, 'title') || 'store_id';

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
        // Helper to find prop by name (case insensitive) or type
        const getProp = (name: string, type: string) => {
            // 1. Try exact match
            if (page.properties[name]) return page.properties[name];
            // 2. Try case insensitive match
            const key = Object.keys(page.properties).find(k => k.toLowerCase() === name.toLowerCase());
            if (key) return page.properties[key];
            // 3. Fallback to type (using parent method if needed, but avoiding for now to prevent collisions)
            // If we really want to fallback, we should use getPropertyName but it's risky.
            // Let's assume the names are correct as per setup script.
            return null;
        };

        return {
            id: page.id,
            storeId: this.extractValue(getProp('store_id', 'title'), 'title'),
            name: this.extractValue(getProp('name', 'rich_text'), 'rich_text'),
            latitude: this.extractValue(getProp('latitude', 'number'), 'number'),
            longitude: this.extractValue(getProp('longitude', 'number'), 'number'),
            radius: this.extractValue(getProp('radius', 'number'), 'number'),
            qrToken: this.extractValue(getProp('qr_token', 'rich_text'), 'rich_text'),
            nfcUrl: this.extractValue(getProp('nfc_url', 'url'), 'url'),
            isActive: this.extractValue(getProp('is_active', 'checkbox'), 'checkbox')
        };
    }

    // --- Reward Methods ---

    async getActiveRewards(): Promise<Reward[]> {
        try {
            if (!this.rewardDbId) return [];

            const dbStructure = await this.getDatabaseStructure(this.rewardDbId);
            if (!dbStructure) return [];

            const isActiveProp = this.getPropertyName(dbStructure.properties, 'checkbox') || 'is_active';
            const orderProp = this.getPropertyName(dbStructure.properties, 'number') || 'order';

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

            return response.results.map(page => this.mapPageToReward(page as any, dbStructure.properties));
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

            const rewardIdProp = this.getPropertyName(dbStructure.properties, 'title') || 'reward_id';

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
        const idProp = this.getPropertyName(properties, 'title') || 'reward_id';
        const titleProp = this.getPropertyName(properties, 'rich_text') || 'title';
        const descProp = this.getPropertyName(properties, 'rich_text') || 'description';
        const pointsProp = this.getPropertyName(properties, 'number') || 'points_required';
        const repeatableProp = this.getPropertyName(properties, 'checkbox') || 'is_repeatable';
        const orderProp = this.getPropertyName(properties, 'number') || 'order';
        const activeProp = this.getPropertyName(properties, 'checkbox') || 'is_active';

        return {
            id: page.id,
            rewardId: this.extractValue(page.properties[idProp], 'title'),
            title: this.extractValue(page.properties[titleProp], 'rich_text'),
            description: this.extractValue(page.properties[descProp], 'rich_text'),
            pointsRequired: this.extractValue(page.properties[pointsProp], 'number'),
            isRepeatable: this.extractValue(page.properties[repeatableProp], 'checkbox'),
            order: this.extractValue(page.properties[orderProp], 'number'),
            isActive: this.extractValue(page.properties[activeProp], 'checkbox')
        };
    }

    // --- Point Transaction Methods ---

    async createPointTransaction(
        customerId: string,
        amount: number,
        type: 'PURCHASE' | 'ADMIN' | 'REWARD',
        details: {
            storeId?: string; // Notion Page ID of store
            location?: string;
            deviceId?: string;
            reason?: string;
            rewardId?: string; // Notion Page ID of reward
        }
    ): Promise<string> {
        try {
            if (!this.pointHistoryDbId) throw new Error('Point History DB ID not set');

            const dbStructure = await this.getDatabaseStructure(this.pointHistoryDbId);
            if (!dbStructure) throw new Error('Failed to get DB structure');

            const customerProp = this.getPropertyName(dbStructure.properties, 'relation') || 'customer';
            const dateProp = this.getPropertyName(dbStructure.properties, 'date') || 'date';
            const amountProp = this.getPropertyName(dbStructure.properties, 'number') || 'amount';
            const typeProp = this.getPropertyName(dbStructure.properties, 'select') || 'type';
            const storeProp = this.getPropertyName(dbStructure.properties, 'select') || 'store'; // Using select for store name/ID for simplicity as per schema
            const locationProp = this.getPropertyName(dbStructure.properties, 'rich_text') || 'location';
            const deviceProp = this.getPropertyName(dbStructure.properties, 'rich_text') || 'device';
            const reasonProp = this.getPropertyName(dbStructure.properties, 'rich_text') || 'reason';
            const rewardProp = this.getPropertyName(dbStructure.properties, 'relation') || 'reward';
            const titleProp = this.getPropertyName(dbStructure.properties, 'title') || 'ID';

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
                // If store is a relation, use relation. If select, use name.
                // Schema said 'select' for store. Let's assume we pass the store name or ID string.
                // For now, let's assume it's a select property storing the Store Name or ID.
                // If we want to link to Store DB, it should be a relation.
                // The setup script created it as 'select'.
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

            // We need to find property names for total_points, current_points etc.
            // These matched what update-notion-schema.ts sets up for Customer DB?
            // Actually checkin.tsx calls Notion directly or through API?
            // This class is used by backend.

            const props = customerPage.properties;

            // Helper to find prop by name (key)
            const getPropValue = (name: string) => {
                if (props[name]) return props[name].number || 0;
                // Fallback: search by case insensitive
                const key = Object.keys(props).find(k => k.toLowerCase() === name.toLowerCase());
                return key ? props[key].number || 0 : 0;
            };

            let currentTotal = getPropValue('total_points');
            let currentAvailable = getPropValue('current_points');
            let currentUsed = getPropValue('used_points');
            let visitCount = getPropValue('visit_count');

            if (amountChange > 0) {
                currentTotal += amountChange;
                currentAvailable += amountChange;
                visitCount += 1; // Assuming +points means a visit/purchase
            } else {
                currentAvailable += amountChange; // amountChange is negative
                currentUsed += Math.abs(amountChange);
            }

            // Update
            await this.client.pages.update({
                page_id: customerId,
                properties: {
                    'total_points': { number: currentTotal },
                    'current_points': { number: currentAvailable },
                    'used_points': { number: currentUsed },
                    'visit_count': { number: visitCount },
                    'last_visit_date': { date: { start: new Date().toISOString() } }
                }
            });

        } catch (error) {
            console.error('Failed to update customer totals:', error);
        }
    }

    async getAllCustomers(): Promise<any[]> {
        try {
            console.log('Fetching all customers from DB:', this.customerDatabaseId);
            if (!this.customerDatabaseId) {
                console.error('Customer DB ID is missing');
                return [];
            }

            const dbStructure = await this.getDatabaseStructure(this.customerDatabaseId);
            if (!dbStructure) return [];

            // We need to get point info too, which is in properties.
            // Let's assume the properties are named standardly as per schema script.

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
                const getVal = (name: string, type: 'title' | 'rich_text' | 'number' | 'date') => {
                    const key = Object.keys(props).find(k => k.toLowerCase() === name.toLowerCase());
                    if (!key) return null;
                    const p = props[key];
                    if (type === 'title') return p.title?.[0]?.text?.content || '';
                    if (type === 'rich_text') return p.rich_text?.[0]?.text?.content || '';
                    if (type === 'number') return p.number || 0;
                    if (type === 'date') return p.date?.start || '';
                    return null;
                };

                return {
                    id: page.id,
                    displayName: getVal('表示名', 'title') || 'No Name',
                    lineUid: getVal('LINE UID', 'rich_text') || '',
                    currentPoints: getVal('current_points', 'number') || 0,
                    totalPoints: getVal('total_points', 'number') || 0,
                    lastVisit: getVal('last_visit_date', 'date') || ''
                };
            });
        } catch (error) {
            console.error('Failed to fetch all customers:', error);
            return [];
        }
    }

    // Helper to extract values safely
    private extractValue(prop: any, type: string): any {
        if (!prop) return null;
        switch (type) {
            case 'title': return prop.title?.[0]?.text?.content || '';
            case 'rich_text': return prop.rich_text?.[0]?.text?.content || '';
            case 'number': return prop.number || 0;
            case 'checkbox': return prop.checkbox || false;
            case 'url': return prop.url || '';
            case 'select': return prop.select?.name || '';
            case 'date': return prop.date?.start || '';
            default: return null;
        }
    }
}
