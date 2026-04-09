// src/routes/notification.routes.ts
import { Router } from 'express';
import * as notifController from '../controllers/notification.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);
router.get('/notifications', notifController.getNotifications);
router.post('/notifications/mark-read', notifController.markAsRead);

export default router;
