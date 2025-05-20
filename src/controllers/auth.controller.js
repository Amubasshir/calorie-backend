import { validationResult } from 'express-validator';
import User from '../models/user.model.js';
import AppError from '../utils/appError.js';

// Cookie options
const cookieOptions = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
};

export const register = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new AppError('Validation error', 400));
        }

        const { fullName, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new AppError('Email already in use', 400));
        }

        // Create new user
        const user = await User.create({
            fullName,
            email,
            password
        });

        // Generate token
        const token = user.generateAuthToken();

        // Remove password from output
        user.password = undefined;

        // Set cookie and send response
        res.cookie('jwt', token, cookieOptions);
        res.status(201).json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check if email and password exist
        if (!email || !password) {
            return next(new AppError('Please provide email and password', 400));
        }

        // Check if user exists && password is correct
        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return next(new AppError('Incorrect email or password', 401));
        }

        // Generate token
        const token = user.generateAuthToken();

        // Remove password from output
        user.password = undefined;

        // Set cookie and send response
        res.cookie('jwt', token, cookieOptions);
        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

export const logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({ status: 'success' });
};
