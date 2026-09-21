import {
  BoostDemographicType,
  BoostEventType,
} from "@prisma/client";


import {
  findActiveBoostUsageRepository,
  createBoostEventRepository,
  incrementBoostUsageRepository,
  upsertHourlyStatRepository,
  upsertReachUserRepository,
  getLifetimeBoostStatsRepository,
  getBoostHistoryRepository,
  getBoostPerformanceRepository,
} from "./boostAnalytics.repository";
import { prisma } from "../../../prisma/prismaClient";

interface TrackBoostEventInput {
  boostedUserId: string;
  actorId?: string;
  eventType: BoostEventType;
}

type DemographicRecord = {
  type: BoostDemographicType;
  label: string;
  count: number;
};

const getHourStart = () => {
  const date = new Date();

  date.setMinutes(0, 0, 0);

  return date;
};

export const trackBoostEvent = async ({
  boostedUserId,
  actorId,
  eventType,
}: TrackBoostEventInput) => {

  // Don't track own actions
  if (actorId && actorId === boostedUserId) {
    return;
  }

  // Find active boost
  const usage =
    await findActiveBoostUsageRepository(boostedUserId);

  if (!usage) {
    return;
  }

  const hour = getHourStart();

  await prisma.$transaction(async (tx) => {

    // =========================================
    // SAVE RAW EVENT
    // =========================================

    await createBoostEventRepository(tx, {
      boostUsageId: usage.id,
      actorId,
      eventType,
    });

    // =========================================
    // IMPRESSION
    // =========================================

    if (eventType === BoostEventType.IMPRESSION) {

      await incrementBoostUsageRepository(
        tx,
        usage.id,
        "total_impressions"
      );

      await upsertHourlyStatRepository(
        tx,
        usage.id,
        hour,
        "impressions"
      );

      // Unique reach
      if (actorId) {

        const reach =
          await upsertReachUserRepository(
            tx,
            usage.id,
            actorId
          );

        if (reach.isNewReach) {

          await incrementBoostUsageRepository(
            tx,
            usage.id,
            "total_reach"
          );

          await upsertHourlyStatRepository(
            tx,
            usage.id,
            hour,
            "reach"
          );
        }
      }
    }

    // =========================================
    // PROFILE VIEW
    // =========================================

    if (eventType === BoostEventType.PROFILE_VIEW) {

      await incrementBoostUsageRepository(
        tx,
        usage.id,
        "total_views"
      );

      await upsertHourlyStatRepository(
        tx,
        usage.id,
        hour,
        "views"
      );
    }

    // =========================================
    // LIKE
    // =========================================

    if (eventType === BoostEventType.LIKE) {

      await incrementBoostUsageRepository(
        tx,
        usage.id,
        "total_likes"
      );

      await upsertHourlyStatRepository(
        tx,
        usage.id,
        hour,
        "likes"
      );
    }

    // =========================================
    // SUPER LIKE
    // =========================================

    if (eventType === BoostEventType.SUPERLIKE) {

      await incrementBoostUsageRepository(
        tx,
        usage.id,
        "total_superlikes"
      );

      await upsertHourlyStatRepository(
        tx,
        usage.id,
        hour,
        "superlikes"
      );
    }

    // =========================================
    // INTEREST
    // =========================================

    if (eventType === BoostEventType.INTEREST) {

      await incrementBoostUsageRepository(
        tx,
        usage.id,
        "total_interests"
      );

      await upsertHourlyStatRepository(
        tx,
        usage.id,
        hour,
        "interests"
      );
    }

    // =========================================
    // MATCH
    // =========================================

    if (eventType === BoostEventType.MATCH) {

      await incrementBoostUsageRepository(
        tx,
        usage.id,
        "total_matches"
      );

      await upsertHourlyStatRepository(
        tx,
        usage.id,
        hour,
        "matches"
      );
    }
  });
};

export const getBoostHistoryService = async (
  userId: string,
  page = 1,
  limit = 10
) => {

  const skip = (page - 1) * limit;

  const [lifetime, history] = await Promise.all([
    getLifetimeBoostStatsRepository(userId),

    getBoostHistoryRepository(
      userId,
      skip,
      limit
    ),
  ]);

  return {
    lifetimeImpact: {
      totalReach: lifetime?.total_reach ?? 0,
      newLikes: lifetime?.total_likes ?? 0,
      interests: lifetime?.total_interests ?? 0,
      views: lifetime?.total_views ?? 0,
      matches: lifetime?.total_matches ?? 0,
    },

    recentBoostEvents: history.map((item) => ({
      id: item.id,

      boostType:
        item.boost_type ??
        item.boost?.name ??
        null,

      title:
        item.display_name ??
        item.title ??
        item.boost?.title ??
        "Boost",

      status: item.status,

      startedAt: item.started_at,
      endedAt: item.ended_at,
      expectedEndAt: item.expected_end_at,

      duration: item.duration,

      reach: item.total_reach,
      impressions: item.total_impressions,
      views: item.total_views,
      likes: item.total_likes,
      superLikes: item.total_superlikes,
      interests: item.total_interests,
      matches: item.total_matches,
    })),
  };
};

export const getBoostPerformanceService = async (
  userId: string,
  usageId: string
) => {

  const usage =
    await getBoostPerformanceRepository(
      userId,
      usageId
    );

  if (!usage) {
    throw new Error("BOOST_USAGE_NOT_FOUND");
  }

  const now = new Date();

  const remainingSeconds =
    usage.status === "ACTIVE"
      ? Math.max(
        0,
        Math.floor(
          (
            usage.expected_end_at.getTime() -
            now.getTime()
          ) / 1000
        )
      )
      : 0;

  // -----------------------------------------
  // Calculate increase %
  // -----------------------------------------

  const reachIncrease =
    usage.baseline_reach > 0
      ? Math.round(
        (
          (usage.total_reach -
            usage.baseline_reach) /
          usage.baseline_reach
        ) * 100
      )
      : 0;

  const interestIncrease =
    usage.baseline_interests > 0
      ? Math.round(
        (
          (usage.total_interests -
            usage.baseline_interests) /
          usage.baseline_interests
        ) * 100
      )
      : 0;

        // -----------------------------------------
  // NEW: Calculate demographic percentages
  // -----------------------------------------

  const demographics =
    calculateDemographicPercentages(
      usage.demographicStats
    );

  return {

    id: usage.id,

    liveNow:
      usage.status === "ACTIVE",

    status: usage.status,

    boost: {
      type:
        usage.boost_type ??
        usage.boost?.name,

      title:
        usage.display_name ??
        usage.title ??
        usage.boost?.title,
    },

    startedAt: usage.started_at,

    expectedEndAt:
      usage.expected_end_at,

    remainingSeconds,

    performance: {

      reach: {
        total: usage.total_reach,
        increasePercentage:
          reachIncrease,
      },

      interests: {
        total:
          usage.total_interests,
        increasePercentage:
          interestIncrease,
      },

      views: {
        total:
          usage.total_views,
      },

      likes: {
        total:
          usage.total_likes,
      },

      superLikes: {
        total:
          usage.total_superlikes,
      },

      matches: {
        total:
          usage.total_matches,
      },
    },

    hourlyTraffic:
      usage.hourlyStats.map(
        (stat) => ({
          hour: stat.hour,

          boosted: {
            reach: stat.reach,
            views: stat.views,
            likes: stat.likes,
          },

          regular: {
            reach:
              stat.baseline_reach,

            views:
              stat.baseline_views,

            likes:
              stat.baseline_likes,
          },
        })
      ),

    demographics,
  };
};


export const calculateDemographicPercentages = (
  demographics: DemographicRecord[]
) => {
  type DemographicItem = DemographicRecord & {
    percentage: number;
  };

  type DemographicGroup = {
    total: number;
    top: DemographicItem | null;
    items: DemographicItem[];
  };

  const result: Record<
    string,
    DemographicGroup
  > = {};

  // Initialize all demographic categories
  for (const type of Object.values(BoostDemographicType)) {
    result[type.toLowerCase()] = {
      total: 0,
      top: null,
      items: [],
    };
  }

  // Step 1: Calculate total count for each type
  for (const item of demographics) {
    const key = item.type.toLowerCase();

    result[key].total += item.count;
  }

  // Step 2: Calculate percentage for each label
  for (const item of demographics) {
    const key = item.type.toLowerCase();

    const total = result[key].total;

    const percentage =
      total > 0
        ? Number(
            (
              (item.count / total) *
              100
            ).toFixed(2)
          )
        : 0;

    result[key].items.push({
      type: item.type,
      label: item.label,
      count: item.count,
      percentage,
    });
  }

  // Step 3: Sort and select top category
  for (const group of Object.values(result)) {
    group.items.sort(
      (a, b) =>
        b.count - a.count ||
        a.label.localeCompare(b.label)
    );

    group.top = group.items[0] ?? null;
  }

  return result;
};