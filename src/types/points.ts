export interface PointTransaction {
    id: string;
    customerId: string;
    date: string;
    amount: number;
    type: 'PURCHASE' | 'ADMIN' | 'REWARD';
    storeId?: string;
    storeName?: string;
    location?: string; // lat,lng
    deviceId?: string;
    reason?: string;
    rewardId?: string;
}

export interface Store {
    id: string; // Notion Page ID
    storeId: string; // Custom ID e.g. "store_001"
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
    qrToken: string;
    nfcUrl?: string;
    isActive: boolean;
}

export interface Reward {
    id: string; // Notion Page ID
    rewardId: string; // Custom ID e.g. "reward_001"
    title: string;
    description: string;
    pointsRequired: number;
    isRepeatable: boolean;
    order: number;
    isActive: boolean;
}

export interface PointStatus {
    currentPoints: number;
    totalPoints: number;
    nextReward?: Reward;
    pointsToNextReward?: number;
}

// API Request Types
export interface EarnPointsRequest {
    lineUserId: string;
    storeId: string;
    latitude: number;
    longitude: number;
    qrToken: string;
}

export interface RedeemRewardRequest {
    lineUserId: string;
    rewardId: string;
}

export interface AdminGrantPointsRequest {
    targetLineUserId: string;
    amount: number;
    reason: string;
}
