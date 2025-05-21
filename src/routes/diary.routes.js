import express from 'express';
import {
    createDiary,
    deleteDiary,
    getDiaryByDate,
    getMyDiaries,
    updateDiary
} from '../controllers/diary.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.post('/', createDiary);
router.get('/', getMyDiaries);
router.get('/:date', getDiaryByDate);
router.put('/:id', updateDiary);
router.delete('/:id', deleteDiary);

export default router;
