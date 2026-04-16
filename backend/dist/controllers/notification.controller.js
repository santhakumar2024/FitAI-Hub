"use strict";
// src/controllers/notification.controller.ts
// Push notification endpoints
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsRead = exports.getNotifications = void 0;
const db_1 = require("../config/db");
const apiResponse_1 = require("../utils/apiResponse");
const helpers_1 = require("../utils/helpers");
const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const [notifications, total] = await Promise.all([
            db_1.prisma.notification.findMany({
                where: { userId },
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
            }),
            db_1.prisma.notification.count({ where: { userId } }),
        ]);
        const unreadCount = await db_1.prisma.notification.count({ where: { userId, isRead: false } });
        (0, apiResponse_1.ok)(res, 'Notifications retrieved', { notifications, unreadCount }, (0, helpers_1.buildPaginationMeta)(total, Number(page), Number(limit)));
    }
    catch (error) {
        next(error);
    }
};
exports.getNotifications = getNotifications;
const markAsRead = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { notificationIds } = req.body;
        if (notificationIds?.length > 0) {
            await db_1.prisma.notification.updateMany({
                where: { id: { in: notificationIds }, userId },
                data: { isRead: true },
            });
        }
        else {
            // Mark all as read
            await db_1.prisma.notification.updateMany({
                where: { userId, isRead: false },
                data: { isRead: true },
            });
        }
        (0, apiResponse_1.ok)(res, 'Notifications marked as read');
    }
    catch (error) {
        next(error);
    }
};
exports.markAsRead = markAsRead;
//# sourceMappingURL=notification.controller.js.map