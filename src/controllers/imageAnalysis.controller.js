import ImageAnalysis from '../models/imageAnalysis.model.js';
import UserSubscription from '../models/userSubscription.model.js';
import AppError from '../utils/appError.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { uploadToR2 } from '../utils/r2.js';
import { analyzeImage } from '../utils/visionApi.js';
import { uploadImage } from './image.controller.js';

export const analyzeImageHandler = async (req, res, next) => {
    try {
        if (!req.body.file) {
            return next(new AppError('No image file provided', 400));
        }

        // Check user's subscription
        const userSub = await UserSubscription.findOne({ user: req.user._id }).populate('plan');
        if (!userSub || !userSub.plan.features.customFoodAddition) {
            return next(new AppError('Premium subscription required for food recognition', 403));
        }

        // Upload image to storage
        // const imageUrl = await uploadToR2(req.file);
        // const imageUrl = await uploadImage(req.body.file);
        const imageUrl = await uploadToCloudinary(req.body.file);

        // Create analysis record
        const analysis = await ImageAnalysis.create({
            userId: req.user._id,
            imageUrl,
            mealType: req.body.mealType || 'snack',
            expectedItems: req.body.expectedItems || [],
            notes: req.body.notes,
            status: 'processing'
        });

        // Start processing
        const startTime = Date.now();
        try {
            const identifiedItems = await analyzeImage(imageUrl, analysis.expectedItems);
            
            // Update analysis with results
            analysis.identifiedItems = identifiedItems;
            analysis.status = 'completed';
            analysis.processingTime = Date.now() - startTime;
            await analysis.save();

            res.status(200).json({
                status: 'success',
                data: { analysis }
            });
        } catch (error) {
            analysis.status = 'failed';
            analysis.errorMessage = error.message;
            analysis.processingTime = Date.now() - startTime;
            await analysis.save();
            
            throw error;
        }
    } catch (error) {
        next(error);
    }
};

export const getAnalysis = async (req, res, next) => {
    try {
        const analysis = await ImageAnalysis.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!analysis) {
            return next(new AppError('Analysis not found', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { analysis }
        });
    } catch (error) {
        next(error);
    }
};

export const listAnalyses = async (req, res, next) => {
    try {
        const analyses = await ImageAnalysis.find({
            userId: req.user._id
        }).sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            data: { analyses }
        });
    } catch (error) {
        next(error);
    }
};
