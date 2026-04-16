"use strict";
// src/config/env.ts
// Environment variable configuration with type safety
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
if (process.env.NODE_ENV === 'development') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}
function requireEnv(key) {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}
function optionalEnv(key, defaultValue = '') {
    return process.env[key] ?? defaultValue;
}
exports.config = {
    // Server
    nodeEnv: optionalEnv('NODE_ENV', 'development'),
    port: parseInt(optionalEnv('PORT', '5000'), 10),
    apiBaseUrl: optionalEnv('API_BASE_URL', 'http://localhost:5000/api/v1'),
    frontendUrl: optionalEnv('FRONTEND_URL', 'http://localhost:3000'),
    // Database
    databaseUrl: requireEnv('DATABASE_URL'),
    // JWT
    jwtSecret: requireEnv('JWT_SECRET'),
    jwtExpiresIn: optionalEnv('JWT_EXPIRES_IN', '15m'),
    refreshTokenSecret: requireEnv('REFRESH_TOKEN_SECRET'),
    refreshTokenExpiresIn: optionalEnv('REFRESH_TOKEN_EXPIRES_IN', '7d'),
    // Security
    bcryptRounds: parseInt(optionalEnv('BCRYPT_ROUNDS', '12'), 10),
    corsOrigin: optionalEnv('CORS_ORIGIN', 'http://localhost:3000').split(','),
    // OpenAI
    openaiApiKey: optionalEnv('OPENAI_API_KEY'),
    openaiModel: optionalEnv('OPENAI_MODEL', 'gpt-4o'),
    // Gemini (Google AI)
    geminiApiKey: optionalEnv('GEMINI_API_KEY'),
    geminiModel: optionalEnv('GEMINI_MODEL', 'gemini-flash-latest'),
    // Grok (xAI)
    grokApiKey: optionalEnv('GROK_API_KEY'),
    grokBaseUrl: optionalEnv('GROK_BASE_URL', 'https://api.x.ai/v1'),
    // AI Provider
    aiProvider: optionalEnv('AI_PROVIDER', 'openai'),
    // Razorpay
    razorpayKeyId: optionalEnv('RAZORPAY_KEY_ID'),
    razorpayKeySecret: optionalEnv('RAZORPAY_KEY_SECRET'),
    razorpayWebhookSecret: optionalEnv('RAZORPAY_WEBHOOK_SECRET'),
    // Twilio
    twilioAccountSid: optionalEnv('TWILIO_ACCOUNT_SID'),
    twilioAuthToken: optionalEnv('TWILIO_AUTH_TOKEN'),
    twilioPhoneNumber: optionalEnv('TWILIO_PHONE_NUMBER'),
    // Firebase
    firebaseProjectId: optionalEnv('FIREBASE_PROJECT_ID'),
    firebasePrivateKeyId: optionalEnv('FIREBASE_PRIVATE_KEY_ID'),
    firebasePrivateKey: optionalEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
    firebaseClientEmail: optionalEnv('FIREBASE_CLIENT_EMAIL'),
    firebaseClientId: optionalEnv('FIREBASE_CLIENT_ID'),
    // Rate Limiting
    rateLimitWindowMs: parseInt(optionalEnv('RATE_LIMIT_WINDOW_MS', '900000'), 10),
    rateLimitMaxRequests: parseInt(optionalEnv('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
    // OTP
    otpExpiryMinutes: parseInt(optionalEnv('OTP_EXPIRY_MINUTES', '10'), 10),
};
//# sourceMappingURL=env.js.map