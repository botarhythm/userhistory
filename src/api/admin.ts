import express from 'express';
import { NotionPointsAPI } from './notion-points.js';
import { AdminGrantPointsRequest } from '../types/points.js';

const router = express.Router();
const notionPoints = new NotionPointsAPI();

// Middleware to ensure JSON body
router.use(express.json());

// Middleware for Admin Auth
const adminAuth = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const adminId = process.env['ADMIN_LINE_USER_ID'];
    const requestUserId = req.headers['x-line-user-id'] as string;

    if (!adminId || requestUserId !== adminId) {
        res.status(403).json({ error: 'Unauthorized: Admin access only' });
        return;
    }
    next();
};

router.use(adminAuth);

// POST /api/admin/grant - Manually grant/deduct points
router.post('/grant', async (req, res): Promise<void> => {
    try {
        const { targetLineUserId, amount, reason } = req.body as AdminGrantPointsRequest;

        const customer = await notionPoints.findCustomerByLineUid(targetLineUserId);
        if (!customer) {
            res.status(404).json({ error: 'Target customer not found' });
            return;
        }

        await notionPoints.createPointTransaction(
            customer.id,
            amount,
            'ADMIN',
            {
                reason: reason || 'Admin Adjustment'
            }
        );

        res.json({ success: true, message: 'Points adjusted successfully' });

    } catch (error) {
        console.error('Error granting points:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
