import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import AppError from '../utils/appError.js';

export const protect = async (req, res, next) => {
    try {
        // 1) Get token from cookies
        const token = req.cookies.jwt;

        if (!token) {
            return next(new AppError('You are not logged in. Please log in to get access.', 401));
        }

        // 2) Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3) Check if user still exists
        const user = await User.findById(decoded.id);
        if (!user) {
            return next(new AppError('The user belonging to this token no longer exists.', 401));
        }

        // 4) Grant access to protected route
        req.user = user;
        next();
    } catch (error) {
        next(new AppError('Invalid token. Please log in again.', 401));
    }
};

export const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};
