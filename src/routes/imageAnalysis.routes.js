import express from 'express';
import { uploadMiddleware } from '../controllers/image.controller.js';
import {
    analyzeImageHandler,
    getAnalysis,
    listAnalyses
} from '../controllers/imageAnalysis.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/analyze', uploadMiddleware, analyzeImageHandler);
router.get('/analysis/:id', getAnalysis);
router.get('/analyses', listAnalyses);

export default router;
