import {
  DatePlanAttendanceStatus,
  DatePlanRequestStatus,
  PlanStatus,
} from "@prisma/client";

import { prisma } from "../../../prisma/prismaClient";

interface SubmitAttendanceInput {
  userId: string;
  planId: string;
  attendanceStatus: DatePlanAttendanceStatus;
}

interface GetMyPlansParams {
  userId: string;

  period?: "TODAY" | "TOMORROW" | "WEEKEND";

  activity?: string;

  page: number;
  limit: number;
}

/**
 * Calculate user's age
 */
const calculateAge = (birthDate: Date | null): number | null => {
  if (!birthDate) return null;

  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  const month = today.getMonth() - birthDate.getMonth();

  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

/**
 * Get date range according to selected period
 */
const getDateRange = (period: "TODAY" | "TOMORROW" | "WEEKEND") => {
  const now = new Date();

  const startOfDay = (date: Date) => {
    const result = new Date(date);

    result.setHours(0, 0, 0, 0);

    return result;
  };

  const endOfDay = (date: Date) => {
    const result = new Date(date);

    result.setHours(23, 59, 59, 999);

    return result;
  };

  /**
   * TODAY
   */
  if (period === "TODAY") {
    return {
      gte: startOfDay(now),
      lte: endOfDay(now),
    };
  }

  /**
   * TOMORROW
   */
  if (period === "TOMORROW") {
    const tomorrow = new Date(now);

    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      gte: startOfDay(tomorrow),
      lte: endOfDay(tomorrow),
    };
  }

  /**
   * WEEKEND
   *
   * Saturday + Sunday
   */
  const currentDay = now.getDay();

  let daysUntilSaturday = 6 - currentDay;

  /**
   * If today is Sunday,
   * next weekend is next Saturday.
   */
  if (currentDay === 0) {
    daysUntilSaturday = 6;
  }

  const saturday = new Date(now);

  saturday.setDate(saturday.getDate() + daysUntilSaturday);

  const sunday = new Date(saturday);

  sunday.setDate(sunday.getDate() + 1);

  return {
    gte: startOfDay(saturday),
    lte: endOfDay(sunday),
  };
};

/**
 * GET MY PLANS
 */
export const getMyPlansService = async ({
  userId,
  period,
  activity,
  page,
  limit,
}: GetMyPlansParams) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  /**
   * Base filter
   */
  const where: any = {
    userId,

    status: {
      in: [PlanStatus.ACTIVE, PlanStatus.BOOKED, PlanStatus.COMPLETED],
    },
  };

  /**
   * Apply period only when provided
   */
  if (period) {
    const dateRange = getDateRange(period);

    where.eventDateTime = {
      gte: dateRange.gte,
      lte: dateRange.lte,
    };
  }

  /**
   * Apply activity only when provided
   */
  if (activity) {
    where.activity = {
      value: {
        equals: activity,
        mode: "insensitive",
      },
    };
  }

  /**
   * Pagination
   */
  const skip = (page - 1) * limit;

  /**
   * Get plans + total count
   */
  const [plans, total] = await prisma.$transaction([
    prisma.datePlan.findMany({
      where,

      orderBy: [
        {
          eventDateTime: "asc",
        },
        {
          createdAt: "desc",
        },
      ],

      skip,
      take: limit,

      include: {
        /**
         * Activity
         */
        activity: true,

        /**
         * Quick title
         */
        quickTitle: true,

        /**
         * Who pays
         */
        whoPays: true,

        /**
         * Gender
         */
        joinRequestGender: true,

        /**
         * Visibility
         */
        visibility: true,

        /**
         * ONLY PENDING REQUESTS
         */
        requests: {
          orderBy: {
            createdAt: "asc",
          },

          include: {
            requester: {
              select: {
                id: true,
                full_name: true,
                birth_date: true,

                photos: {
                  where: {
                    media_type: "IMAGE",
                  },

                  orderBy: [
                    {
                      is_primary: "desc",
                    },
                    {
                      order: "asc",
                    },
                  ],

                  take: 1,

                  select: {
                    id: true,
                    media_url: true,
                    is_primary: true,
                  },
                },
              },
            },
          },
        },

        /**
         * Count ALL requests
         *
         * This is useful if frontend
         * needs total request count.
         */
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

  const now = new Date();

  /**
   * Format response
   */
  const data = plans.map((plan) => {
    /**
     * Since requests contains ONLY
     * PENDING requests:
     */
    const pendingRequests = plan.requests.length;

    const participantLimit = plan.participantLimit ?? 1;

    /**
     * Live calculation
     */
    let isLiveNow = false;

    if (plan.eventDateTime) {
      const startTime = plan.eventDateTime;

      const endTime = plan.expiresAt
        ? plan.expiresAt
        : plan.duration !== null
          ? new Date(startTime.getTime() + plan.duration * 60 * 1000)
          : null;

      if (endTime) {
        isLiveNow = startTime <= now && now < endTime;
      }
    }

    return {
      id: plan.id,

      status: plan.status,

      statusLabel: isLiveNow ? "LIVE NOW" : plan.status,

      title: plan.title ?? plan.quickTitle?.label ?? null,

      photoUrl: plan.photoUrl,

      /**
       * Activity
       */
      activity: plan.activity
        ? {
            id: plan.activity.id,

            label: plan.activity.label,

            value: plan.activity.value,

            icon: plan.activity.icon,
          }
        : null,

      /**
       * Quick title
       */
      quickTitle: plan.quickTitle
        ? {
            id: plan.quickTitle.id,

            label: plan.quickTitle.label,

            value: plan.quickTitle.value,
          }
        : null,

      /**
       * Event
       */
      event: {
        dateTime: plan.eventDateTime,

        duration: plan.duration,

        isLiveNow,
      },

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
       * Who pays
       */
      whoPays: plan.whoPays
        ? {
            id: plan.whoPays.id,

            label: plan.whoPays.label,

            value: plan.whoPays.value,
          }
        : null,

      /**
       * Participant limit
       */
      participantLimit,

      /**
       * Join request gender
       */
      joinRequestGender: plan.joinRequestGender
        ? {
            id: plan.joinRequestGender.id,

            label: plan.joinRequestGender.label,

            value: plan.joinRequestGender.value,
          }
        : null,

      /**
       * Visibility
       */
      visibility: plan.visibility
        ? {
            id: plan.visibility.id,

            label: plan.visibility.label,

            value: plan.visibility.value,
          }
        : null,

      /**
       * Requests
       */
      requests: {
        /**
         * ALL request records
         */
        total: plan._count.requests,

        /**
         * ONLY PENDING
         */
        pending: pendingRequests,
      },

      /**
       * Remaining spots
       *
       * Pending users have NOT yet
       * become participants.
       */
      remainingSpots: participantLimit,

      /**
       * Pending request list
       */
      requestsList: plan.requests.map((request) => ({
        id: request.id,

        status: request.status,

        message: request.message,

        createdAt: request.createdAt,

        requester: {
          id: request.requester.id,

          name: request.requester.full_name,

          age: calculateAge(request.requester.birth_date),

          photo: request.requester.photos[0]?.media_url ?? null,

          matchPercentage: null,
        },
      })),
    };
  });

  /**
   * Pagination
   */
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,

    message: "My plans fetched successfully",

    data,

    pagination: {
      page,
      limit,
      total,
      totalPages,

      hasNextPage: page < totalPages,

      hasPreviousPage: page > 1,
    },

    filter: {
      period,

      activity: activity ?? null,
    },
  };
};

export const submitDatePlanAttendance = async ({
  userId,
  planId,
  attendanceStatus,
}: SubmitAttendanceInput) => {
  // 1. Find the Date Plan
  const plan = await prisma.datePlan.findUnique({
    where: {
      id: planId,
    },
    include: {
      DateConfirmed: true,
      user: {
        select: {
          id: true,
          full_name: true,
        },
      },
    },
  });

  if (!plan) {
    throw new Error("Date plan not found");
  }

  // 2. Only plan owner can submit their feedback
  if (plan.userId !== userId) {
    throw new Error("You are not allowed to submit feedback for this plan");
  }

  // 3. Check if feedback already exists
  const existingFeedback = await prisma.datePlanFeedback.findUnique({
    where: {
      planId_reviewerId: {
        planId,
        reviewerId: userId,
      },
    },
  });

  if (existingFeedback) {
    throw new Error("Feedback has already been submitted for this plan");
  }

  // 4. Find the person who met the user
  let metUserId: string | null = null;

  if (attendanceStatus === "MET") {
    if (!plan.DateConfirmed) {
      throw new Error("No confirmed date found for this plan");
    }

    metUserId = plan.DateConfirmed.participantId;
  }

  // 5. Create feedback
  const feedback = await prisma.datePlanFeedback.create({
    data: {
      planId,
      reviewerId: userId,
      attendanceStatus,
      metUserId,
      status: "SUBMITTED",
    },
    include: {
      metUser: {
        select: {
          id: true,
          full_name: true,
        },
      },
    },
  });

  return {
    id: feedback.id,
    planId: feedback.planId,
    attendanceStatus: feedback.attendanceStatus,
    metUser: feedback.metUser,
    status: feedback.status,
    createdAt: feedback.createdAt,
  };
};
