

// =====================================================
// FIND ACTIVE BOOST
// =====================================================

import { BoostEventType, BoostUsageStatus } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";

export const findActiveBoostUsageRepository = async (
  userId: string
) => {
  const now = new Date();

  console.log("\n========== FIND ACTIVE BOOST ==========");

  console.log("[REPOSITORY] User ID:", userId);
  console.log("[REPOSITORY] Current Time:", now.toISOString());

  // DEBUG: Get all recent Boost usages
  const allUsages = await prisma.boostUsage.findMany({
    where: {
      user_id: userId,
    },
    select: {
      id: true,
      user_id: true,
      boost_type: true,
      status: true,
      is_active: true,
      started_at: true,
      expected_end_at: true,
      total_interests: true,
    },
    orderBy: {
      started_at: "desc",
    },
    take: 5,
  });

  console.log(
    "[REPOSITORY] Recent Boost Usages:",
    JSON.stringify(allUsages, null, 2)
  );

  // Existing active Boost query
  const activeUsage = await prisma.boostUsage.findFirst({
    where: {
      user_id: userId,
      status: BoostUsageStatus.ACTIVE,
      is_active: true,
      started_at: {
        lte: now,
      },
      expected_end_at: {
        gt: now,
      },
    },
    include: {
      boost: true,
      userBoost: {
        include: {
          boostOption: true,
        },
      },
    },
    orderBy: {
      started_at: "desc",
    },
  });

  if (!activeUsage) {
    console.log("[REPOSITORY] NO ACTIVE BOOST FOUND");

    allUsages.forEach((usage) => {
      console.log("[REPOSITORY] Checking usage:", usage.id);

      console.log(
        "Status ACTIVE:",
        usage.status === BoostUsageStatus.ACTIVE
      );

      console.log(
        "Is Active:",
        usage.is_active === true
      );

      console.log(
        "Started:",
        usage.started_at <= now
      );

      console.log(
        "Not Expired:",
        usage.expected_end_at > now
      );
    });

  } else {
    console.log(
      "[REPOSITORY] ACTIVE BOOST FOUND:",
      activeUsage.id
    );
  }

  console.log("=======================================\n");

  return activeUsage;
};

// =====================================================
// CREATE EVENT
// =====================================================

export const createBoostEventRepository = async (
  tx: any,
  data: {
    boostUsageId: string;
    boostedUserId: string;
    actorId?: string;
    eventType: BoostEventType;
  }
) => {
  console.log("[BOOST EVENT] Creating event:", data);

  const event = await tx.boostEvent.create({
    data: {
      boostUsage: {
        connect: {
          id: data.boostUsageId,
        },
      },

      // User who owns the active Boost
      user: {
        connect: {
          id: data.boostedUserId,
        },
      },

      // User who sent the Rose / Compliment / Gift
      ...(data.actorId
        ? {
            actor: {
              connect: {
                id: data.actorId,
              },
            },
          }
        : {}),

      event_type: data.eventType,
    },
  });

  console.log("[BOOST EVENT] Created:", event.id);

  return event;
};

// =====================================================
// UPDATE USAGE COUNTERS
// =====================================================

export const incrementBoostUsageRepository = async (
  tx: any,
  usageId: string,
  field:
    | "total_impressions"
    | "total_views"
    | "total_likes"
    | "total_superlikes"
    | "total_interests"
    | "total_matches"
    | "total_reach"
) => {
  return tx.boostUsage.update({
    where: {
      id: usageId,
    },
    data: {
      [field]: {
        increment: 1,
      },
    },
  });
};

// =====================================================
// HOURLY STATS
// =====================================================

export const upsertHourlyStatRepository = async (
  tx: any,
  usageId: string,
  hour: Date,
  field:
    | "impressions"
    | "reach"
    | "views"
    | "likes"
    | "superlikes"
    | "interests"
    | "matches"
) => {
  return tx.boostHourlyStats.upsert({
    where: {
      boost_usage_id_hour: {
        boost_usage_id: usageId,
        hour,
      },
    },

    create: {
      boost_usage_id: usageId,
      hour,
      [field]: 1,
    },

    update: {
      [field]: {
        increment: 1,
      },
    },
  });
};

// =====================================================
// REACH USER
// =====================================================

export const upsertReachUserRepository = async (
  tx: any,
  usageId: string,
  actorId: string
) => {
  const existing = await tx.boostReachUser.findUnique({
    where: {
      boost_usage_id_actor_id: {
        boost_usage_id: usageId,
        actor_id: actorId,
      },
    },
  });

  if (existing) {
    await tx.boostReachUser.update({
      where: {
        id: existing.id,
      },
      data: {
        last_seen_at: new Date(),
        impression_count: {
          increment: 1,
        },
      },
    });

    return {
      isNewReach: false,
    };
  }

  await tx.boostReachUser.create({
    data: {
      boost_usage_id: usageId,
      actor_id: actorId,
    },
  });

  return {
    isNewReach: true,
  };
};

// =====================================================
// HISTORY
// =====================================================

// export const getBoostHistoryRepository = async (
//   userId: string,
//   skip: number,
//   take: number
// ) => {
//   return prisma.boostUsage.findMany({
//     where: {
//       user_id: userId,

//       status: {
//         in: [
//           BoostUsageStatus.ACTIVE,
//           BoostUsageStatus.COMPLETED,
//           BoostUsageStatus.EXPIRED,
//           BoostUsageStatus.CANCELLED,
//         ],
//       },
//     },

//     include: {
//       boost: {
//         select: {
//           id: true,
//           name: true,
//           title: true,
//         },
//       },
//     },

//     orderBy: {
//       started_at: "desc",
//     },

//     skip,
//     take,
//   });
// };

export const getBoostHistoryRepository = async (
  userId: string,
  skip: number,
  take: number
) => {
  return prisma.boostUsage.findMany({
    where: {
      user_id: userId,
    },

    include: {
      boost: {
        select: {
          id: true,
          name: true,
          title: true,
        },
      },
    },

    orderBy: {
      started_at: "desc",
    },

    skip,
    take,
  });
};

// =====================================================
// LIFETIME
// =====================================================

export const getLifetimeBoostStatsRepository = async (
  userId: string
) => {
  return prisma.userBoostStats.findUnique({
    where: {
      user_id: userId,
    },
  });
};

// =====================================================
// PERFORMANCE REPORT
// =====================================================

export const getBoostPerformanceRepository = async (
  userId: string,
  usageId: string
) => {
  return prisma.boostUsage.findFirst({
    where: {
      id: usageId,
      user_id: userId,
    },

    include: {
      boost: true,

      hourlyStats: {
        orderBy: {
          hour: "asc",
        },
      },

      demographicStats: {
        orderBy: {
          count: "desc",
        },
      },
    },
  });
};