import { Request, Response } from "express";


import { recordUserActivityService } from "../activity/activity.service";
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