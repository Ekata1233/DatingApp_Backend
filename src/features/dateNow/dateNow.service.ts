// Date Now Service
import { prisma } from "../../prisma/prismaClient";
import { PlanStatus } from "@prisma/client";
import { UpdateDatePlanInput } from "./dateNow.types";

export const createDraftDatePlan = async (
  userId: string,
  activityId: string
) => {

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });


  if (!user) {
    throw new Error("User not found");
  }

  const activity = await prisma.datePlanOption.findUnique({
    where: { id: activityId },
  });

  if (!activity) {
    throw new Error("Activity not found");
  }
  const draftPlan = await prisma.datePlan.create({
    data: {
      userId,
      activityId,
      status: PlanStatus.DRAFT,
    },
  });

  return draftPlan;
};

export const updateDraftDatePlan = async (
  planId: string,
  userId: string,
  payload: UpdateDatePlanInput
) => {
  const plan = await prisma.datePlan.findFirst({
    where: {
      id: planId,
      userId,
    },
  });

  if (!plan) {
    throw new Error("Plan not found");
  }

  const { vibeIds, ...planData } = payload;

  const updatedPlan = await prisma.$transaction(async (tx) => {
    await tx.datePlan.update({
      where: {
        id: planId,
      },
      data: planData,
    });

    if (vibeIds) {
      await tx.datePlanVibe.deleteMany({
        where: {
          planId,
        },
      });

      await tx.datePlanVibe.createMany({
        data: vibeIds.map((vibeId) => ({
          planId,
          vibeId,
        })),
      });
    }

    return tx.datePlan.findUnique({
      where: {
        id: planId,
      },
      include: {
        vibes: true,
      },
    });
  });

  return updatedPlan;
};

export const publishDatePlan = async (
  planId: string,
  userId: string
) => {
  const plan = await prisma.datePlan.findFirst({
    where: {
      id: planId,
      userId,
    },
    include: {
      vibes: true,
    },
  });

  if (!plan) {
    throw new Error("Plan not found");
  }

  if (!plan.activityId) {
    throw new Error("Activity is required");
  }

  if (!plan.whenId) {
    throw new Error("When is required");
  }

  if (!plan.timeId) {
    throw new Error("Time is required");
  }

  if (!plan.durationId) {
    throw new Error("Duration is required");
  }

  if (!plan.visibilityId) {
    throw new Error("Visibility is required");
  }

  await prisma.datePlan.update({
    where: {
      id: planId,
    },
    data: {
      status: PlanStatus.ACTIVE,
    },
  });

  return {
    success: true,
  };
};

const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export const discoverDatePlan = async (
  userId: string,
  filter?: string
) => {
  const profile = await prisma.userProfile.findUnique({
    where: {
      user_id: userId,
    },
  });

  const hasLocation =
    profile?.latitude !== null &&
    profile?.latitude !== undefined &&
    profile?.longitude !== null &&
    profile?.longitude !== undefined;

  const now = new Date();

  let dateFilter: any = {
    gt: now,
  };

  // TODAY
  if (filter === "today") {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);

    dateFilter = {
      gte: start,
      lte: end,
    };
  }

  // TOMORROW
  else if (filter === "tomorrow") {
    const start = new Date();
    start.setUTCDate(start.getUTCDate() + 1);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setUTCHours(23, 59, 59, 999);

    dateFilter = {
      gte: start,
      lte: end,
    };
  }

  const plans = await prisma.datePlan.findMany({
    where: {
      status: "ACTIVE",

      userId: {
        not: userId,
      },

      eventDateTime: dateFilter,

      requests: {
        none: {
          requesterId: userId,
        },
      },
    skips: {
      none: {
        userId,
      },
    },
  },

    include: {
      user: true,

      activity: true,

      quickTitle: true,

      when: true,

      time: true,

      duration: true,

      whoPays: true,

      visibility: true,

      joinRequestGender: true,

      vibes: {
        include: {
          vibe: true,
        },
      },
    },
  });

  console.log("Fetched Plans:", plans.length);

  if (plans.length === 0) {
    return null;
  }

  let ranked: any[];

  if (hasLocation) {
    ranked = plans
      .map((plan) => {
        let distanceKm = null;

        if (plan.venueLat && plan.venueLng) {
          distanceKm = calculateDistanceKm(
            Number(profile!.latitude),
            Number(profile!.longitude),
            plan.venueLat,
            plan.venueLng
          );
        }

        const hoursAway =
          ((plan.eventDateTime?.getTime() || now.getTime()) -
            now.getTime()) /
          (1000 * 60 * 60);

        return {
          ...plan,
          distanceKm: distanceKm
            ? Number(distanceKm.toFixed(1))
            : null,

          score:
            (distanceKm ?? 999) * 5 +
            Math.max(hoursAway, 0),
        };
      })
      .sort((a, b) => a.score - b.score);
  } else {
    ranked = plans.sort((a, b) => {
      const aTime = a.eventDateTime?.getTime() || 0;
      const bTime = b.eventDateTime?.getTime() || 0;

      return aTime - bTime;
    });
  }

  const plan = ranked[0];
  return {
  id: plan.id,

  venueName: plan.venueName,
  distanceKm: plan.distanceKm,

  eventDate: plan.when?.label,
  eventTime: plan.time?.label,
  activity: plan.activity?.label,

  title: plan.title,
  note: plan.note,

  photoUrl: plan.photoUrl,

  whoPays: plan.whoPays?.label,

  host: {
    id: plan.user.id,
    name: plan.user.full_name,
    profilePhoto: plan.user.profilePhoto,
    age: plan.user.birth_date
      ? Math.floor(
          (Date.now() -
            new Date(plan.user.birth_date).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        )
      : null,
  },
};
};

export const skipDatePlan = async (
  userId: string,
  planId: string
) => {
  await prisma.datePlanSkip.create({
    data: {
      userId,
      planId,
    },
  });

  return {
    success: true,
  };
};


export const requestToJoinDatePlan = async (
  userId: string,
  planId: string,
  message?: string
) => {
  const plan = await prisma.datePlan.findUnique({
    where: {
      id: planId,
    },
  });

  if (!plan) {
    throw new Error("Date plan not found");
  }

  if (plan.userId === userId) {
    throw new Error("Cannot join your own date");
  }

  const existing = await prisma.datePlanRequest.findUnique({
    where: {
      planId_requesterId: {
        planId,
        requesterId: userId,
      },
    },
  });

  if (existing) {
    throw new Error("Already requested");
  }

  return prisma.datePlanRequest.create({
    data: {
      planId,
      requesterId: userId,
      message,
    },
  });
};
