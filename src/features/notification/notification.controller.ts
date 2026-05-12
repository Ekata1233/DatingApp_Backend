// Working on this file: src/features/notification/notification.repository.ts
import * as service from "./notification.service";
import { Request, Response } from "express";

export const getUserNotifications = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;

  const data = await service.getNotifications(userId);

  res.json({ success: true, data });
};

export const markRead = async (req: Request, res: Response) => {
  const { id } = req.params;

  const data = await service.markAsRead(id);

  res.json({ success: true, data });
};