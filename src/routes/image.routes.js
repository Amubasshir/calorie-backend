import express from 'express';
import { deleteImage, listImages, uploadImage, uploadMiddleware } from '../controllers/image.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/upload', protect, uploadMiddleware, uploadImage);
router.delete('/:key', protect, deleteImage);
router.get('/', protect, listImages);

export default router;
