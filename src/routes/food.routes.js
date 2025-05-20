import express from 'express';
import {
    createFood,
    deleteFood,
    getFood,
    getFoods,
    updateFood
} from '../controllers/food.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.post('/', createFood);
router.get('/', getFoods);
router.get('/:id', getFood);
router.put('/:id', updateFood);
router.delete('/:id', deleteFood);

export default router;
