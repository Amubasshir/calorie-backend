import User from '../models/user.model.js';
import AppError from '../utils/appError.js';

export const getMe = async (req, res, next) => {
    res.status(200).json({
        status: 'success',
        data: { user: req.user }
    });
};

export const updateMe = async (req, res, next) => {
    try {
        const { fullName, email } = req.body;

        // Check if user is trying to update password
        if (req.body.password) {
            return next(new AppError('This route is not for password updates.', 400));
        }

        // Filter unwanted fields
        const filteredBody = {
            fullName: fullName,
            email: email
        };

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            filteredBody,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            status: 'success',
            data: { user: updatedUser }
        });
    } catch (error) {
        next(error);
    }
};
