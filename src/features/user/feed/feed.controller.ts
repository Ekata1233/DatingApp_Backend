import { Request, Response } from "express";
import { getFeedDetailsService, getFeedService } from "./feed.service";
import { FeedMode } from "./feed.types";

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
      mode: mode as FeedMode,
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


export const getFeedDetailsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const currentUserId = (req as any).user?.id;

    if (!currentUserId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized - User not authenticated'
      });
      return;
    }

    // Validate userId parameter
    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
      return;
    }

    if (typeof userId !== "string") {
      throw new Error("Invalid userId");
    }

    const userDetails = await getFeedDetailsService(userId, currentUserId);

    res.status(200).json({
      success: true,
      message: 'User feed details fetched successfully',
      data: userDetails,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error in getFeedDetailsController:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user details',
      timestamp: new Date().toISOString()
    });
  }
};