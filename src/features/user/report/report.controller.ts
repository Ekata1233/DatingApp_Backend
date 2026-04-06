import { Request, Response } from "express";
import { reportUserService } from "./report.service";

export const reportUserController = async (req: Request, res: Response) => {
  try {
    // ✅ reporterId from token
    const reporterId = (req as any).user.id;

    // ✅ reportedId from body
    const { reportedId } = req.body;

    const report = await reportUserService(reporterId, reportedId);

    return res.status(200).json({
      success: true,
      message: "User reported successfully",
      data: report,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
