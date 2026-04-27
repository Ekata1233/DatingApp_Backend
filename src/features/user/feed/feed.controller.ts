import { Request, Response } from "express";
import { getFeedService } from "./feed.service";

export const getFeedController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const {
      cursor,
      limit = 10,
      mode,
    } = req.query;

    // ✅ SAFE BODY FILTERS (Postman support)
    let filters = req.body?.filters;

    if (typeof filters === "string") {
      filters = JSON.parse(filters);
    }

    const data = await getFeedService({
      userId,
      cursor: cursor as string,
      limit: Number(limit),
      mode: mode as string,
      filters,
    });

    return res.json({
      success: true,
      ...data,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
