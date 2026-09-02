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
