// modules/user/user.controller.ts

import { Request, Response } from "express";
import { getFeedService } from "./feed.service";
import { FeedMode } from "./feed.types";

export const getFeedController = async (req: Request, res: Response) => {
  try {
    // now user.id is available
    const userId = (req as any).user.id;

    const { cursor, limit = 10, mode } = req.query;

    // ✅ Validate mode
    if (
      !mode ||
      !["date_to_marry", "dating", "mature_connection"].includes(
        mode as string
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing mode",
      });
    }

    const data = await getFeedService({
      userId,
      cursor: cursor as string,
      limit: Number(limit),
     mode: mode as FeedMode,
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
