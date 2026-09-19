import { Prisma } from "@prisma/client";
import { TrackBoostEventType } from "../boost.tracker";

export const getHourBucket = (date: Date) => {
  const hour = new Date(date);

  hour.setUTCMinutes(0, 0, 0);

  return hour;
};

type HourlyCounter =
  | "impressions"
  | "views"
  | "likes"
  | "superlikes"
  | "interests"
  | "matches";

const hourlyFieldMap: Partial<
  Record<TrackBoostEventType, HourlyCounter>
> = {
  IMPRESSION: "impressions",
  PROFILE_VIEW: "views",
  LIKE: "likes",
  SUPERLIKE: "superlikes",
  INTEREST: "interests",
  MATCH: "matches",
};

export const incrementHourlyStats = async (
  tx: Prisma.TransactionClient,
  boostUsageId: string,
  hour: Date,
  field: HourlyCounter
) => {
  await tx.boostHourlyStats.upsert({
    where: {
      boost_usage_id_hour: {
        boost_usage_id: boostUsageId,
        hour,
      },
    },

    update: {
      [field]: {
        increment: 1,
      },
    },

    create: {
      boost_usage_id: boostUsageId,
      hour,
      [field]: 1,
    },
  });
};