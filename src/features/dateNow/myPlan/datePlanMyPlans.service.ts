import {
  DatePlanAttendanceStatus,
  DatePlanFeedbackStatus,
  DatePlanRequestStatus,
  PlanStatus,
} from "@prisma/client";

import { prisma } from "../../../prisma/prismaClient";
import { GetMyPlansParams, SubmitAttendanceInput, SubmitDatePlanReportInput, SubmitExperienceFeedbackInput, SubmitNoShowFeedbackInput, UpdateMetUserInput } from "./datePlanMyPlans.types";



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

  // Exclude plans where the logged-in user
  // has already submitted MET feedback
  feedbacks: {
    none: {
      reviewerId: userId,
      attendanceStatus: DatePlanAttendanceStatus.MET,
      status: DatePlanFeedbackStatus.SUBMITTED,
    },
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

  }

  // 5. Create feedback
  const feedback = await prisma.datePlanFeedback.create({
    data: {
      planId,
      reviewerId: userId,
      attendanceStatus,
      metUserId,
      status: "PENDING",
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

export const updateMetUser = async ({
  userId,
  planId,
  metUserId,
}: UpdateMetUserInput) => {
  // 1. Check feedback belongs to logged-in user
  const feedback = await prisma.datePlanFeedback.findUnique({
    where: {
      planId_reviewerId: {
        planId,
        reviewerId: userId,
      },
    },
  });

  if (!feedback) {
    throw new Error(
      "Attendance feedback not found. Please submit attendance first."
    );
  }

  // 2. User must have selected "Yes, we met"
  if (feedback.attendanceStatus !== "MET") {
    throw new Error(
      "You can select a person only when attendance status is MET."
    );
  }

  // 3. Cannot select yourself
  if (metUserId === userId) {
    throw new Error("You cannot select yourself.");
  }

  // 4. Check selected user exists
  const metUser = await prisma.user.findUnique({
    where: {
      id: metUserId,
    },
    select: {
      id: true,
      full_name: true,
    },
  });

  if (!metUser) {
    throw new Error("Selected user not found.");
  }

  // 5. Update feedback
  const updatedFeedback = await prisma.datePlanFeedback.update({
    where: {
      id: feedback.id,
    },
    data: {
      metUserId: metUserId,
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
    id: updatedFeedback.id,
    planId: updatedFeedback.planId,
    attendanceStatus: updatedFeedback.attendanceStatus,
    metUser: updatedFeedback.metUser,
    status: updatedFeedback.status,
    updatedAt: updatedFeedback.updatedAt,
  };
};

export const submitExperienceFeedback = async ({
  userId,
  planId,
  overallRating,
  personRating,
  experienceTags = [],
  comment,
}: SubmitExperienceFeedbackInput) => {
  // 1. Find feedback belonging to logged-in user
  const feedback = await prisma.datePlanFeedback.findUnique({
    where: {
      planId_reviewerId: {
        planId,
        reviewerId: userId,
      },
    },

    include: {
      metUser: {
        select: {
          id: true,
          full_name: true,
        },
      },
      plan: {
        select: {
          id: true,
          title: true,
          venueName: true,
          eventDateTime: true,
        },
      },
    },
  });

  if (!feedback) {
    throw new Error(
      "Attendance feedback not found. Please submit attendance first."
    );
  }

  // 2. User must have selected "Yes, we met"
  if (feedback.attendanceStatus !== "MET") {
    throw new Error(
      "Experience feedback can only be submitted when attendance status is MET."
    );
  }

  // 3. User must have selected the person they met
  if (!feedback.metUserId) {
    throw new Error(
      "Please select the person you met before submitting experience feedback."
    );
  }

  // 4. Prevent submitting feedback multiple times
  if (feedback.status === "SUBMITTED") {
    throw new Error("Experience feedback has already been submitted.");
  }

  // 5. Validate overall rating
  if (
    !Number.isInteger(overallRating) ||
    overallRating < 1 ||
    overallRating > 5
  ) {
    throw new Error("Overall rating must be between 1 and 5.");
  }

  // 6. Validate person rating
  if (
    !Number.isInteger(personRating) ||
    personRating < 1 ||
    personRating > 5
  ) {
    throw new Error("Person rating must be between 1 and 5.");
  }

  // 7. Validate experience tags
  const validTags = [
    "RESPECTFUL",
    "GREAT_CONVERSATION",
    "ON_TIME",
    "GENUINE",
    "FUN",
    "WOULD_MEET_AGAIN",
  ] as const;

  for (const tag of experienceTags) {
    if (!validTags.includes(tag)) {
      throw new Error(`Invalid experience tag: ${tag}`);
    }
  }

  // 8. Update feedback + create tags in transaction
  const updatedFeedback = await prisma.$transaction(async (tx) => {
    // Delete existing tags in case this endpoint is later changed
    // to support editing feedback.
    await tx.datePlanFeedbackTag.deleteMany({
      where: {
        feedbackId: feedback.id,
      },
    });

    const updated = await tx.datePlanFeedback.update({
      where: {
        id: feedback.id,
      },

      data: {
        overallRating,
        personRating,
        comment: comment?.trim() || null,
        status: "SUBMITTED",

        experienceTags: {
          create: experienceTags.map((tag) => ({
            tag,
          })),
        },
      },

      include: {
        metUser: {
          select: {
            id: true,
            full_name: true,
          },
        },

        experienceTags: {
          select: {
            id: true,
            tag: true,
          },
        },

        plan: {
          select: {
            id: true,
            title: true,
            venueName: true,
            eventDateTime: true,
          },
        },
      },
    });

    return updated;
  });

  return {
    id: updatedFeedback.id,
    planId: updatedFeedback.planId,

    overallRating: updatedFeedback.overallRating,
    personRating: updatedFeedback.personRating,

    metUser: updatedFeedback.metUser,

    experienceTags: updatedFeedback.experienceTags.map(
      (item) => item.tag
    ),

    comment: updatedFeedback.comment,

    status: updatedFeedback.status,

    plan: updatedFeedback.plan,

    updatedAt: updatedFeedback.updatedAt,
  };
};

export const submitNoShowFeedback = async ({
  userId,
  planId,
  overallRating,
  noShowReason,
}: SubmitNoShowFeedbackInput) => {
  // 1. Find feedback belonging to logged-in user
  const feedback = await prisma.datePlanFeedback.findUnique({
    where: {
      planId_reviewerId: {
        planId,
        reviewerId: userId,
      },
    },
  });

  if (!feedback) {
    throw new Error(
      "Attendance feedback not found. Please submit attendance first."
    );
  }

  // 2. User must have selected "No one showed up"
  if (feedback.attendanceStatus !== "NO_SHOW") {
    throw new Error(
      "No-show feedback can only be submitted when attendance status is NO_SHOW."
    );
  }

  // 3. metUserId must not exist for NO_SHOW
  if (feedback.metUserId) {
    throw new Error(
      "A user cannot be selected when nobody showed up."
    );
  }

  // 4. Prevent duplicate submission
  if (feedback.status === "SUBMITTED") {
    throw new Error(
      "Feedback has already been submitted."
    );
  }

  // 5. Validate overall rating
  if (
    !Number.isInteger(overallRating) ||
    overallRating < 1 ||
    overallRating > 5
  ) {
    throw new Error(
      "Overall rating must be between 1 and 5."
    );
  }

  // 6. Validate no-show reason
  const validReasons = [
    "TIMING_WAS_OFF",
    "VENUE_TOO_FAR",
    "SHORT_NOTICE",
    "APPROVED_TOO_LATE",
    "NOT_SURE",
  ] as const;

  if (
    noShowReason &&
    !validReasons.includes(noShowReason)
  ) {
    throw new Error(
      `Invalid no-show reason: ${noShowReason}`
    );
  }

  // 7. Update feedback
  const updatedFeedback =
    await prisma.datePlanFeedback.update({
      where: {
        id: feedback.id,
      },

      data: {
        overallRating,
        noShowReason: noShowReason ?? null,
        status: "SUBMITTED",
      },

      select: {
        id: true,
        planId: true,
        reviewerId: true,
        attendanceStatus: true,
        overallRating: true,
        personRating: true,
        noShowReason: true,
        metUserId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

  return updatedFeedback;
};

//REPOST ISSUE
export const submitDatePlanReport = async ({
  userId,
  planId,
  reason,
  comment,
}: SubmitDatePlanReportInput) => {
  // 1. Find feedback submitted by logged-in user
  const feedback = await prisma.datePlanFeedback.findUnique({
    where: {
      planId_reviewerId: {
        planId,
        reviewerId: userId,
      },
    },

    select: {
      id: true,
      planId: true,
      reviewerId: true,
      attendanceStatus: true,
      metUserId: true,
    },
  });

  if (!feedback) {
    throw new Error(
      "Feedback not found. Please complete the attendance step first."
    );
  }

  // 2. User must have met someone
  if (feedback.attendanceStatus !== "MET") {
    throw new Error(
      "You can report a person only after selecting that you met them."
    );
  }

  // 3. Make sure the person they met exists
  if (!feedback.metUserId) {
    throw new Error(
      "The person you met could not be identified."
    );
  }

  // 4. Prevent reporting yourself
  if (feedback.metUserId === userId) {
    throw new Error(
      "You cannot report yourself."
    );
  }

  // 5. Validate report reason
  const validReasons = [
    "DID_NOT_SHOW_AS_DESCRIBED",
    "MADE_ME_UNCOMFORTABLE",
    "INAPPROPRIATE_BEHAVIOUR",
    "FAKE_PROFILE",
    "SAFETY_CONCERN",
  ] as const;

  if (!validReasons.includes(reason)) {
    throw new Error(
      `Invalid report reason: ${reason}`
    );
  }

  // 6. Check whether the same user already reported this person
  const existingReport = await prisma.datePlanReport.findFirst({
    where: {
      planId,
      reporterId: userId,
      reportedUserId: feedback.metUserId,
    },
  });

  if (existingReport) {
    throw new Error(
      "You have already reported this person for this date plan."
    );
  }

  // 7. Create report
  const report = await prisma.datePlanReport.create({
    data: {
      planId,
      reporterId: userId,
      reportedUserId: feedback.metUserId,
      reason,
      comment: comment?.trim() || null,
      status: "PENDING",
    },

    select: {
      id: true,
      planId: true,
      reporterId: true,
      reportedUserId: true,
      reason: true,
      comment: true,
      status: true,
      createdAt: true,
    },
  });

  return report;
};