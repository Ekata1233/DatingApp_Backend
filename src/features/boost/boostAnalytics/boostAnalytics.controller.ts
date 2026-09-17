import { getBoostHistoryService, getBoostPerformanceService } from "./boostAnalytics.service";
import { Request, Response } from "express";

export const getBoostHistoryController = async (
  req: Request,
  res: Response
) => {
  try {

    const userId = (req as any).user!.id;

    const page =
      Number(req.query.page) || 1;

    const limit =
      Number(req.query.limit) || 10;

    const data =
      await getBoostHistoryService(
        userId,
        page,
        limit
      );

    return res.status(200).json({
      success: true,
      message:
        "Boost history fetched successfully",
      data,
    });

  } catch (error) {

    console.error(
      "Boost History Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch boost history",
    });
  }
};

export const getBoostPerformanceController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;
    const usageId = req.params.usageId as string;

    const data = await getBoostPerformanceService(
      userId,
      usageId
    );

    return res.status(200).json({
      success: true,
      message: "Boost performance fetched successfully",
      data,
    });

  } catch (error: any) {

    if (error.message === "BOOST_USAGE_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Boost report not found",
      });
    }

    console.error("Boost Performance Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch boost performance",
    });
  }
};