import { recordUserActivityService } from "../user/activity/activity.service";
import { updateHeartbeat } from "./lastActivity.service";


// POST /api/presence/heartbeat
export const heartbeatController = async (req: any, res: any) => {
  try {
     const userId = (req as any).user.id;
     const { sessionSeconds } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "Unauthorized" });
    }

    await updateHeartbeat(userId);

// Activity calculation only for qualifying foreground sessions
    if (
      typeof sessionSeconds === "number" &&
      Number.isFinite(sessionSeconds) &&
      sessionSeconds >= 10
    ) {
      await recordUserActivityService(
        userId,
        sessionSeconds
      );
    }

    return res.json({
      success: true,
      message: "Heartbeat updated",
    });  } catch (error) {
    console.error("Heartbeat Error:", error);
    return res.status(500).json({ success: false });
  }
};
