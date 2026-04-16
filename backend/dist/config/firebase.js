"use strict";
// src/config/firebase.ts
// Firebase Admin SDK initialization for push notifications
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotification = exports.getFirebaseAdmin = exports.initFirebase = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
let firebaseApp = null;
const initFirebase = () => {
    if (!env_1.config.firebaseProjectId || !env_1.config.firebasePrivateKey || !env_1.config.firebaseClientEmail) {
        logger_1.logger.warn('Firebase credentials not configured. Push notifications disabled.');
        return;
    }
    try {
        if (firebase_admin_1.default.apps.length === 0) {
            firebaseApp = firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.cert({
                    projectId: env_1.config.firebaseProjectId,
                    privateKeyId: env_1.config.firebasePrivateKeyId,
                    privateKey: env_1.config.firebasePrivateKey,
                    clientEmail: env_1.config.firebaseClientEmail,
                    clientId: env_1.config.firebaseClientId,
                    type: 'service_account',
                    authUri: 'https://accounts.google.com/o/oauth2/auth',
                    tokenUri: 'https://oauth2.googleapis.com/token',
                }),
            });
            logger_1.logger.info('✅ Firebase Admin SDK initialized');
        }
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize Firebase:', error);
    }
};
exports.initFirebase = initFirebase;
const getFirebaseAdmin = () => {
    return firebaseApp;
};
exports.getFirebaseAdmin = getFirebaseAdmin;
const sendPushNotification = async (fcmToken, title, body, data) => {
    if (!firebaseApp) {
        logger_1.logger.warn('Firebase not initialized. Skip push notification.');
        return false;
    }
    try {
        await firebase_admin_1.default.messaging().send({
            token: fcmToken,
            notification: { title, body },
            data: data ?? {},
            android: { priority: 'high' },
            apns: { payload: { aps: { sound: 'default', badge: 1 } } },
        });
        return true;
    }
    catch (error) {
        logger_1.logger.error('Push notification failed:', error);
        return false;
    }
};
exports.sendPushNotification = sendPushNotification;
//# sourceMappingURL=firebase.js.map