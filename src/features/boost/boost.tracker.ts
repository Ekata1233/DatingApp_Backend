// import { prisma } from "../../prisma/prismaClient";
// import { BoostEventType } from "@prisma/client";

// const fieldMap = {
//   VIEW: "total_views",
//   LIKE: "total_likes",
//   SUPERLIKE: "total_superlikes",
//   INTEREST: "total_interests",
//   REACH: "total_reach",
//   MATCH: "total_matches",
//   PASS: "total_passes",
// } as const;

// const eventTypeMap = {
//   VIEW: BoostEventType.PROFILE_VIEW,
//   LIKE: BoostEventType.LIKE,
//   SUPERLIKE: BoostEventType.SUPERLIKE,
//   INTEREST: BoostEventType.INTEREST,
//   REACH: BoostEventType.IMPRESSION,
//   MATCH: BoostEventType.MATCH,
//   PASS: BoostEventType.PASS,
// } as const;

// export const trackBoostEvent = async ({
//   targetUserId,
//   actorId,
//   type,
// }: {
//   targetUserId: string;
//   actorId: string;
//   type:
//   | "VIEW"
//   | "LIKE"
//   | "SUPERLIKE"
//   | "INTEREST"
//   | "REACH"
//   | "MATCH"
//   | "PASS";
// }) => {
//   const activeBoost = await prisma.boostUsage.findFirst({
//     where: {
//       user_id: targetUserId,
//       is_active: true,
//       ended_at: null,
//     },
//   });

//   if (!activeBoost) return;

//   const field = fieldMap[type];
//   const eventType = eventTypeMap[type];

//   // Prevent duplicate VIEW/REACH events
//   if (type === "VIEW" || type === "REACH") {
//     const exists = await prisma.boostEvent.findFirst({
//       where: {
//         boost_usage_id: activeBoost.id,
//         actor_id: actorId,
//         event_type: eventType,
//       },
//     });

//     if (exists) return;
//   }

//   await prisma.$transaction([
//     prisma.boostUsage.update({
//       where: {
//         id: activeBoost.id,
//       },
//       data: {
//         [field]: {
//           increment: 1,
//         },
//       },
//     }),

//     prisma.userBoostStats.upsert({
//       where: {
//         user_id: targetUserId,
//       },
//       update: {
//         [field]: {
//           increment: 1,
//         },
//       },
//       create: {
//         user_id: targetUserId,
//         [field]: 1,
//       },
//     }),

//     prisma.boostEvent.create({
//       data: {
//         boost_usage_id: activeBoost.id,
//         user_id: targetUserId,
//         actor_id: actorId,
//         event_type: eventType,
//       },
//     }),
//   ]);
// };

import { BoostEventType } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";

// ============================================================
// TYPES
// ============================================================

export type TrackBoostEventType =
  | "IMPRESSION"
  | "PROFILE_VIEW"
  | "LIKE"
  | "SUPERLIKE"
  | "INTEREST"
  | "MATCH"
  | "PASS";

// ============================================================
// EVENT TYPE MAP
// ============================================================

const eventTypeMap: Record<TrackBoostEventType, BoostEventType> = {
  IMPRESSION: BoostEventType.IMPRESSION,
  PROFILE_VIEW: BoostEventType.PROFILE_VIEW,
  LIKE: BoostEventType.LIKE,
  SUPERLIKE: BoostEventType.SUPERLIKE,
  INTEREST: BoostEventType.INTEREST,
  MATCH: BoostEventType.MATCH,
  PASS: BoostEventType.PASS,
};

// ============================================================
// COUNTER FIELD MAP
//
// PASS is not included because your current schema does not
// contain total_passes.
//
// IMPRESSION is handled separately because it also handles
// unique REACH.
// ============================================================

type BoostCounterField =
  | "total_impressions"
  | "total_views"
  | "total_likes"
  | "total_superlikes"
  | "total_interests"
  | "total_matches";

const fieldMap: Partial<
  Record<TrackBoostEventType, BoostCounterField>
> = {
  IMPRESSION: "total_impressions",
  PROFILE_VIEW: "total_views",
  LIKE: "total_likes",
  SUPERLIKE: "total_superlikes",
  INTEREST: "total_interests",
  MATCH: "total_matches",
};

// ============================================================
// TRACK BOOST EVENT
// ============================================================

export const trackBoostEvent = async ({
  targetUserId,
  actorId,
  type,
}: {
  targetUserId: string;
  actorId: string;
  type: TrackBoostEventType;
}) => {
  // ==========================================================
  // 1. PREVENT SELF TRACKING
  // ==========================================================

  if (targetUserId === actorId) {
    return;
  }

  const now = new Date();

  // ==========================================================
  // 2. FIND ACTIVE BOOST
  // ==========================================================

  const activeBoost = await prisma.boostUsage.findFirst({
    where: {
      user_id: targetUserId,

      is_active: true,

      status: "ACTIVE",

      started_at: {
        lte: now,
      },

      expected_end_at: {
        gt: now,
      },
    },

    orderBy: {
      started_at: "desc",
    },
  });

  // User doesn't currently have an active boost
  if (!activeBoost) {
    return;
  }

  // ==========================================================
  // 3. GET PRISMA EVENT TYPE
  // ==========================================================

  const eventType = eventTypeMap[type];

  // ==========================================================
  // 4. MATCH
  //
  // MATCH should only be counted once per actor for the
  // current boost session.
  //
  // Your match service should ideally call this only when
  // a NEW match is actually created.
  // ==========================================================

  if (type === "MATCH") {
    const existingMatchEvent = await prisma.boostEvent.findFirst({
      where: {
        boost_usage_id: activeBoost.id,
        actor_id: actorId,
        event_type: BoostEventType.MATCH,
      },
    });

    if (existingMatchEvent) {
      return;
    }
  }

  // ==========================================================
  // 5. IMPRESSION
  //
  // IMPRESSION:
  // Every time an actor sees the boosted profile.
  //
  // REACH:
  // Unique actor who sees the boosted profile during this
  // boost session.
  //
  // Same actor:
  // Impression +1
  // Reach       +0
  //
  // New actor:
  // Impression +1
  // Reach       +1
  // ==========================================================

  if (type === "IMPRESSION") {
    await prisma.$transaction(async (tx) => {
      // ------------------------------------------------------
      // A. CREATE RAW IMPRESSION EVENT
      // ------------------------------------------------------

      await tx.boostEvent.create({
        data: {
          boost_usage_id: activeBoost.id,
          user_id: targetUserId,
          actor_id: actorId,
          event_type: BoostEventType.IMPRESSION,
        },
      });

      // ------------------------------------------------------
      // B. CURRENT BOOST IMPRESSION +1
      // ------------------------------------------------------

      await tx.boostUsage.update({
        where: {
          id: activeBoost.id,
        },

        data: {
          total_impressions: {
            increment: 1,
          },
        },
      });

      // ------------------------------------------------------
      // C. LIFETIME IMPRESSION +1
      // ------------------------------------------------------

      await tx.userBoostStats.upsert({
        where: {
          user_id: targetUserId,
        },

        update: {
          total_impressions: {
            increment: 1,
          },
        },

        create: {
          user_id: targetUserId,
          total_impressions: 1,
        },
      });

      // ------------------------------------------------------
      // D. CHECK WHETHER ACTOR IS ALREADY IN REACH
      // ------------------------------------------------------

      const existingReach = await tx.boostReachUser.findUnique({
        where: {
          boost_usage_id_actor_id: {
            boost_usage_id: activeBoost.id,
            actor_id: actorId,
          },
        },
      });

      // ------------------------------------------------------
      // E. NEW UNIQUE REACH
      // ------------------------------------------------------

      if (!existingReach) {
        await tx.boostReachUser.create({
          data: {
            boost_usage_id: activeBoost.id,
            actor_id: actorId,

            impression_count: 1,

            first_seen_at: now,
            last_seen_at: now,
          },
        });

        // ----------------------------------------------------
        // CURRENT BOOST REACH +1
        // ----------------------------------------------------

        await tx.boostUsage.update({
          where: {
            id: activeBoost.id,
          },

          data: {
            total_reach: {
              increment: 1,
            },
          },
        });

        // ----------------------------------------------------
        // LIFETIME REACH +1
        // ----------------------------------------------------

        await tx.userBoostStats.upsert({
          where: {
            user_id: targetUserId,
          },

          update: {
            total_reach: {
              increment: 1,
            },
          },

          create: {
            user_id: targetUserId,
            total_reach: 1,
          },
        });
      } else {
        // ----------------------------------------------------
        // SAME ACTOR SAW PROFILE AGAIN
        //
        // impression_count +1
        // reach does NOT increase
        // ----------------------------------------------------

        await tx.boostReachUser.update({
          where: {
            boost_usage_id_actor_id: {
              boost_usage_id: activeBoost.id,
              actor_id: actorId,
            },
          },

          data: {
            impression_count: {
              increment: 1,
            },

            last_seen_at: now,
          },
        });
      }
    });

    return;
  }

  // ==========================================================
  // 6. PASS
  //
  // PASS is stored as raw event only.
  //
  // Current schema does NOT have:
  // total_passes
  //
  // Therefore we don't update BoostUsage/UserBoostStats.
  // ==========================================================

  if (type === "PASS") {
    await prisma.boostEvent.create({
      data: {
        boost_usage_id: activeBoost.id,
        user_id: targetUserId,
        actor_id: actorId,
        event_type: BoostEventType.PASS,
      },
    });

    return;
  }

  // ==========================================================
  // 7. PROFILE VIEW
  //
  // Every profile view is recorded.
  //
  // BoostUsage.total_views +1
  // UserBoostStats.total_views +1
  // ==========================================================

  if (type === "PROFILE_VIEW") {
    await prisma.$transaction(async (tx) => {
      await tx.boostEvent.create({
        data: {
          boost_usage_id: activeBoost.id,
          user_id: targetUserId,
          actor_id: actorId,
          event_type: BoostEventType.PROFILE_VIEW,
        },
      });

      await tx.boostUsage.update({
        where: {
          id: activeBoost.id,
        },

        data: {
          total_views: {
            increment: 1,
          },
        },
      });

      await tx.userBoostStats.upsert({
        where: {
          user_id: targetUserId,
        },

        update: {
          total_views: {
            increment: 1,
          },
        },

        create: {
          user_id: targetUserId,
          total_views: 1,
        },
      });
    });

    return;
  }

  // ==========================================================
  // 8. LIKE
  //
  // BoostUsage.total_likes +1
  // UserBoostStats.total_likes +1
  // ==========================================================

  if (type === "LIKE") {
    await prisma.$transaction(async (tx) => {
      await tx.boostEvent.create({
        data: {
          boost_usage_id: activeBoost.id,
          user_id: targetUserId,
          actor_id: actorId,
          event_type: BoostEventType.LIKE,
        },
      });

      await tx.boostUsage.update({
        where: {
          id: activeBoost.id,
        },

        data: {
          total_likes: {
            increment: 1,
          },
        },
      });

      await tx.userBoostStats.upsert({
        where: {
          user_id: targetUserId,
        },

        update: {
          total_likes: {
            increment: 1,
          },
        },

        create: {
          user_id: targetUserId,
          total_likes: 1,
        },
      });
    });

    return;
  }

  // ==========================================================
  // 9. SUPERLIKE
  //
  // BoostUsage.total_superlikes +1
  // UserBoostStats.total_superlikes +1
  // ==========================================================

  if (type === "SUPERLIKE") {
    await prisma.$transaction(async (tx) => {
      await tx.boostEvent.create({
        data: {
          boost_usage_id: activeBoost.id,
          user_id: targetUserId,
          actor_id: actorId,
          event_type: BoostEventType.SUPERLIKE,
        },
      });

      await tx.boostUsage.update({
        where: {
          id: activeBoost.id,
        },

        data: {
          total_superlikes: {
            increment: 1,
          },
        },
      });

      await tx.userBoostStats.upsert({
        where: {
          user_id: targetUserId,
        },

        update: {
          total_superlikes: {
            increment: 1,
          },
        },

        create: {
          user_id: targetUserId,
          total_superlikes: 1,
        },
      });
    });

    return;
  }

  // ==========================================================
  // 10. INTEREST
  //
  // BoostUsage.total_interests +1
  // UserBoostStats.total_interests +1
  // ==========================================================

  if (type === "INTEREST") {
    await prisma.$transaction(async (tx) => {
      await tx.boostEvent.create({
        data: {
          boost_usage_id: activeBoost.id,
          user_id: targetUserId,
          actor_id: actorId,
          event_type: BoostEventType.INTEREST,
        },
      });

      await tx.boostUsage.update({
        where: {
          id: activeBoost.id,
        },

        data: {
          total_interests: {
            increment: 1,
          },
        },
      });

      await tx.userBoostStats.upsert({
        where: {
          user_id: targetUserId,
        },

        update: {
          total_interests: {
            increment: 1,
          },
        },

        create: {
          user_id: targetUserId,
          total_interests: 1,
        },
      });
    });

    return;
  }

  // ==========================================================
  // 11. MATCH
  //
  // Duplicate MATCH for same actor was already checked above.
  //
  // BoostUsage.total_matches +1
  // UserBoostStats.total_matches +1
  // ==========================================================

  if (type === "MATCH") {
    await prisma.$transaction(async (tx) => {
      await tx.boostEvent.create({
        data: {
          boost_usage_id: activeBoost.id,
          user_id: targetUserId,
          actor_id: actorId,
          event_type: BoostEventType.MATCH,
        },
      });

      await tx.boostUsage.update({
        where: {
          id: activeBoost.id,
        },

        data: {
          total_matches: {
            increment: 1,
          },
        },
      });

      await tx.userBoostStats.upsert({
        where: {
          user_id: targetUserId,
        },

        update: {
          total_matches: {
            increment: 1,
          },
        },

        create: {
          user_id: targetUserId,
          total_matches: 1,
        },
      });
    });

    return;
  }
};