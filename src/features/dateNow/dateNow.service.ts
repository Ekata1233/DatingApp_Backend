// Date Now Service
import {
  PlanStatus,
  TransactionType,
  TransactionStatus,
  TransactionSource,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import {
  UpdateDatePlanActivityDTO,
  UpdateDatePlanInput,
} from "./dateNow.types";
import { calculateMatchScore } from "../../utils/matchScore.constants";
import {
  calculateAge,
  getHistoryMessage,
  getHistoryStatus,
  getHistoryStatusLabel,
  getStaticHistoryReview,
} from "./dateNow.history.util";

export const createDraftDatePlan = async (
  userId: string,
  activityId: string,
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
  payload: UpdateDatePlanInput,
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

  const { vibeIds, eventDate, eventTime, activityId, ...planData } = payload;
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

export const publishDatePlan = async (planId: string, userId: string) => {
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
  lon2: number,
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

export const discoverDatePlan = async (userId: string, filter?: string) => {
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
  // WEEKEND
  else if (filter === "weekend") {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);

    const day = start.getUTCDay();

    // Find coming Saturday
    const daysUntilSaturday = day === 0 ? 6 : 6 - day;

    const weekendStart = new Date(start);
    weekendStart.setUTCDate(weekendStart.getUTCDate() + daysUntilSaturday);
    weekendStart.setUTCHours(0, 0, 0, 0);

    // Sunday end
    const weekendEnd = new Date(weekendStart);
    weekendEnd.setUTCDate(weekendEnd.getUTCDate() + 1);
    weekendEnd.setUTCHours(23, 59, 59, 999);

    dateFilter = {
      gte: weekendStart,
      lte: weekendEnd,
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
        const matchScore = calculateMatchScore(me, plan.user);
        let distanceKm = null;

        if (plan.venueLat != null && plan.venueLng != null) {
          distanceKm = calculateDistanceKm(
            Number(profile!.latitude),
            Number(profile!.longitude),
            plan.venueLat,
            plan.venueLng,
          );
        }

        const hoursAway =
          ((plan.eventDateTime?.getTime() || now.getTime()) - now.getTime()) /
          (1000 * 60 * 60);

        return {
          ...plan,
          matchScore,
          distanceKm:
            distanceKm !== null ? Number(distanceKm.toFixed(1)) : null,

          score: (distanceKm ?? 999) * 5 + Math.max(hoursAway, 0),
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
    // Activity
    activity: plan.activity?.label,
    activityIcon: plan.activity?.icon,

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
        plan.user.photos.length > 0 ? plan.user.photos[0].media_url : null,
      age: plan.user.birth_date
        ? Math.floor(
            (Date.now() - new Date(plan.user.birth_date).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000),
          )
        : null,
    },
  };
};

export const skipDatePlan = async (userId: string, planId: string) => {
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
  message?: string,
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

export const getDatePlanRequests = async (userId: string, planId: string) => {
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
      title: plan.title || plan.quickTitle?.label || plan.activity.label,
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
      compatibility: Math.floor(Math.random() * (95 - 75 + 1) + 75),
      message: request.message,
      requester: {
        id: request.requester.id,
        name: request.requester.full_name,
        age: request.requester.birth_date
          ? Math.floor(
              (Date.now() - new Date(request.requester.birth_date).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000),
            )
          : null,
        photo: request.requester.photos?.[0]?.media_url ?? null,
      },
    })),
  };
};

export const approveDatePlanRequest = async (
  userId: string,
  requestId: string,
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
    const approvedRequest = await tx.datePlanRequest.update({
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
    const confirmedDate = await tx.dateConfirmed.create({
      data: {
        planId: request.plan.id,

        hostUserId: request.plan.userId,

        participantId: request.requesterId,

        title: request.plan.title,

        venueName: request.plan.venueName,

        venueAddress: request.plan.venueAddress,

        eventDateTime: request.plan.eventDateTime!,

        status: "UPCOMING",
      },
    });

    // Find existing conversation
    let conversation = await tx.conversation.findFirst({
      where: {
        participants: {
          every: {
            userId: {
              in: [request.plan.userId, request.requesterId],
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
  requestId: string,
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
  packageId: string,
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

      activity: request.plan.activity
  ? {
      name: request.plan.activity.label,
      icon: request.plan.activity.icon,
    }
  : null,
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

export const cancelDatePlanRequest = async (userId: string, planId: string) => {
  const request = await prisma.datePlanRequest.findFirst({
    where: {
      planId,
      requesterId: userId,
    },
  });

  if (!request) {
    throw new Error("Request not found");
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

export const withdrawDatePlanRequest = async (
  requestId: string,
  userId: string,
) => {
  // Find the request
  const request = await prisma.datePlanRequest.findUnique({
    where: {
      id: requestId,
    },
  });

  if (!request) {
    throw new Error("Date plan request not found");
  }

  // Make sure the logged-in user is the requester
  if (request.requesterId !== userId) {
    throw new Error("You are not allowed to withdraw this request");
  }

  // Optional: only pending requests can be withdrawn
  if (request.status !== "PENDING") {
    throw new Error(`Cannot withdraw a request with status ${request.status}`);
  }

  // Delete request
  await prisma.datePlanRequest.delete({
    where: {
      id: requestId,
    },
  });

  return {
    requestId,
    message: "Date plan request withdrawn successfully",
  };
};
// matchScore.service.ts

export const testMatchScore = async (userId: string, targetUserId: string) => {
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

  const score = calculateMatchScore(currentUser, targetUser);

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

const prisma = new PrismaClient();

interface HistoryQuery {
  page?: number;
  limit?: number;
  status?: string;
}

export const getDatePlanHistory = async (
  userId: string,
  query: HistoryQuery,
) => {
  console.log("========== DATE PLAN HISTORY DEBUG ==========");
  console.log("USER ID:", userId);
  console.log("QUERY:", query);

  const page = Math.max(Number(query.page) || 1, 1);

  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 50);

  const skip = (page - 1) * limit;

  /**
   * History plans
   */
  console.log("========== DATE PLAN HISTORY DEBUG ==========");
  console.log("USER ID:", userId);
  console.log("QUERY:", query);

  const where = {
    userId,

    status: {
      in: [
        PlanStatus.ACTIVE,
        PlanStatus.COMPLETED,
        PlanStatus.BOOKED,
        PlanStatus.CANCELLED,
        PlanStatus.EXPIRED,
      ],
    },
  };

  console.log("HISTORY WHERE:", JSON.stringify(where, null, 2));

  const allUserPlans = await prisma.datePlan.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      userId: true,
      status: true,
      title: true,
      eventDateTime: true,
    },
  });

  console.log("ALL USER DATE PLANS:", JSON.stringify(allUserPlans, null, 2));

  const [plans, total] = await prisma.$transaction([
    prisma.datePlan.findMany({
      where,

      skip,
      take: limit,

      orderBy: {
        eventDateTime: "desc",
      },

      include: {
        activity: true,

        quickTitle: true,

        whoPays: true,
      feedbacks: {
  where: {
    reviewerId: userId,
    status: "SUBMITTED",
  },
  take: 1,
  select: {
    id: true,
    attendanceStatus: true,
    status: true,
    metUserId: true,
  },
},
      requests: {
  select: {
    id: true,
    requesterId: true,
    status: true,
    createdAt: true,

    requester: {
      select: {
        id: true,
        full_name: true,
        birth_date: true,

        photos: {
          where: {
            is_primary: true,
          },
          select: {
            id: true,
            media_url: true,
          },
          take: 1,
        },
      },
    },
  },
},

        DateConfirmed: {
          include: {
            participant: {
              select: {
                id: true,
                full_name: true,
                birth_date: true,

                photos: {
                  where: {
                    is_primary: true,
                  },
                  select: {
                    id: true,
                    media_url: true,
                  },
                  take: 1,
                },
              },
            },

            host: {
              select: {
                id: true,
                full_name: true,
                birth_date: true,
              },
            },
          },
        },

        _count: {
          select: {
            requests: true,
          },
        },
      },
    }),

    prisma.datePlan.count({
      where,
    }),
  ]);
  console.log("HISTORY PLANS FOUND:", plans.length);
  console.log("HISTORY TOTAL:", total);

  console.log("HISTORY PLANS:", JSON.stringify(plans, null, 2));
  const data = plans.map((plan) => {
    console.log("========== PROCESSING PLAN ==========");
    console.log("PLAN ID:", plan.id);
    console.log("PLAN STATUS:", plan.status);
    console.log("PLAN TITLE:", plan.title);
    console.log("EVENT DATE:", plan.eventDateTime);
    console.log("CONFIRMED DATE:", plan.DateConfirmed);

    const confirmed = plan.DateConfirmed;

    /**
     * 1. Calculate actual history status
     */
  const feedback = (plan.feedbacks?.[0] ?? null) as {
  attendanceStatus: string;
  status: string;
} | null;

let historyStatus: string;

if (
  feedback?.attendanceStatus === "NO_SHOW" &&
  feedback?.status === "SUBMITTED"
) {
  historyStatus = "NO_SHOW";
} else if (
  feedback?.attendanceStatus === "MET" &&
  feedback?.status === "SUBMITTED"
) {
  historyStatus = "COMPLETED";
} else {
  historyStatus = getHistoryStatus(
    plan.status,
    confirmed?.status ?? null,
    plan.eventDateTime,
  );
}
    /**
     * 2. UI label
     */
    const statusLabel = getHistoryStatusLabel(historyStatus);

    /**
     * 3. Static review
     */
    const review = getStaticHistoryReview(historyStatus);

    /**
     * 4. Participant
     */
    const participant = confirmed?.participant ?? null;

    /**
     * 5. Request statistics
     */
    const requestStats = {
      total: plan._count.requests,

      pending: plan.requests.filter((request) => request.status === "PENDING")
        .length,

      approved: plan.requests.filter((request) => request.status === "APPROVED")
        .length,

      declined: plan.requests.filter((request) => request.status === "DECLINED")
        .length,

      cancelled: plan.requests.filter(
        (request) => request.status === "CANCELLED",
      ).length,
    };

    return {
      id: plan.id,

      /**
       * Status
       */
      status: historyStatus,

      statusLabel,

      /**
       * Plan
       */
      title: plan.title,

      photoUrl: plan.photoUrl,

      activity: plan.activity,

      quickTitle: plan.quickTitle,

      /**
       * Date
       */
      eventDateTime: plan.eventDateTime,

      duration: plan.duration,

      /**
       * Venue
       */
      venue: {
        name: plan.venueName,
        address: plan.venueAddress,
        latitude: plan.venueLat,
        longitude: plan.venueLng,
      },

      /**
       * Participant
       */
      participant: participant
        ? {
            id: participant.id,

            name: participant.full_name,

            age: participant.birth_date
              ? calculateAge(participant.birth_date)
              : null,

            photoUrl: participant.photos[0]?.media_url ?? null,
          }
        : null,

      /**
       * Requests
       */
      requests: {
  total: requestStats.total,
  pending: requestStats.pending,
  approved: requestStats.approved,
  declined: requestStats.declined,
  cancelled: requestStats.cancelled,

  users: plan.requests.map((request) => ({
    id: request.requester.id,

    name: request.requester.full_name,

    age: request.requester.birth_date
      ? calculateAge(request.requester.birth_date)
      : null,

    photoUrl:
      request.requester.photos[0]?.media_url ?? null,

    status: request.status,
  })),
},

      /**
       * Payment
       */
      whoPays: plan.whoPays,

      /**
       * Confirmation
       */
      confirmedDate: confirmed
        ? {
            id: confirmed.id,

            status: confirmed.status,

            eventDateTime: confirmed.eventDateTime,
          }
        : null,

      /**
       * STATIC REVIEW
       */
      review,

      /**
       * Static/history message
       */
      message: getHistoryMessage(
        historyStatus,
        participant?.full_name,
        requestStats.total,
      ),

      createdAt: plan.createdAt,

      updatedAt: plan.updatedAt,
    };
  });

  /**
   * Optional status filter
   */
  const requestedStatus = query.status?.toUpperCase();

  const filteredData =
    requestedStatus && requestedStatus !== "ALL"
      ? data.filter((item) => item.status === requestedStatus)
      : data;
  console.log("FINAL HISTORY DATA:", JSON.stringify(filteredData, null, 2));

  console.log("========== END HISTORY DEBUG ==========");
  return {
    data: filteredData,

    pagination: {
      page,
      limit,
      total,

      totalPages: Math.ceil(total / limit),

      hasNextPage: page < Math.ceil(total / limit),

      hasPreviousPage: page > 1,
    },
  };
};

export const getDatePlanHistoryDetails = async (
  userId: string,
  planId: string,
) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  if (!planId) {
    throw new Error("Plan ID is required");
  }

  const plan = await prisma.datePlan.findFirst({
    where: {
      id: planId,
      userId,
    },

    include: {
      activity: true,

      quickTitle: true,

      whoPays: true,

     requests: {
  select: {
    id: true,
    requesterId: true,
    status: true,
    createdAt: true,

    requester: {
      select: {
        id: true,
        full_name: true,
        birth_date: true,

        photos: {
          where: {
            is_primary: true,
          },
          select: {
            id: true,
            media_url: true,
          },
          take: 1,
        },
      },
    },
  },
},

      feedbacks: {
        where: {
          reviewerId: userId,
        },
        take: 1,
        select: {
          id: true,
          attendanceStatus: true,
          status: true,
          metUserId: true,
          overallRating: true,
          personRating: true,
          noShowReason: true,
          experienceTags: true,
          comment: true,
          createdAt: true,
        },
      },

      DateConfirmed: {
        include: {
          participant: {
            select: {
              id: true,
              full_name: true,
              birth_date: true,

              photos: {
                where: {
                  is_primary: true,
                },
                select: {
                  id: true,
                  media_url: true,
                },
                take: 1,
              },
            },
          },

          host: {
            select: {
              id: true,
              full_name: true,
              birth_date: true,
            },
          },
        },
      },

      _count: {
        select: {
          requests: true,
        },
      },
    },
  });

  if (!plan) {
    throw new Error("Date plan history not found");
  }

  const confirmed = plan.DateConfirmed;

  const feedback = plan.feedbacks?.[0] ?? null;

  /**
   * History status
   *
   * MET + SUBMITTED feedback has highest priority.
   */
  const historyStatus =
    feedback?.attendanceStatus === "MET" &&
    feedback?.status === "SUBMITTED"
      ? "COMPLETED"
      : getHistoryStatus(
          plan.status,
          confirmed?.status ?? null,
          plan.eventDateTime,
        );

  const statusLabel = getHistoryStatusLabel(historyStatus);

  /**
   * Participant
   */
  const participant = confirmed?.participant ?? null;

  /**
   * Request statistics
   */
  const requestStats = {
    total: plan._count.requests,

    pending: plan.requests.filter(
      (request) => request.status === "PENDING",
    ).length,

    approved: plan.requests.filter(
      (request) => request.status === "APPROVED",
    ).length,

    declined: plan.requests.filter(
      (request) => request.status === "DECLINED",
    ).length,

    cancelled: plan.requests.filter(
      (request) => request.status === "CANCELLED",
    ).length,
  };

  return {
    id: plan.id,

    /**
     * Status
     */
    status: historyStatus,
    statusLabel,

    /**
     * Plan details
     */
    title: plan.title,

    quickTitle: plan.quickTitle
      ? {
          id: plan.quickTitle.id,
          label: plan.quickTitle.label,
          value: plan.quickTitle.value,
          icon: plan.quickTitle.icon,
        }
      : null,

    activity: plan.activity,

    /**
     * Date
     */
    eventDateTime: plan.eventDateTime,

    duration: plan.duration,

    /**
     * Venue
     */
    venue: {
      name: plan.venueName,
      address: plan.venueAddress,
      latitude: plan.venueLat,
      longitude: plan.venueLng,
    },

    /**
     * Participant
     */
    participant: participant
      ? {
          id: participant.id,

          name: participant.full_name,

          age: participant.birth_date
            ? calculateAge(participant.birth_date)
            : null,

          photoUrl:
            participant.photos[0]?.media_url ?? null,
        }
      : null,

    /**
     * Feedback
     */
    feedback: feedback
      ? {
          id: feedback.id,
          attendanceStatus: feedback.attendanceStatus,
          status: feedback.status,
          metUserId: feedback.metUserId,
          overallRating: feedback.overallRating,
          personRating: feedback.personRating,
          noShowReason: feedback.noShowReason,
          experienceTags: feedback.experienceTags,
          comment: feedback.comment,
          createdAt: feedback.createdAt,
        }
      : null,

    /**
     * Payment / Plan settings
     */
    whoPays: plan.whoPays,

    participantLimit: plan.participantLimit,

    /**
     * Static cost information
     */
    boost: {
      enabled: true,
      label: "Yes",
      duration: "3h",
    },

    planCost: {
      amount: 100,
      currency: "INR",
      label: "₹100",
    },

    /**
     * Requests
     */
  requests: {
  total: requestStats.total,
  pending: requestStats.pending,
  approved: requestStats.approved,
  declined: requestStats.declined,
  cancelled: requestStats.cancelled,

  users: plan.requests.map((request) => ({
    id: request.requester.id,

    name: request.requester.full_name,

    age: request.requester.birth_date
      ? calculateAge(request.requester.birth_date)
      : null,

    photoUrl:
      request.requester.photos[0]?.media_url ?? null,

    status: request.status,
  })),
},
    /**
     * Confirmed date
     */
    confirmedDate: confirmed
      ? {
          id: confirmed.id,

          status: confirmed.status,

          eventDateTime: confirmed.eventDateTime,

          participant: confirmed.participant
            ? {
                id: confirmed.participant.id,
                name: confirmed.participant.full_name,
                age: confirmed.participant.birth_date
                  ? calculateAge(
                      confirmed.participant.birth_date,
                    )
                  : null,
                photoUrl:
                  confirmed.participant.photos[0]?.media_url ??
                  null,
              }
            : null,
        }
      : null,

    /**
     * Review
     */
    review: getStaticHistoryReview(historyStatus),

    /**
     * Message
     */
    message: getHistoryMessage(
      historyStatus,
      participant?.full_name,
      requestStats.total,
    ),

    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
};

export const updateDatePlanActivityService = async (
  userId: string,
  planId: string,
  data: UpdateDatePlanActivityDTO,
) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  if (!planId) {
    throw new Error("Plan ID is required");
  }

  if (!data.activityId) {
    throw new Error("Activity ID is required");
  }

  // 1. Check plan belongs to logged-in user
  const existingPlan = await prisma.datePlan.findFirst({
    where: {
      id: planId,
      userId,
    },
    select: {
      id: true,
      activityId: true,
      status: true,
    },
  });

  if (!existingPlan) {
    throw new Error("Date plan not found");
  }

  // 2. Check selected activity exists and is actually an ACTIVITY option
  const activity = await prisma.datePlanOption.findFirst({
    where: {
      id: data.activityId,
      type: "ACTIVITY",
    },
    select: {
      id: true,
      type: true,
      label: true,
      value: true,
      icon: true,
    },
  });

  if (!activity) {
    throw new Error("Invalid activity selected");
  }

  // 3. Update only activityId
  const updatedPlan = await prisma.datePlan.update({
    where: {
      id: planId,
    },
    data: {
      activityId: data.activityId,
    },
    select: {
      id: true,
      activityId: true,
      updatedAt: true,

      activity: {
        select: {
          id: true,
          type: true,
          label: true,
          value: true,
          icon: true,
        },
      },
    },
  });

  return updatedPlan;
};

export const cancelDatePlanService = async (userId: string, planId: string) => {
  // Check if the date plan exists
  const datePlan = await prisma.datePlan.findUnique({
    where: {
      id: planId,
    },
  });

  if (!datePlan) {
    throw new Error("Date plan not found");
  }

  // Check ownership
  if (datePlan.userId !== userId) {
    throw new Error("You are not authorized to cancel this date plan");
  }

  // Check whether plan can be cancelled
  if (datePlan.status !== "BOOKED" && datePlan.status !== "ACTIVE") {
    throw new Error(
      `Date plan cannot be cancelled because its current status is ${datePlan.status}`,
    );
  }

  // Cancel the date plan
  const cancelledPlan = await prisma.datePlan.update({
    where: {
      id: planId,
    },
    data: {
      status: "CANCELLED",
    },
  });

  return cancelledPlan;
};
