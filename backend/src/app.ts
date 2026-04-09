// src/app.ts
// FitAI Hub — Main Express Application

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('⚠️ [DEV] SSL Certificate validation disabled (NODE_TLS_REJECT_UNAUTHORIZED=0)');
}

import { config } from './config/env';
import { initFirebase } from './config/firebase';
import { prisma } from './config/db';
import { logger, loggerStream } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { initCronJobs } from './jobs/cronJobs';

// Routes
import { loggingMiddleware } from './middleware/logging.middleware';
import authRoutes from './routes/auth.routes';
import aiRoutes from './routes/ai.routes';
import logsRoutes from './routes/logs.routes';
import trainerRoutes from './routes/trainer.routes';
import gymRoutes from './routes/gym.routes';
import subscriptionRoutes from './routes/subscription.routes';
import profileRoutes from './routes/profile.routes';
import notificationRoutes from './routes/notification.routes';

const app = express();

// ─────────────────────────────────────────
// SECURITY MIDDLEWARE
// ─────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: true, // Allow all origins for debugging
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.nodeEnv === 'development' ? 1000 : config.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});
app.use(globalLimiter);

// ─────────────────────────────────────────
// BODY PARSING
// ─────────────────────────────────────────
// NOTE: Raw body for Razorpay webhook (before JSON parsing)
app.use('/api/v1/subscription/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─────────────────────────────────────────
// LOGGING
// ─────────────────────────────────────────
if (config.nodeEnv !== 'test') {
  app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev', { stream: loggerStream }));
}

// Custom detailed request/response/error logger
app.use(loggingMiddleware);

// ─────────────────────────────────────────
// HEALTH CHECK (Public)
// ─────────────────────────────────────────
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.nodeEnv,
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
    const matchSearch = !search || e.name.toLowerCase().includes((search as string).toLowerCase());
    const matchMuscle = !muscle || e.muscle.toLowerCase() === (muscle as string).toLowerCase();
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
  ].filter((p) => !search || p.name.toLowerCase().includes((search as string).toLowerCase()));

  res.json({ success: true, data: poses });
});

// ─────────────────────────────────────────
// API ROUTES (v1)
// ─────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', aiRoutes);           // /ai/generate-plan, /plan/*
app.use('/api/v1', logsRoutes);         // /logs/daily, /progress/*
app.use('/api/v1', trainerRoutes);      // /clients/*, /freelancer/*, /trainer/*
app.use('/api/v1', gymRoutes);          // /gym/*
app.use('/api/v1', subscriptionRoutes); // /subscription/*
app.use('/api/v1', profileRoutes);      // /profile/*
app.use('/api/v1', notificationRoutes); // /notifications

// ─────────────────────────────────────────
// ERROR HANDLING
// ─────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─────────────────────────────────────────
// SERVER START
// ─────────────────────────────────────────
const startServer = async () => {
  try {
    // Test DB connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Initialize Firebase
    initFirebase();

    // Start cron jobs
    initCronJobs();

    const PORT = config.port;
    const HOST = '0.0.0.0'; // Bind to all interfaces for emulator access
    app.listen(PORT, HOST, () => {
      logger.info(`🚀 FitAI Hub API running on http://${HOST}:${PORT}/api/v1`);
      logger.info(`📡 Local Access: http://localhost:${PORT}/api/v1`);
      logger.info(`🔧 Environment: ${config.nodeEnv}`);
      logger.info(`🤖 AI Provider: ${config.aiProvider}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

export default app;
