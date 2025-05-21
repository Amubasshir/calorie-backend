import express from 'express';
import {
    cancelSubscription,
    createCheckoutSession,
    getPlans,
    getUserSubscription
} from '../controllers/subscription.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/plans', getPlans);
router.post('/checkout', protect, createCheckoutSession);
router.get('/me', protect, getUserSubscription);
router.post('/cancel', protect, cancelSubscription);

export default router;
