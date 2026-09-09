import { Request, Response } from "express";
import { getSharedItemsService } from "./sharedItem.service";
import { SharedItemType } from "./sharedItem.repository";

export const getSharedItemsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const conversationId =
      req.params.conversationId as string;

    const type = (
      (req.query.type as string) || "MEDIA"
    ).toUpperCase() as SharedItemType;

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    const result = await getSharedItemsService({
      userId,
      conversationId,
      type,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      message: "Shared items fetched successfully",
      ...result,
    });
  } catch (error: any) {
    console.error(
      "Get shared items error:",
      error,
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch shared items",
    });
  }
};