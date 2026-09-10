import { NotificationType } from "@prisma/client";

// Working on this file: src/features/notification/notification.repository.ts
export interface SaveDeviceTokenParams {
  userId: string;
  deviceToken: string;
}

export interface CreateNotificationParams {
  senderId: string;
  receiverId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export type NotificationCategory =
  | "ALL"
  | "LIKES_ROSES"
  | "MATCHES"
  | "GIFTS"
  | "DATES"
  | "EVENTS";

export const notificationCategoryMap: Record<
  Exclude<NotificationCategory, "ALL">,
  NotificationType[]
> = {
  LIKES_ROSES: [
    NotificationType.NEW_LIKE,
    NotificationType.NEW_ROSE,
    NotificationType.NEW_COMPLIMENT,
    NotificationType.SUPER_LIKE,
  ],

  MATCHES: [
    NotificationType.NEW_MATCH,
  ],

  GIFTS: [
    NotificationType.NEW_GIFT,
  ],

  DATES: [
    NotificationType.DATE_CONFIRMED,
    NotificationType.DATE_INVITE,
  ],

  EVENTS: [
    NotificationType.EVENT_INVITE,
    NotificationType.EVENT_RESPONSE,
  ],
};