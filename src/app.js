// Third-party imports
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Local imports
// import adminRoutes from './routes/admin.routes.js';
// import diaryRoutes from './routes/diary.routes.js';
import foodRoutes from './routes/food.routes.js';
// import imageRoutes from './routes/image.routes.js';
import imageAnalysisRoutes from './routes/imageAnalysis.routes.js';
import authRoutes from './routes/auth.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import userRoutes from './routes/user.routes.js';
import AppError from './utils/appError.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/auth', limiter);

// Body parser
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/images', imageRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/vision', imageAnalysisRoutes);
// app.use('/api/diaries', diaryRoutes);
app.use('/api/subscription', subscriptionRoutes);

// 404 handler
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

export default app;