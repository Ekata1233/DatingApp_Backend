import { activateBoostService, getBoostProgressService, upgradeBoostService } from "./boost.service";
import { validateActivateBoost, validateUpgradeBoost } from "./boost.validation";
import { Request, Response } from "express";

export const upgradeBoostController = async (req: Request, res: Response) => {
  try {
   const userId = (req as any).user.id;

    // 1. Validate input
    const error = validateUpgradeBoost(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const { boost_option_id } = req.body;

    // 2. Call service
    const data = await upgradeBoostService(userId, boost_option_id);

    return res.status(201).json({
      success: true,
      message: "Boost assigned successfully (test mode)",
      data,
    });

  } catch (error: any) {
    console.error("Upgrade Boost Error:", error.message);

    const errorMap: any = {
      BOOST_OPTION_NOT_FOUND: "Boost option not found",
    };

    return res.status(400).json({
      success: false,
      message: errorMap[error.message] || "Something went wrong",
    });
  }
};

export const activateBoostController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // 1. Validate
    const error = validateActivateBoost(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const { user_boost_id } = req.body;

    // 2. Call service
    const data = await activateBoostService(userId, user_boost_id);

    return res.status(200).json({
      success: true,
      message: "Boost activated successfully",
      data,
    });

  } catch (error: any) {
    console.error("Activate Boost Error:", error.message);

    const errorMap: Record<string, string> = {

      BOOST_NOT_FOUND: "Boost package not found",
      UNAUTHORIZED: "Unauthorized",
      NO_BOOST_LEFT: "No boosts remaining",
      BOOST_EXPIRED: "Boost package expired",
      BOOST_ALREADY_ACTIVE: "Boost already active",
    };

    return res.status(400).json({
      success: false,
      message: errorMap[error.message] || "Something went wrong",
    });
  }
};

export const getBoostProgressController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized - User not authenticated",
      });
      return;
    }

    const data = await getBoostProgressService(
      userId
    );

    res.status(200).json({
      success: true,
      message: data.isBoostActive
        ? "Active boost progress fetched successfully"
        : "No active boost found",
      data,
    });

  } catch (error: any) {
    console.error(
      "GET BOOST PROGRESS ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch boost progress",
    });
  }
};
