import express from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller.js';

const router = express.Router();

// Validation middleware
const registerValidation = [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
];

// Routes
router.post('/register', registerValidation, authController.register);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

export default router;
