// src/controllers/notification.controller.ts
// Push notification endpoints

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { ok } from '../utils/apiResponse';
import { buildPaginationMeta } from '../utils/helpers';

export const getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    const unreadCount = await prisma.notification.count({ where: { userId, isRead: false } });

    ok(res, 'Notifications retrieved', { notifications, unreadCount }, buildPaginationMeta(total, Number(page), Number(limit)));
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { notificationIds } = req.body;

    if (notificationIds?.length > 0) {
      await prisma.notification.updateMany({
        where: { id: { in: notificationIds }, userId },
        data: { isRead: true },
      });
    } else {
      // Mark all as read
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    }

    ok(res, 'Notifications marked as read');
  } catch (error) {
    next(error);
  }
};
