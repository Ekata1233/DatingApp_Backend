import { Request, Response } from "express";
import { getProfileSummaryService, getUserDetailsService } from "./details.service";

export const getUserDetailsController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id as string;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await getUserDetailsService(id);

    return res.status(200).json({
      success: true,
      message: "User profile fetched successfully",
      data: user,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getProfileSummaryController = async (
    req: Request,
    res: Response,
  ) => {
    try {
      const userId =
        (req as any).user.id;

      const data =
        await getProfileSummaryService(
          userId,
        );

      return res.status(200).json({
        success: true,
        message:
          "Profile summary fetched successfully",
        data,
      });
    } catch (error: any) {
      console.error(
        "Get profile summary error:",
        error,
      );

      if (
        error.message ===
        "USER_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch profile summary",
      });
    }
  };