import { Request, Response } from "express";


import { getUserActivityCardService, recordUserActivityService } from "../activity/activity.service";
import { updateHeartbeat } from "../../lastActivity/lastActivity.service";

export const heartbeatController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user?.id;
    const { sessionSeconds } = req.body ?? {};

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Existing Redis heartbeat.
    await updateHeartbeat(userId);

    // Existing clients can still send an empty heartbeat.
    if (sessionSeconds === undefined) {
      return res.status(200).json({
        success: true,
        message: "Presence heartbeat updated",
      });
    }

    if (
      typeof sessionSeconds !== "number" ||
      !Number.isFinite(sessionSeconds) ||
      sessionSeconds < 10
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid foreground session duration",
      });
    }

    const activity = await recordUserActivityService(
      userId,
      sessionSeconds
    );

    return res.status(200).json({
      success: true,
      message: "Activity updated successfully",
      data: activity,
    });
  } catch (error) {
    console.error("Heartbeat Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update heartbeat",
    });
  }
};

// ==========================================
// GET USER ACTIVITY CARD CONTROLLER
// ==========================================

export const getUserActivityCardController = async (
  req: Request,
  res: Response
) => {
  try {
    const currentUserId = (req as any).user?.id;
    const { userId } = req.params;

    // ========================================
    // 1. VALIDATE AUTHENTICATION
    // ========================================

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // ========================================
    // 2. VALIDATE USER ID
    // ========================================

    if (
      typeof userId !== "string" ||
      !userId
    ) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // ========================================
    // 3. FETCH ACTIVITY CARD
    // ========================================

    const result = await getUserActivityCardService(
      currentUserId,
      userId
    );

    // ========================================
    // 4. ACTIVITY NOT AVAILABLE
    // ========================================

    if (!result) {
      return res.status(200).json({
        success: true,
        message: "Activity information is not available",
        data: null,
      });
    }

    // ========================================
    // 5. SUCCESS RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,
      message: "Activity card fetched successfully",
      data: result,
    });

  } catch (error: any) {
    console.error(
      "Get Activity Card Error:",
      error
    );

    if (
      error.message === "User not found" ||
      error.message === "Current user not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch activity card",
    });
  }
};