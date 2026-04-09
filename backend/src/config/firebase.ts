// src/config/firebase.ts
// Firebase Admin SDK initialization for push notifications

import admin from 'firebase-admin';
import { config } from './env';
import { logger } from '../utils/logger';

let firebaseApp: admin.app.App | null = null;

export const initFirebase = (): void => {
  if (!config.firebaseProjectId || !config.firebasePrivateKey || !config.firebaseClientEmail) {
    logger.warn('Firebase credentials not configured. Push notifications disabled.');
    return;
  }

  try {
    if (admin.apps.length === 0) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.firebaseProjectId,
          privateKeyId: config.firebasePrivateKeyId,
          privateKey: config.firebasePrivateKey,
          clientEmail: config.firebaseClientEmail,
          clientId: config.firebaseClientId,
          type: 'service_account',
          authUri: 'https://accounts.google.com/o/oauth2/auth',
          tokenUri: 'https://oauth2.googleapis.com/token',
        } as admin.ServiceAccount),
      });
      logger.info('✅ Firebase Admin SDK initialized');
    }
  } catch (error) {
    logger.error('Failed to initialize Firebase:', error);
  }
};

export const getFirebaseAdmin = (): admin.app.App | null => {
  return firebaseApp;
};

export const sendPushNotification = async (
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> => {
  if (!firebaseApp) {
    logger.warn('Firebase not initialized. Skip push notification.');
    return false;
  }

  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data: data ?? {},
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    });
    return true;
  } catch (error) {
    logger.error('Push notification failed:', error);
    return false;
  }
};
