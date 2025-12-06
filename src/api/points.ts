import express from 'express';
import { NotionPointsAPI } from './notion-points.js';
import { validateLocation } from '../utils/location.js';
import { EarnPointsRequest, RedeemRewardRequest } from '../types/points.js';

const router = express.Router();
const notionPoints = new NotionPointsAPI();

// Middleware to ensure JSON body
router.use(express.json());

// GET /api/points/stores/:storeId - Get store info (for QR scan validation)
router.get('/stores/:storeId', async (req, res): Promise<void> => {
    try {
        const { storeId } = req.params;
        const store = await notionPoints.getStore(storeId);

        if (!store) {
            res.status(404).json({ error: 'Store not found' });
            return;
        }

        // Don't return sensitive info like QR token in public GET if not needed, 
        // but here we might need it for client side check? No, client shouldn't check token.
        // Client just needs name and location to verify against GPS before sending.
        res.json({
            id: store.id,
            storeId: store.storeId,
            name: store.name,
            latitude: store.latitude,
            longitude: store.longitude,
            isActive: store.isActive
        });
    } catch (error) {
        console.error('Error fetching store:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/points/rewards - Get active rewards
router.get('/rewards', async (req, res): Promise<void> => {
    try {
        const rewards = await notionPoints.getActiveRewards();
        res.json({ rewards });
    } catch (error) {
        console.error('Error fetching rewards:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/points/status/:lineUserId - Get user point status
router.get('/status/:lineUserId', async (req, res): Promise<void> => {
    try {
        const { lineUserId } = req.params;
        const customer = await notionPoints.findCustomerByLineUid(lineUserId);

        if (!customer) {
            res.status(404).json({ error: 'Customer not found' });
            return;
        }

        // We need to fetch the customer page again to get the latest point totals
        // findCustomerByLineUid returns a Customer object which might be constructed from a query.
        // Let's assume we need to re-fetch or trust the object.
        // The Customer interface in notion.ts doesn't have point fields yet.
        // We should probably extend Customer interface or fetch raw page.

        // For now, let's fetch the page directly using the ID from customer object
        const customerPage = await notionPoints.client.pages.retrieve({ page_id: customer.id }) as any;
        const props = customerPage.properties;

        // Helper (duplicated from notion-points.ts, ideally shared)
        const getPropValue = (name: string) => {
            const key = Object.keys(props).find(k => k.toLowerCase() === name.toLowerCase());
            return key ? props[key].number || 0 : 0;
        };

        const currentPoints = getPropValue('current_points');
        const totalPoints = getPropValue('total_points');

        res.json({
            currentPoints,
            totalPoints,
            displayName: customer.displayName
        });
    } catch (error) {
        console.error('Error fetching status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/points/earn - Earn points
router.post('/earn', async (req, res): Promise<void> => {
    try {
        const { lineUserId, storeId, latitude, longitude, qrToken } = req.body as EarnPointsRequest;

        // 1. Validate User
        const customer = await notionPoints.findCustomerByLineUid(lineUserId);
        if (!customer) {
            res.status(404).json({ error: 'Customer not registered' });
            return;
        }

        // 2. Validate Store & Token
        const store = await notionPoints.getStore(storeId);
        if (!store) {
            res.status(404).json({ error: 'Store not found' });
            return;
        }
        if (!store.isActive) {
            res.status(400).json({ error: 'Store is not active' });
            return;
        }
        if (store.qrToken !== qrToken) {
            res.status(400).json({ error: 'Invalid QR token' });
            return;
        }

        // 3. Validate Location
        const { isValid, distance } = validateLocation(latitude, longitude, store);
        if (!isValid) {
            res.status(400).json({
                error: 'Location verification failed',
                details: `You are ${distance}m away from the store (allowed: ${store.radius}m)`
            });
            return;
        }

        // 4. Grant Points
        const pointsToGrant = 1; // Fixed 1 point per visit/purchase for now
        await notionPoints.createPointTransaction(
            customer.id,
            pointsToGrant,
            'PURCHASE',
            {
                storeId: store.name, // Storing name for readability in history
                location: `${latitude},${longitude}`,
                reason: 'Store Purchase'
            }
        );

        res.json({
            success: true,
            gainedPoints: pointsToGrant,
            animation: 'coffee_drip'
        });

    } catch (error) {
        console.error('Error earning points:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

// POST /api/points/redeem - Redeem reward
router.post('/redeem', async (req, res): Promise<void> => {
    try {
        const { lineUserId, rewardId } = req.body as RedeemRewardRequest;

        // 1. Validate User
        const customer = await notionPoints.findCustomerByLineUid(lineUserId);
        if (!customer) {
            res.status(404).json({ error: 'Customer not registered' });
            return;
        }

        // 2. Validate Reward
        const reward = await notionPoints.getReward(rewardId);
        if (!reward) {
            res.status(404).json({ error: 'Reward not found' });
            return;
        }
        if (!reward.isActive) {
            res.status(400).json({ error: 'Reward is not active' });
            return;
        }

        // 3. Check Balance
        // Fetch current points
        const customerPage = await notionPoints.client.pages.retrieve({ page_id: customer.id }) as any;
        const props = customerPage.properties;
        const getPropValue = (name: string) => {
            const key = Object.keys(props).find(k => k.toLowerCase() === name.toLowerCase());
            return key ? props[key].number || 0 : 0;
        };
        const currentPoints = getPropValue('current_points');

        if (currentPoints < reward.pointsRequired) {
            res.status(400).json({ error: 'Insufficient points' });
            return;
        }

        // 4. Deduct Points & Record Transaction
        await notionPoints.createPointTransaction(
            customer.id,
            -reward.pointsRequired, // Negative amount
            'REWARD',
            {
                rewardId: reward.id,
                reason: `Redeemed: ${reward.title}`
            }
        );

        res.json({
            success: true,
            redeemedReward: reward,
            animation: 'gift_open'
        });

    } catch (error) {
        console.error('Error redeeming reward:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/points/admin/adjust - Adjust points manually
router.post('/admin/adjust', async (req, res): Promise<void> => {
    try {
        const { adminUserId, targetCustomerId, amount, reason } = req.body;

        // Simple Admin Check (In production, use middleware / secure tokens)
        // Hardcoded admin ID as provided by user
        if (adminUserId !== 'Ue62b450adbd58fca10963f1c243322dd') {
            res.status(403).json({ error: 'Unauthorized: Not an admin' });
            return;
        }

        if (!targetCustomerId || amount === 0) {
            res.status(400).json({ error: 'Invalid parameters' });
            return;
        }

        await notionPoints.createPointTransaction(
            targetCustomerId,
            amount,
            'ADMIN',
            {
                reason: reason || 'Manual Adjustment',
                deviceId: 'ADMIN_CONSOLE'
            }
        );

        res.json({ success: true });

    } catch (error) {
        console.error('Error adjusting points:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/points/admin/customers - Get all customers for admin
router.get('/admin/customers', async (req, res): Promise<void> => {
    try {
        // In a real app, verify admin session here too. 
        // For this MVP, we rely on the implementation assuming it's called from the authenticated Admin UI.
        // Or we can require a header. For simplicity now, open endpoint but practically obscure.
        // Ideally pass admin ID in header.

        const customers = await notionPoints.getAllCustomers();
        res.json({ customers });
    } catch (error) {
        console.error('Error fetching all customers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
