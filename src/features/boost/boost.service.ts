import { prisma } from "../../prisma/prismaClient";

export const upgradeBoostService = async (userId: string, boost_option_id: string) => {
  const now = new Date();

  const nextReset = new Date(now);
  nextReset.setDate(nextReset.getDate() + 7);
  // 1. Validate BoostOption
  const boostOption = await prisma.boostOption.findUnique({
    where: { id: boost_option_id },
    include: {
      boost: true,
    },
  });

  if (!boostOption) {
    throw new Error("BOOST_OPTION_NOT_FOUND");
  }

  // 2. Create UserBoost (simulate purchase)
  const userBoost = await prisma.userBoost.create({
    data: {
      user_id: userId,
      boostId: boostOption.boost_id,
      boost_option_id: boostOption.id,
      total_boosts: boostOption.boostCount,
      remaining_boosts: boostOption.boostCount,
      weeklyLimit: boostOption.boostCount,
      last_reset_at: now,
      next_reset_at: nextReset,
      is_active: true,
      start_at: new Date(),
      // optional expiry (example: 7 days)
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return userBoost;
};

export const activateBoostService = async (userId: string, user_boost_id: string) => {
  // 1. Fetch user boost
  console.log("user boost id : ", user_boost_id)
  const userBoost = await prisma.userBoost.findUnique({
    where: { id: user_boost_id },
  });

  console.log("user boost : ", userBoost)

  if (!userBoost) {
    throw new Error("BOOST_NOT_FOUND");
  }

  // 2. Ownership check
  if (userBoost.user_id !== userId) {
    throw new Error("UNAUTHORIZED");
  }

  // 3. Remaining check
  if (userBoost.remaining_boosts <= 0) {
    throw new Error("NO_BOOST_LEFT");
  }

  // 4. Expiry check
  if (userBoost.expires_at && userBoost.expires_at < new Date()) {
    throw new Error("BOOST_EXPIRED");
  }

  // 5. Check active boost
  const activeBoost = await prisma.boostUsage.findFirst({
    where: {
      user_id: userId,
      is_active: true,
    },
  });

  if (activeBoost) {
    throw new Error("BOOST_ALREADY_ACTIVE");
  }

  // 6. Get duration
  if (!userBoost.boost_option_id) {
    throw new Error("BOOST_OPTION_NOT_FOUND");
  }
  const boostOption = await prisma.boostOption.findUnique({
    where: { id: userBoost.boost_option_id },
  });

  const duration = boostOption?.timePerBoost || 30;

  const now = new Date();
  const endTime = new Date(now.getTime() + duration * 60 * 1000);

  // 7. Transaction
  const result = await prisma.$transaction(async (tx) => {
    const usage = await tx.boostUsage.create({
      data: {
        user_boost_id,
        user_id: userId,
        duration,
        started_at: now,

        expected_end_at: endTime, // ✅ required field

        ended_at: null,
        is_active: true,
      },
    });

    await tx.userBoost.update({
      where: { id: user_boost_id },
      data: {
        remaining_boosts: {
          decrement: 1,
        },
      },
    });

    return usage;
  });

  return result;
};

export const getBoostProgressService = async (
  userId: string
) => {
  const now = new Date();

  // ==========================================
  // 1. FIND CURRENT ACTIVE BOOST
  // ==========================================

  const activeBoost = await prisma.boostUsage.findFirst({
    where: {
      user_id: userId,
      status: "ACTIVE",
      is_active: true,
      started_at: {
        lte: now,
      },
      expected_end_at: {
        gt: now,
      },
    },
    select: {
      id: true,
      user_boost_id: true,
      boost_id: true,
      boost_type: true,
      title: true,
      display_name: true,
      duration: true,
      started_at: true,
      expected_end_at: true,
      status: true,
      is_active: true,
    },
    orderBy: {
      started_at: "desc",
    },
  });

  // ==========================================
  // 2. NO ACTIVE BOOST
  // ==========================================

  if (!activeBoost) {
    return {
      isBoostActive: false,
      status: "INACTIVE",

      boost: null,

      timer: {
        totalDurationSeconds: 0,
        elapsedSeconds: 0,
        remainingSeconds: 0,
        remainingMinutes: 0,
        progressPercentage: 0,
        elapsedPercentage: 100,
        formattedRemainingTime: "00:00",
      },

      serverTime: now.toISOString(),
    };
  }

  // ==========================================
  // 3. FETCH BOOST DETAILS
  // ==========================================

  let boostDetails: {
    id: string;
    name: string;
    title: string;
  } | null = null;

  // First try boost_id from BoostUsage
  let resolvedBoostId = activeBoost.boost_id;

  // If boost_id is null, check UserBoost
  if (!resolvedBoostId) {
    const userBoost = await prisma.userBoost.findUnique({
      where: {
        id: activeBoost.user_boost_id,
      },
      select: {
        boostId: true,
      },
    });

    resolvedBoostId = userBoost?.boostId ?? null;
  }

  // Fetch actual Boost information
  if (resolvedBoostId) {
    boostDetails = await prisma.boost.findUnique({
      where: {
        id: resolvedBoostId,
      },
      select: {
        id: true,
        name: true,
        title: true,
      },
    });
  }

  console.log("========== BOOST PROGRESS DEBUG ==========");
  console.log("USER ID:", userId);
  console.log("BOOST USAGE ID:", activeBoost.id);
  console.log("USER BOOST ID:", activeBoost.user_boost_id);
  console.log("RESOLVED BOOST ID:", resolvedBoostId);
  console.log("BOOST DETAILS:", boostDetails);
  console.log("==========================================");

  // ==========================================
  // 4. CALCULATE BOOST DURATION
  // ==========================================

  const startTime = activeBoost.started_at.getTime();

  const endTime = activeBoost.expected_end_at.getTime();

  const currentTime = now.getTime();

  const totalDurationSeconds = Math.max(
    0,
    Math.ceil((endTime - startTime) / 1000)
  );

  const remainingSeconds = Math.max(
    0,
    Math.ceil((endTime - currentTime) / 1000)
  );

  const elapsedSeconds = Math.min(
    totalDurationSeconds,
    Math.max(
      0,
      Math.floor((currentTime - startTime) / 1000)
    )
  );

  // ==========================================
  // 5. PROGRESS CALCULATION
  // ==========================================

  const progressPercentage =
    totalDurationSeconds > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (remainingSeconds / totalDurationSeconds) * 100
          )
        )
      : 0;

  const elapsedPercentage = 100 - progressPercentage;

  // ==========================================
  // 6. FORMAT REMAINING TIME
  // ==========================================

  const hours = Math.floor(
    remainingSeconds / 3600
  );

  const minutes = Math.floor(
    (remainingSeconds % 3600) / 60
  );

  const seconds = remainingSeconds % 60;

  const formattedRemainingTime =
    hours > 0
      ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // ==========================================
  // 7. FINAL RESPONSE
  // ==========================================

  return {
    isBoostActive: true,
    status: "ACTIVE",

    boost: {
      boostUsageId: activeBoost.id,

      userBoostId: activeBoost.user_boost_id,

      boostId:
        activeBoost.boost_id ??
        boostDetails?.id ??
        null,

      boostType:
        activeBoost.boost_type ??
        boostDetails?.name ??
        null,

      title:
        activeBoost.title ??
        boostDetails?.title ??
        null,

      displayName:
        activeBoost.display_name ??
        boostDetails?.title ??
        null,

      durationMinutes: activeBoost.duration,

      startedAt: activeBoost.started_at,

      expectedEndAt: activeBoost.expected_end_at,
    },

    timer: {
      totalDurationSeconds,

      elapsedSeconds,

      remainingSeconds,

      remainingMinutes: Math.ceil(
        remainingSeconds / 60
      ),

      progressPercentage: Number(
        progressPercentage.toFixed(2)
      ),

      elapsedPercentage: Number(
        elapsedPercentage.toFixed(2)
      ),

      formattedRemainingTime,
    },

    serverTime: now.toISOString(),
  };
};