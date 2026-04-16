import admin from 'firebase-admin';
export declare const initFirebase: () => void;
export declare const getFirebaseAdmin: () => admin.app.App | null;
export declare const sendPushNotification: (fcmToken: string, title: string, body: string, data?: Record<string, string>) => Promise<boolean>;
//# sourceMappingURL=firebase.d.ts.map