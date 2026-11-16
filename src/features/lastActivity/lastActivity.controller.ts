// import { recordUserActivityService } from "../user/activity/activity.service";
// import { updateHeartbeat } from "./lastActivity.service";

// // POST /api/presence/heartbeat
// export const heartbeatController = async (req: any, res: any) => {
//   try {
//     const userId = (req as any).user.id;
//     const { sessionSeconds } = req.body;

//     if (!userId) {
//       return res.status(400).json({ success: false, message: "Unauthorized" });
//     }

//     await updateHeartbeat(userId);

//     // Activity calculation only for qualifying foreground sessions
//     if (
//       typeof sessionSeconds === "number" &&
//       Number.isFinite(sessionSeconds) &&
//       sessionSeconds >= 10
//     ) {
//       await recordUserActivityService(userId, sessionSeconds);
//     }

//     return res.json({
//       success: true,
//       message: "Heartbeat updated",
//     });
//   } catch (error) {
//     console.error("Heartbeat Error:", error);
//     return res.status(500).json({ success: false });
//   }
// };


import { randomUUID } from "crypto";

import { redis } from "../../lib/redis";
import { recordUserActivityService } from "../user/activity/activity.service";
import { updateHeartbeat } from "./lastActivity.service";

// =====================================================
// GET CURRENT IST DATE
// =====================================================

const getIstDate = (): string => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const getPart = (type: string) =>
    parts.find((part) => part.type === type)?.value;

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
};

// =====================================================
// SECONDS UNTIL NEXT IST MIDNIGHT
// =====================================================

const getSecondsUntilIstMidnight = (): number => {
  const now = Date.now();

  const IST_OFFSET = 5.5 * 60 * 60 * 1000;
  const DAY_MS = 24 * 60 * 60 * 1000;

  const istNow = now + IST_OFFSET;

  const nextMidnight =
    Math.floor(istNow / DAY_MS) * DAY_MS + DAY_MS;

  return Math.max(
    1,
    Math.ceil((nextMidnight - istNow) / 1000)
  );
};

// =====================================================
// POST /api/presence/heartbeat
// =====================================================

export const heartbeatController = async (
  req: any,
  res: any
) => {
  try {
    const userId = req.user?.id;
    const { sessionSeconds } = req.body ?? {};

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // ==========================================
    // 1. UPDATE PRESENCE
    // ==========================================

    await updateHeartbeat(userId);

    // ==========================================
    // 2. VALIDATE ACTIVITY DURATION
    // ==========================================

    if (
      typeof sessionSeconds !== "number" ||
      !Number.isFinite(sessionSeconds) ||
      sessionSeconds < 10
    ) {
      return res.status(200).json({
        success: true,
        message: "Presence heartbeat updated",
        activityRecorded: false,
      });
    }

    // ==========================================
    // 3. REDIS KEYS
    // ==========================================

    const today = getIstDate();

    const activityKey =
      `activity:recorded:${userId}:${today}`;

    const lockKey =
      `activity:lock:${userId}:${today}`;

    // ==========================================
    // 4. CHECK IF ALREADY RECORDED
    // ==========================================

    const alreadyRecorded =
      await redis.get(activityKey);

    if (alreadyRecorded) {
      return res.status(200).json({
        success: true,
        message: "Presence updated. Activity already recorded today.",
        activityRecorded: false,
        reason: "ALREADY_RECORDED_TODAY",
      });
    }

    // ==========================================
    // 5. ACQUIRE REDIS LOCK
    // ==========================================

    const lockToken = randomUUID();

    const lockAcquired = await redis.set(
      lockKey,
      lockToken,
      {
        nx: true,
        ex: 30,
      }
    );

    if (lockAcquired !== "OK") {
      return res.status(200).json({
        success: true,
        message: "Presence updated. Activity recording in progress.",
        activityRecorded: false,
        reason: "ACTIVITY_PROCESSING",
      });
    }

    // ==========================================
    // 6. RECORD ACTIVITY IN DATABASE
    // ==========================================

    try {
      // Recheck after acquiring the lock
      const recordedAfterLock =
        await redis.get(activityKey);

      if (recordedAfterLock) {
        return res.status(200).json({
          success: true,
          message: "Activity already recorded today",
          activityRecorded: false,
          reason: "ALREADY_RECORDED_TODAY",
        });
      }

      await recordUserActivityService(
        userId,
        sessionSeconds
      );

      // ========================================
      // 7. MARK ACTIVITY RECORDED IN REDIS
      // ========================================

      await redis.set(
        activityKey,
        "1",
        {
          ex: getSecondsUntilIstMidnight(),
        }
      );

      return res.status(200).json({
        success: true,
        message: "Presence and activity updated successfully",
        activityRecorded: true,
        activityDate: today,
      });

    } finally {
      // Release only the lock owned by this request.
      // Compare-and-delete is atomic in Redis.
      await redis.eval(
        `if redis.call("GET", KEYS[1]) == ARGV[1] then
           return redis.call("DEL", KEYS[1])
         else
           return 0
         end`,
        [lockKey],
        [lockToken]
      );
    }

  } catch (error) {
    console.error("Heartbeat Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update heartbeat",
    });
  }
};