// Date Now Service
import { prisma } from "../../prisma/prismaClient";
import {

  PlanStatus,
  TransactionType,
  TransactionStatus,
  TransactionSource,
  Prisma,
} from "@prisma/client";
import { UpdateDatePlanInput } from "./dateNow.types";
import { calculateMatchScore } from "../../utils/matchScore.constants";

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

export const 
updateDraftDatePlan = async (
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

  const {
    vibeIds,
    eventDate,
    eventTime,
    activityId,
    ...planData
  } = payload;
  let eventDateTime: Date | undefined;

  if (eventDate && eventTime) {
    eventDateTime = new Date(`${eventDate}T${eventTime}:00`);
  }

  const updatedPlan = await prisma.$transaction(async (tx) => {
    await tx.datePlan.update({
      where: {
        id: planId,
      },
      data: {
        ...planData,
        ...(eventDateTime && { eventDateTime }),
      } as Prisma.DatePlanUncheckedUpdateInput,
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
  return prisma.$transaction(async (tx) => {
    const plan = await tx.datePlan.findFirst({
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

    if (!plan.visibilityId) {
      throw new Error("Visibility is required");
    }

    if (plan.status === PlanStatus.ACTIVE) {
      throw new Error("Plan is already published");
    }

    const userPlanStats = await tx.datePlanUserStats.findUnique({
      where: {
        userId,
      },
    });

    if (!userPlanStats) {
      throw new Error("User date plan stats not found");
    }

    if (userPlanStats.balance <= 0) {
      throw new Error("You don't have any date plan credits.");
    }

    await tx.datePlanUserStats.update({
      where: {
        userId,
      },
      data: {
        balance: {
          decrement: 1,
        },
      },
    });

    await tx.datePlan.update({
      where: {
        id: planId,
      },
      data: {
        status: PlanStatus.ACTIVE,
      },
    });

    return {
      success: true,
      remainingCredits: userPlanStats.balance - 1,
    };
  });
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
  const me = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      profile: true,

      eduWork: true,

      bio: true,

      photos: true,

      answer: {
        include: {
          question: true,
          option: true,
        },
      },
    },
  });

  if (!me) {
    throw new Error("User not found");
  }

  const profile = me.profile;

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

      DateConfirmed: null,
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
      user: {
        include: {
          profile: true,

          eduWork: true,

          bio: true,

          answer: {
            include: {
              question: true,
              option: true,
            },
          },

          photos: true,
        },
      },
      activity: true,
      quickTitle: true,
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
        const matchScore = calculateMatchScore(
          me,
          plan.user
        );
        let distanceKm = null;

        if (plan.venueLat != null && plan.venueLng != null) {
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
          matchScore,
          distanceKm:
            distanceKm !== null
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
  const eventDate = plan.eventDateTime
    ? plan.eventDateTime.toISOString().split("T")[0]
    : null;

  const eventTime = plan.eventDateTime
    ? plan.eventDateTime.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    : null;
  return {
    id: plan.id,
    matchScore: plan.matchScore,
    venueName: plan.venueName,
    distanceKm: plan.distanceKm,
    activity: plan.activity?.label,

    title: plan.title,
    quickTitle: plan.quickTitle?.label,
    note: plan.note,

    photoUrl: plan.photoUrl,
    eventDate,
    eventTime,
    whoPays: plan.whoPays?.label,
    duration: plan.duration,
    host: {
      id: plan.user.id,
      name: plan.user.full_name,
      profilePhoto:
        plan.user.photos.length > 0
          ? plan.user.photos[0].media_url
          : null,
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

  console.log("Plan found:", planId);
  console.log("User details:", userId);

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

export const getDatePlanRequests = async (
  userId: string,
  planId: string
) => {
  const plan = await prisma.datePlan.findFirst({
    where: {
      id: planId,
      userId,
    },
    include: {
      activity: true,
      quickTitle: true,
      requests: {
        where: {
          status: "PENDING",
        },
        include: {
          requester: {
            include: {
              photos: {
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!plan) {
    throw new Error("Date plan not found");
  }

  return {
    plan: {
      id: plan.id,


      title:
        plan.title ||
        plan.quickTitle?.label ||
        plan.activity.label,

      activity: plan.activity.label,

      venueName: plan.venueName,

      venueAddress: plan.venueAddress,

      photoUrl: plan.photoUrl,

      requestsCount: plan.requests.length,

      participantLimit: plan.participantLimit,
    },

    requests: plan.requests.map((request) => ({
      id: request.id,

      status: request.status,

      compatibility: Math.floor(
        Math.random() * (95 - 75 + 1) + 75
      ),

      message: request.message,

      requester: {
        id: request.requester.id,

        name: request.requester.full_name,

        age: request.requester.birth_date
          ? Math.floor(
            (Date.now() -
              new Date(
                request.requester.birth_date
              ).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
          )
          : null,

        photo:
          request.requester.photos?.[0]?.media_url ??
          null,
      },
    })),
  };
};

export const approveDatePlanRequest = async (
  userId: string,
  requestId: string
) => {
  const request = await prisma.datePlanRequest.findUnique({
    where: {
      id: requestId,
    },
    include: {
      requester: true,
      plan: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!request) {
    throw new Error("Request not found");
  }

  if (request.plan.userId !== userId) {
    throw new Error("Not authorized");
  }

  return prisma.$transaction(async (tx) => {
    const approvedRequest =
      await tx.datePlanRequest.update({
        where: {
          id: requestId,
        },
        data: {
          status: "APPROVED",
        },
      });

    await tx.datePlanRequest.updateMany({
      where: {
        planId: request.planId,

        id: {
          not: requestId,
        },

        status: "PENDING",
      },
      data: {
        status: "DECLINED",
      },
    });

    await tx.datePlan.update({
      where: {
        id: request.planId,
      },
      data: {
        status: "BOOKED",
      },
    });

    // Create Confirmed Date
    const confirmedDate =
      await tx.dateConfirmed.create({
        data: {
          planId: request.plan.id,

          hostUserId: request.plan.userId,

          participantId:
            request.requesterId,

          title:
            request.plan.title,

          venueName:
            request.plan.venueName,

          venueAddress:
            request.plan.venueAddress,

          eventDateTime:
            request.plan.eventDateTime!,

          status: "UPCOMING",
        },
      });

    // Find existing conversation
    let conversation = await tx.conversation.findFirst({
      where: {
        participants: {
          every: {
            userId: {
              in: [
                request.plan.userId,
                request.requesterId,
              ],
            },
          },
        },
      },
      include: {
        participants: true,
      },
    });

    // Create conversation if not exists
    if (!conversation) {
      conversation = await tx.conversation.create({
        data: {
          participants: {
            create: [
              {
                userId: request.plan.userId,
              },
              {
                userId: request.requesterId,
              },
            ],
          },
        },
        include: {
          participants: true,
        },
      });
    }

    // Create Date Confirmed Message
    await tx.chatMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: request.requesterId,
        messageType: "DATE_CONFIRMED",
        metadata: {
          confirmedDateId: confirmedDate.id,
        },
      },
    });

    return {
      success: true,
      confirmedDateId: confirmedDate.id,
    };
  });
};

export const declineDatePlanRequest = async (
  userId: string,
  requestId: string
) => {
  const request = await prisma.datePlanRequest.findUnique({
    where: {
      id: requestId,
    },
    include: {
      plan: true,
    },
  });

  if (!request) {
    throw new Error("Request not found");
  }

  if (request.plan.userId !== userId) {
    throw new Error("Not authorized");
  }

  return prisma.datePlanRequest.update({
    where: {
      id: requestId,
    },
    data: {
      status: "DECLINED",
    },
  });
};

export const topUpDatePlanPackage = async (
  userId: string,
  packageId: string
) => {
  return prisma.$transaction(async (tx) => {
    const planPackage = await tx.datePlanPackage.findFirst({
      where: {
        id: packageId,
        isActive: true,
      },
    });

    if (!planPackage) {
      throw new Error("Invalid package");
    }

    const wallet = await tx.wallet.findUnique({
      where: {
        userId,
      },
    });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    if (wallet.balance.lt(planPackage.price)) {
      throw new Error("Insufficient wallet balance");
    }

    let userDatePlanStats = await tx.datePlanUserStats.findUnique({
      where: {
        userId,
      },
    });

    if (!userDatePlanStats) {
      userDatePlanStats = await tx.datePlanUserStats.create({
        data: {
          userId,
          balance: 0,
        },
      });
    }

    const balanceBefore = wallet.balance;
    const balanceAfter = wallet.balance.minus(planPackage.price);

    // Deduct wallet balance
    await tx.wallet.update({
      where: {
        userId,
      },
      data: {
        balance: balanceAfter,
      },
    });

    // Wallet transaction
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: planPackage.price,
        type: TransactionType.PURCHASE,
        status: TransactionStatus.SUCCESS,
        source: TransactionSource.DATE_PLAN_BOOKING,
        referenceId: planPackage.id,
        description: `Purchased ${planPackage.title}`,
        balanceBefore,
        balanceAfter,
      },
    });

    const updatedStats = await tx.datePlanUserStats.update({
      where: {
        userId,
      },
      data: {
        balance: {
          increment: planPackage.planCount,
        },
      },
    });

    return {
      success: true,
      purchasedPackage: {
        id: planPackage.id,
        title: planPackage.title,
        plans: planPackage.planCount,
        coins: planPackage.price,
      },
      remainingPlans: updatedStats.balance,
    };
  });
};

export const getMyDatePlanRequests = async (userId: string) => {
  const requests = await prisma.datePlanRequest.findMany({
    where: {
      requesterId: userId,
    },

    include: {
      plan: {
        include: {
          activity: true,
          quickTitle: true,
          whoPays: true,
          visibility: true,
          joinRequestGender: true,

          vibes: {
            include: {
              vibe: true,
            },
          },

          user: {
            include: {
              photos: {
                where: {
                  is_primary: true,
                },
                select: {
                  media_url: true,
                },
                take: 1,
              },
            },
          },
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return requests.map((request) => ({
    id: request.id,
    status: request.status,
    message: request.message,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,

    plan: {
      id: request.plan.id,
      title: request.plan.title,

      note: request.plan.note,
      venueName: request.plan.venueName,
      eventDateTime: request.plan.eventDateTime,
      duration: request.plan.duration,
      photoUrl: request.plan.photoUrl,

      activity: request.plan.activity?.label,
      quickTitle: request.plan.quickTitle?.label,
      whoPays: request.plan.whoPays?.label,
      visibility: request.plan.visibility?.label,
      joinRequestGender: request.plan.joinRequestGender?.label,

      vibes: request.plan.vibes.map((vibe) => ({
        id: vibe.vibe.id,
        label: vibe.vibe.label,
      })),

      host: {
        id: request.plan.user.id,
        name: request.plan.user.full_name,
        profilePhoto:
          request.plan.user.photos.length > 0
            ? request.plan.user.photos[0].media_url
            : null,
      },
    },
  }));
};

export const cancelDatePlanRequest = async (
  userId: string,
  planId: string
) => {
  const request = await prisma.datePlanRequest.findFirst({
    where: {
      planId,
      requesterId: userId,
    },
  });

  if (!request) {
    throw new Error("Request not found");
  }

  if (request.status === "APPROVED") {
    throw new Error("Approved request cannot be cancelled");
  }

  if (request.status === "DECLINED") {
    throw new Error("Request has already been declined");
  }

  if (request.status === "CANCELLED") {
    throw new Error("Request has already been cancelled");
  }

  const cancelledRequest = await prisma.datePlanRequest.update({
    where: {
      id: request.id,
    },
    data: {
      status: "CANCELLED",
    },
  });

  return cancelledRequest;
};

// matchScore.service.ts

export const testMatchScore = async (
  userId: string,
  targetUserId: string
) => {
  const [currentUser, targetUser] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        profile: true,
        about: true,
        bio: true,
        eduWork: true,

        skills: {
          include: {
            skill: true,
          },
        },

        answer: {
          include: {
            option: true,
            question: true,
          },
        },
      },
    }),

    prisma.user.findUnique({
      where: {
        id: targetUserId,
      },
      include: {
        profile: true,
        about: true,
        bio: true,
        eduWork: true,

        skills: {
          include: {
            skill: true,
          },
        },

        answer: {
          include: {
            option: true,
            question: true,
          },
        },
      },
    }),
  ]);

  if (!currentUser) {
    throw new Error("Current user not found");
  }

  if (!targetUser) {
    throw new Error("Target user not found");
  }


  const score = calculateMatchScore(
    currentUser,
    targetUser
  );

  return {
    currentUser: {
      id: currentUser.id,
      name: currentUser.full_name,
    },

    targetUser: {
      id: targetUser.id,
      name: targetUser.full_name,
    },

    matchScore: score,
  };
};