// modules/user/user.controller.ts

import { Request, Response } from "express";
import { getFeedService } from "./feed.service";

export const getFeedController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const { cursor, limit = 10 } = req.query;

    const data = await getFeedService({
      userId,
      cursor: cursor as string,
      limit: Number(limit),
      filter: req.query.filter as string,
    });

    res.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    console.error("Feeds Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
