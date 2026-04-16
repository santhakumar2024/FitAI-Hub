"use strict";
// src/app.ts
// FitAI Hub — Main Express Application
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
if (process.env.NODE_ENV === 'development') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.log('⚠️ [DEV] SSL Certificate validation disabled (NODE_TLS_REJECT_UNAUTHORIZED=0)');
}
const env_1 = require("./config/env");
const firebase_1 = require("./config/firebase");
const db_1 = require("./config/db");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const cronJobs_1 = require("./jobs/cronJobs");
// Routes
const logging_middleware_1 = require("./middleware/logging.middleware");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const ai_routes_1 = __importDefault(require("./routes/ai.routes"));
const logs_routes_1 = __importDefault(require("./routes/logs.routes"));
const trainer_routes_1 = __importDefault(require("./routes/trainer.routes"));
const gym_routes_1 = __importDefault(require("./routes/gym.routes"));
const subscription_routes_1 = __importDefault(require("./routes/subscription.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const app = (0, express_1.default)();
// ─────────────────────────────────────────
// SECURITY MIDDLEWARE
// ─────────────────────────────────────────
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use((0, cors_1.default)({
    origin: true, // Allow all origins for debugging
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Global rate limiter
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.config.rateLimitWindowMs,
    max: env_1.config.nodeEnv === 'development' ? 1000 : env_1.config.rateLimitMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please slow down.' },
});
app.use(globalLimiter);
// ─────────────────────────────────────────
// BODY PARSING
// ─────────────────────────────────────────
// NOTE: Raw body for Razorpay webhook (before JSON parsing)
app.use('/api/v1/subscription/webhook', express_1.default.raw({ type: 'application/json' }));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
// ─────────────────────────────────────────
// LOGGING
// ─────────────────────────────────────────
if (env_1.config.nodeEnv !== 'test') {
    app.use((0, morgan_1.default)(env_1.config.nodeEnv === 'production' ? 'combined' : 'dev', { stream: logger_1.loggerStream }));
}
// Custom detailed request/response/error logger
app.use(logging_middleware_1.loggingMiddleware);
// ─────────────────────────────────────────
// HEALTH CHECK (Public)
// ─────────────────────────────────────────
app.get('/api/v1/health', (req, res) => {
    res.json({
        success: true,
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: env_1.config.nodeEnv,
    });
});
// ─────────────────────────────────────────
// EXERCISE & YOGA REFERENCE DATA (Public)
// ─────────────────────────────────────────
app.get('/api/v1/exercises', (req, res) => {
    const { search = '', muscle = '' } = req.query;
    const exercises = [
        { name: 'Push-ups', muscle: 'chest', difficulty: 'beginner' },
        { name: 'Pull-ups', muscle: 'back', difficulty: 'intermediate' },
        { name: 'Squats', muscle: 'legs', difficulty: 'beginner' },
        { name: 'Deadlift', muscle: 'back', difficulty: 'advanced' },
        { name: 'Bench Press', muscle: 'chest', difficulty: 'intermediate' },
        { name: 'Brisk Walking', muscle: 'cardio', difficulty: 'beginner' },
    ].filter((e) => {
        const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
        const matchMuscle = !muscle || e.muscle.toLowerCase() === muscle.toLowerCase();
        return matchSearch && matchMuscle;
    });
    res.json({ success: true, data: exercises });
});
app.get('/api/v1/yoga-poses', (req, res) => {
    const { search = '' } = req.query;
    const poses = [
        { name: 'Surya Namaskar', sanskrit: 'Surya Namaskar', benefits: 'Full body stretch, energizing' },
        { name: 'Downward Dog', sanskrit: 'Adho Mukha Svanasana', benefits: 'Hamstrings, back strength' },
        { name: 'Warrior I', sanskrit: 'Virabhadrasana I', benefits: 'Leg strength, hip flexibility' },
        { name: 'Tree Pose', sanskrit: 'Vrikshasana', benefits: 'Balance, concentration' },
        { name: 'Child Pose', sanskrit: 'Balasana', benefits: 'Relaxation, back stretch' },
        { name: 'Savasana', sanskrit: 'Savasana', benefits: 'Complete relaxation, stress relief' },
    ].filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()));
    res.json({ success: true, data: poses });
});
// ─────────────────────────────────────────
// API ROUTES (v1)
// ─────────────────────────────────────────
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1', ai_routes_1.default); // /ai/generate-plan, /plan/*
app.use('/api/v1', logs_routes_1.default); // /logs/daily, /progress/*
app.use('/api/v1', trainer_routes_1.default); // /clients/*, /freelancer/*, /trainer/*
app.use('/api/v1', gym_routes_1.default); // /gym/*
app.use('/api/v1', subscription_routes_1.default); // /subscription/*
app.use('/api/v1', profile_routes_1.default); // /profile/*
app.use('/api/v1', notification_routes_1.default); // /notifications
// ─────────────────────────────────────────
// ERROR HANDLING
// ─────────────────────────────────────────
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
// ─────────────────────────────────────────
// SERVER START
// ─────────────────────────────────────────
const startServer = async () => {
    try {
        // Test DB connection
        await db_1.prisma.$connect();
        logger_1.logger.info('✅ Database connected');
        // Initialize Firebase
        (0, firebase_1.initFirebase)();
        // Start cron jobs
        (0, cronJobs_1.initCronJobs)();
        const PORT = env_1.config.port;
        const HOST = '0.0.0.0'; // Bind to all interfaces for emulator access
        app.listen(PORT, HOST, () => {
            logger_1.logger.info(`🚀 FitAI Hub API running on http://${HOST}:${PORT}/api/v1`);
            logger_1.logger.info(`📡 Local Access: http://localhost:${PORT}/api/v1`);
            logger_1.logger.info(`🔧 Environment: ${env_1.config.nodeEnv}`);
            logger_1.logger.info(`🤖 AI Provider: ${env_1.config.aiProvider}`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
// Graceful shutdown
process.on('SIGTERM', async () => {
    logger_1.logger.info('SIGTERM received. Shutting down gracefully...');
    await db_1.prisma.$disconnect();
    process.exit(0);
});
process.on('SIGINT', async () => {
    logger_1.logger.info('SIGINT received. Shutting down gracefully...');
    await db_1.prisma.$disconnect();
    process.exit(0);
});
// Only start the server if not running as a Vercel serverless function
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    startServer();
}
exports.default = app;
//# sourceMappingURL=app.js.map