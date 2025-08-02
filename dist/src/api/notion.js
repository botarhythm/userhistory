import { Client } from '@notionhq/client';
export class NotionAPI {
    client;
    customerDatabaseId;
    historyDatabaseId;
    productDatabaseId;
    constructor() {
        const apiKey = process.env['NOTION_API_KEY'];
        if (!apiKey) {
            throw new Error('NOTION_API_KEY environment variable is required');
        }
        this.client = new Client({
            auth: apiKey,
        });
        this.customerDatabaseId = process.env['NOTION_CUSTOMER_DB_ID'] || '';
        this.historyDatabaseId = process.env['NOTION_HISTORY_DB_ID'] || '';
        this.productDatabaseId = process.env['NOTION_PRODUCT_DB_ID'] || '';
    }
    // データベース構造を取得
    async getDatabaseStructure(databaseId) {
        try {
            const response = await this.client.databases.retrieve({
                database_id: databaseId
            });
            return {
                id: response.id,
                title: response.title || 'No title',
                properties: response.properties
            };
        }
        catch (error) {
            console.error('Database structure fetch error:', error);
            return null;
        }
    }
    // プロパティ名を動的に取得
    getPropertyName(properties, type) {
        const candidates = [];
        for (const [name, prop] of Object.entries(properties)) {
            if (prop.type === type) {
                candidates.push(name);
            }
        }
        // デバッグ用にログ出力
        if (candidates.length === 0) {
            console.warn(`No properties found for type: ${type}`);
            console.warn('Available properties:', Object.keys(properties));
            console.warn('Property types:', Object.entries(properties).map(([name, prop]) => ({ name, type: prop.type })));
        }
        else if (candidates.length > 1) {
            console.warn(`Multiple properties found for type ${type}:`, candidates);
        }
        return candidates[0] || null;
    }
    // 商品一覧を取得
    async getProducts() {
        try {
            if (!this.productDatabaseId) {
                console.warn('Product database ID not configured');
                return [];
            }
            const dbStructure = await this.getDatabaseStructure(this.productDatabaseId);
            if (!dbStructure) {
                throw new Error('Failed to get product database structure');
            }
            const nameProperty = this.getPropertyName(dbStructure.properties, 'title') || '商品名';
            const orderProperty = this.getPropertyName(dbStructure.properties, 'number') || '表示順';
            const availableProperty = this.getPropertyName(dbStructure.properties, 'checkbox') || '販売中';
            const response = await this.client.databases.query({
                database_id: this.productDatabaseId,
                filter: {
                    property: availableProperty,
                    checkbox: {
                        equals: true
                    }
                },
                sorts: [
                    {
                        property: orderProperty,
                        direction: 'ascending'
                    }
                ]
            });
            return response.results.map((page) => ({
                id: page.id,
                name: this.getPropertyValue(page, nameProperty, 'title') || '',
                price: 0, // 価格は現在のDBには含まれていないため0を設定
                category: '', // カテゴリは現在のDBには含まれていないため空文字を設定
                description: '', // 説明は現在のDBには含まれていないため空文字を設定
                order: this.getPropertyValue(page, orderProperty, 'number') || 0,
                available: this.getPropertyValue(page, availableProperty, 'checkbox') || false
            }));
        }
        catch (error) {
            console.error('Failed to fetch products:', error);
            return [];
        }
    }
    // 商品を検索
    async searchProducts(query) {
        try {
            if (!this.productDatabaseId) {
                return [];
            }
            const allProducts = await this.getProducts();
            const lowerQuery = query.toLowerCase();
            return allProducts.filter(product => product.name.toLowerCase().includes(lowerQuery));
        }
        catch (error) {
            console.error('Failed to search products:', error);
            return [];
        }
    }
    // 顧客の検索・作成
    async findOrCreateCustomer(lineUid, displayName) {
        try {
            // 既存顧客を検索
            const existingCustomer = await this.findCustomerByLineUid(lineUid);
            if (existingCustomer) {
                // 既存顧客の表示名を更新
                await this.updateCustomerDisplayName(existingCustomer.id, displayName);
                return existingCustomer.id;
            }
            // データベース構造を取得してプロパティ名を動的に決定
            const dbStructure = await this.getDatabaseStructure(this.customerDatabaseId);
            if (!dbStructure) {
                throw new Error('Failed to get database structure');
            }
            const displayNameProperty = this.getPropertyName(dbStructure.properties, 'title') || '表示名';
            const lineUidProperty = this.getPropertyName(dbStructure.properties, 'rich_text') || 'LINE UID';
            // 新規顧客を作成
            const response = await this.client.pages.create({
                parent: { database_id: this.customerDatabaseId },
                properties: {
                    [displayNameProperty]: {
                        title: [{ text: { content: displayName } }]
                    },
                    [lineUidProperty]: {
                        rich_text: [{ text: { content: lineUid } }]
                    }
                }
            });
            return response.id;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Failed to create customer details:', {
                error: errorMessage,
                stack: error instanceof Error ? error.stack : undefined,
                lineUid,
                displayName
            });
            throw new Error(`Failed to create customer: ${errorMessage}`);
        }
    }
    // 顧客の表示名を更新
    async updateCustomerDisplayName(customerId, displayName) {
        try {
            // データベース構造を取得してプロパティ名を動的に決定
            const dbStructure = await this.getDatabaseStructure(this.customerDatabaseId);
            if (!dbStructure) {
                throw new Error('Failed to get database structure');
            }
            const displayNameProperty = this.getPropertyName(dbStructure.properties, 'title') || '表示名';
            // 顧客の表示名を更新
            await this.client.pages.update({
                page_id: customerId,
                properties: {
                    [displayNameProperty]: {
                        title: [{ text: { content: displayName } }]
                    }
                }
            });
        }
        catch (error) {
            console.error('Failed to update customer display name:', error);
            // エラーが発生しても処理を継続（表示名の更新は重要ではないため）
        }
    }
    // LINE UIDで顧客を検索
    async findCustomerByLineUid(lineUid) {
        try {
            // データベース構造を取得してプロパティ名を動的に決定
            const dbStructure = await this.getDatabaseStructure(this.customerDatabaseId);
            if (!dbStructure) {
                return null;
            }
            const displayNameProperty = this.getPropertyName(dbStructure.properties, 'title') || '表示名';
            const lineUidProperty = this.getPropertyName(dbStructure.properties, 'rich_text') || 'LINE UID';
            const dateProperty = this.getPropertyName(dbStructure.properties, 'created_time') || '登録日';
            // LINE UIDで検索
            const response = await this.client.databases.query({
                database_id: this.customerDatabaseId,
                filter: {
                    property: lineUidProperty,
                    rich_text: {
                        equals: lineUid
                    }
                }
            });
            if (response.results.length === 0) {
                return null;
            }
            const page = response.results[0];
            return {
                id: page.id || '',
                lineUid: this.getPropertyValue(page, lineUidProperty, 'rich_text') || '',
                displayName: this.getPropertyValue(page, displayNameProperty, 'title') || '',
                createdAt: this.getPropertyValue(page, dateProperty, 'created_time') || new Date().toISOString()
            };
        }
        catch (error) {
            console.error('Failed to find customer:', error);
            return null;
        }
    }
    // 来店履歴を記録
    async recordCheckin(customerId, timestamp, memo) {
        try {
            // データベース構造を取得してプロパティ名を動的に決定
            const dbStructure = await this.getDatabaseStructure(this.historyDatabaseId);
            if (!dbStructure) {
                throw new Error('Failed to get database structure');
            }
            const relationProperty = this.getPropertyName(dbStructure.properties, 'relation') || '関連顧客ID';
            const dateProperty = this.getPropertyName(dbStructure.properties, 'date') || '日時';
            const memoProperty = this.getPropertyName(dbStructure.properties, 'rich_text') || 'メモ';
            const titleProperty = this.getPropertyName(dbStructure.properties, 'title') || '商品名';
            const properties = {
                [relationProperty]: {
                    relation: [{ id: customerId }]
                },
                [dateProperty]: {
                    date: { start: timestamp || new Date().toISOString() }
                },
                [titleProperty]: {
                    title: [{ text: { content: '来店' } }]
                }
            };
            // メモがある場合のみ追加
            if (memo && memo.trim()) {
                properties[memoProperty] = {
                    rich_text: [{ text: { content: memo.trim() } }]
                };
            }
            const response = await this.client.pages.create({
                parent: { database_id: this.historyDatabaseId },
                properties
            });
            return response.id;
        }
        catch (error) {
            console.error('Check-in recording error:', error);
            throw new Error('Failed to record check-in');
        }
    }
    // 購入履歴を記録
    async recordPurchase(customerId, items, total, memo, timestamp) {
        try {
            // データベース構造を取得してプロパティ名を動的に決定
            const dbStructure = await this.getDatabaseStructure(this.historyDatabaseId);
            if (!dbStructure) {
                throw new Error('Failed to get database structure');
            }
            const relationProperty = this.getPropertyName(dbStructure.properties, 'relation') || '関連顧客ID';
            const dateProperty = this.getPropertyName(dbStructure.properties, 'date') || '日時';
            const titleProperty = this.getPropertyName(dbStructure.properties, 'title') || '商品名';
            const memoProperty = this.getPropertyName(dbStructure.properties, 'rich_text') || 'メモ';
            const itemNames = items.map(item => item.name).join(', ');
            const properties = {
                [relationProperty]: {
                    relation: [{ id: customerId }]
                },
                [dateProperty]: {
                    date: { start: timestamp || new Date().toISOString() }
                },
                [titleProperty]: {
                    title: [{ text: { content: itemNames } }]
                }
            };
            // メモがある場合のみ追加
            if (memo && memo.trim()) {
                properties[memoProperty] = {
                    rich_text: [{ text: { content: memo.trim() } }]
                };
            }
            const response = await this.client.pages.create({
                parent: { database_id: this.historyDatabaseId },
                properties
            });
            return response.id;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Purchase recording error details:', {
                error: errorMessage,
                stack: error instanceof Error ? error.stack : undefined,
                customerId,
                items,
                total,
                memo,
                timestamp
            });
            throw new Error(`Failed to record purchase: ${errorMessage}`);
        }
    }
    // 履歴を取得
    async getHistory(customerId, type, limit = 10) {
        try {
            // データベース構造を取得してプロパティ名を動的に決定
            const dbStructure = await this.getDatabaseStructure(this.historyDatabaseId);
            if (!dbStructure) {
                return [];
            }
            const relationProperty = this.getPropertyName(dbStructure.properties, 'relation') || '関連顧客ID';
            const dateProperty = this.getPropertyName(dbStructure.properties, 'date') || '日時';
            const titleProperty = this.getPropertyName(dbStructure.properties, 'title') || '商品名';
            const memoProperty = this.getPropertyName(dbStructure.properties, 'rich_text') || 'メモ';
            const filter = {
                property: relationProperty,
                relation: {
                    contains: customerId
                }
            };
            const response = await this.client.databases.query({
                database_id: this.historyDatabaseId,
                filter,
                sorts: [
                    {
                        property: dateProperty,
                        direction: 'descending'
                    }
                ],
                page_size: limit
            });
            return response.results.map(page => {
                const title = this.getPropertyValue(page, titleProperty, 'title');
                const memo = this.getPropertyValue(page, memoProperty, 'rich_text');
                // 商品名から履歴タイプを判定（「来店」の場合はcheckin、それ以外はpurchase）
                const recordType = title === '来店' ? 'checkin' : 'purchase';
                return {
                    id: page.id,
                    customerId,
                    type: recordType,
                    timestamp: this.getPropertyValue(page, dateProperty, 'date'),
                    items: recordType === 'purchase' ? this.parseItems(title) : undefined,
                    total: recordType === 'purchase' ? 0 : undefined, // 購入の場合は0、来店の場合はundefined
                    memo: memo
                };
            });
        }
        catch (error) {
            console.error('History fetch error:', error);
            return [];
        }
    }
    // プロパティ値を動的に取得
    getPropertyValue(page, propertyName, type) {
        try {
            const property = page.properties[propertyName];
            if (!property)
                return null;
            switch (type) {
                case 'title':
                    return property.title?.[0]?.text?.content || '';
                case 'rich_text':
                    return property.rich_text?.[0]?.text?.content || '';
                case 'number':
                    return property.number || 0;
                case 'select':
                    return property.select?.name || '';
                case 'date':
                    return property.date?.start || '';
                case 'created_time':
                    return property.created_time || '';
                case 'relation':
                    return property.relation?.[0]?.id || '';
                default:
                    return null;
            }
        }
        catch (error) {
            console.error(`Error getting property value for ${propertyName}:`, error);
            return null;
        }
    }
    // 商品リストの解析（ヘルパー関数）
    parseItems(itemsString) {
        if (!itemsString)
            return [];
        return itemsString.split(', ').map(item => {
            const match = item.match(/(.+) x(\d+)/);
            if (match && match[1] && match[2]) {
                return {
                    name: match[1],
                    quantity: parseInt(match[2])
                };
            }
            return { name: item, quantity: 1 };
        });
    }
    // 履歴を更新
    async updateHistory(historyId, updates) {
        try {
            // データベース構造を取得してプロパティ名を動的に決定
            const dbStructure = await this.getDatabaseStructure(this.historyDatabaseId);
            if (!dbStructure) {
                throw new Error('Failed to get database structure');
            }
            const memoProperty = this.getPropertyName(dbStructure.properties, 'rich_text') || 'メモ';
            const properties = {};
            // メモの更新
            if (updates.memo !== undefined) {
                properties[memoProperty] = {
                    rich_text: updates.memo ? [{ text: { content: updates.memo } }] : []
                };
            }
            // ページを更新
            await this.client.pages.update({
                page_id: historyId,
                properties
            });
            // 更新された履歴を取得
            const response = await this.client.pages.retrieve({ page_id: historyId });
            const page = response;
            // 履歴レコードを構築
            const relationProperty = this.getPropertyName(dbStructure.properties, 'relation') || '関連顧客ID';
            const dateProperty = this.getPropertyName(dbStructure.properties, 'date') || '日時';
            const titleProperty = this.getPropertyName(dbStructure.properties, 'title') || '商品名';
            const timestamp = this.getPropertyValue(page, dateProperty, 'date');
            const title = this.getPropertyValue(page, titleProperty, 'title');
            const memo = this.getPropertyValue(page, memoProperty, 'rich_text');
            // 商品名から履歴タイプを判定
            const recordType = title === '来店' ? 'checkin' : 'purchase';
            const result = {
                id: page.id,
                customerId: this.getPropertyValue(page, relationProperty, 'relation') || '',
                type: recordType,
                timestamp: timestamp || new Date().toISOString(),
                items: recordType === 'purchase' ? this.parseItems(title || '') : undefined,
                total: recordType === 'purchase' ? 0 : undefined, // 購入の場合は0、来店の場合はundefined
                memo: memo || undefined
            };
            return result;
        }
        catch (error) {
            console.error('Failed to update history:', error);
            return null;
        }
    }
}
//# sourceMappingURL=notion.js.map