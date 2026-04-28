import { updateHeartbeat } from "./lastActivity.service";


// POST /api/presence/heartbeat
export const heartbeatController = async (req: any, res: any) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "UserId required" });
    }

    await updateHeartbeat(userId);

    return res.json({ success: true });
  } catch (error) {
    console.error("Heartbeat Error:", error);
    return res.status(500).json({ success: false });
  }
};
