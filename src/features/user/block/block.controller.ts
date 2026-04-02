import { Request, Response } from "express";
import { blockUserService } from "./block.service";

export const blockUserController = async (req: Request, res: Response) => {
  try {
    // ✅ blockerId from token
    const blockerId = (req as any).user.id;

    // ✅ blockedId from body
    const { blockedId } = req.body;

    const block = await blockUserService(blockerId, blockedId);

    return res.status(200).json({
      success: true,
      message: "User blocked successfully",
      data: block,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
