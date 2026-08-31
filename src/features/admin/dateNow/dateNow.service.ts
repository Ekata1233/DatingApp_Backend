import { OptionType, Prisma } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";
import { GetPlansQuery } from "./dateNow.types";

export const upsertDatePlanOptionsService = async (
  type: OptionType,
  options: any[],
) => {
  return prisma.$transaction(
    async (tx) => {
      for (const item of options) {
        // =====================================================
        // 1. CHECK ACTIVE RECORD
        // Same TYPE + Same VALUE
        // =====================================================

        const existingActive = await tx.datePlanOption.findFirst({
          where: {
            type,
            value: item.value,
            isActive: true,
          },
        });

        if (existingActive) {
          // Existing record → UPDATE
          await tx.datePlanOption.update({
            where: {
              id: existingActive.id,
            },
            data: {
              label: item.label,
              value: item.value,
              icon: item.icon,
              sortOrder: item.sortOrder ?? 0,
              isActive: true,
            },
          });

          continue;
        }

        // =====================================================
        // 2. CHECK INACTIVE RECORD
        // Same TYPE + Same VALUE
        // =====================================================

        const existingInactive = await tx.datePlanOption.findFirst({
          where: {
            type,
            value: item.value,
            isActive: false,
          },
        });

        if (existingInactive) {
          // Old record exists → REACTIVATE
          await tx.datePlanOption.update({
            where: {
              id: existingInactive.id,
            },
            data: {
              label: item.label,
              value: item.value,
              icon: item.icon,
              sortOrder: item.sortOrder ?? 0,
              isActive: true,
            },
          });

          continue;
        }

        // =====================================================
        // 3. COMPLETELY NEW RECORD
        // =====================================================

        await tx.datePlanOption.create({
          data: {
            type,
            label: item.label,
            value: item.value,
            icon: item.icon,
            sortOrder: item.sortOrder ?? 0,
            isActive: true,
          },
        });
      }

      // =====================================================
      // 4. RETURN ALL ACTIVE OPTIONS FOR THIS TYPE
      // =====================================================

      return tx.datePlanOption.findMany({
        where: {
          type,
          isActive: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
      });
    },
    {
      timeout: 30000,
      maxWait: 10000,
    },
  );
};

export const getOptionsByTypeService = async (type?: OptionType) => {
  const whereClause: any = {
    isActive: true,
  };

  if (type) {
    whereClause.type = type;
  }

  return prisma.datePlanOption.findMany({
    where: whereClause,
    orderBy: {
      sortOrder: "asc",
    },
  });
};

export const createDatePlanPackage = async (payload: {
  title: string;
  description?: string;
  planCount: number;
  price: number;
  pricePerPlan: number;
  discount?: number;
  isPopular?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}) => {
  return prisma.datePlanPackage.create({
    data: payload,
  });
};

export const updateDatePlanPackage = async (
  id: string,
  payload: {
    title?: string;
    description?: string;
    planCount?: number;
    price?: number;
    pricePerPlan?: number;
    discount?: number;
    isPopular?: boolean;
    isActive?: boolean;
    sortOrder?: number;
  },
) => {
  const packageData = await prisma.datePlanPackage.findUnique({
    where: { id },
  });

  if (!packageData) {
    throw new Error("Date plan package not found");
  }

  return prisma.datePlanPackage.update({
    where: { id },
    data: payload,
  });
};

export const getDatePlanPackages = async () => {
  return prisma.datePlanPackage.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });
};

export const getDatePlansService = async ({
  page = 1,
  limit = 10,
  search,
  status,
}: GetPlansQuery) => {
  const skip = (page - 1) * limit;

  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      {
        title: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        venueName: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        user: {
          full_name: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  const [plans, total] = await Promise.all([
    prisma.datePlan.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },

      include: {
        user: {
          select: {
            id: true,
            full_name: true,
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
        quickTitle: {
          select: {
            label: true,
          },
        },
        visibility: {
          select: {
            label: true,
          },
        },

        requests: {
          select: {
            id: true,
          },
        },
      },
    }),

    prisma.datePlan.count({
      where,
    }),
  ]);

  const data = plans.map((plan) => ({
    id: plan.id,

    host: {
      id: plan.user.id,
      name: plan.user.full_name,
      profileImage: plan.user.photos[0]?.media_url ?? null,
    },

    plan: plan.title ?? plan.quickTitle?.label ?? "",

    cityArea: plan.venueAddress,

    city: plan.venueAddress,

    venue: plan.venueName,

    venueWhen: plan.eventDateTime,

    visibility: plan.visibility?.label ?? "",

    requests: plan.requests.length,

    status: plan.status,
  }));

  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getDatePlanDetailsService = async (planId: string) => {
  const plan = await prisma.datePlan.findUnique({
    where: {
      id: planId,
    },

    include: {
      user: {
        select: {
          id: true,
          full_name: true,

          photos: {
            where: {
              is_primary: true,
            },
            take: 1,
            select: {
              media_url: true,
            },
          },
        },
      },

      activity: {
        select: {
          label: true,
          icon: true,
        },
      },

      quickTitle: {
        select: {
          label: true,
          icon: true,
        },
      },

      whoPays: {
        select: {
          label: true,
        },
      },

      joinRequestGender: {
        select: {
          label: true,
        },
      },

      visibility: {
        select: {
          label: true,
        },
      },

      vibes: {
        include: {
          vibe: true,
        },
      },

      requests: {
        include: {
          requester: {
            select: {
              id: true,
              full_name: true,

              photos: {
                where: {
                  is_primary: true,
                },
                take: 1,
                select: {
                  media_url: true,
                },
              },
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      },

      DateConfirmed: true,
    },
  });

  if (!plan) {
    throw new Error("Date Plan not found");
  }

  return {
    success: true,

    data: {
      id: plan.id,

      host: {
        id: plan.user.id,
        name: plan.user.full_name,
        profileImage: plan.user.photos[0]?.media_url ?? null,
      },

      activity: plan.activity,

      title: plan.title,

      quickTitle: plan.quickTitle,

      note: plan.note,

      photoUrl: plan.photoUrl,

      venueName: plan.venueName,

      venueAddress: plan.venueAddress,

      venueLat: plan.venueLat,

      venueLng: plan.venueLng,

      duration: plan.duration,

      participantLimit: plan.participantLimit,

      status: plan.status,

      eventDateTime: plan.eventDateTime,

      expiresAt: plan.expiresAt,

      createdAt: plan.createdAt,

      updatedAt: plan.updatedAt,

      whoPays: plan.whoPays,

      joinRequestGender: plan.joinRequestGender,

      visibility: plan.visibility,

      vibes: plan.vibes.map((v) => ({
        id: v.vibe.id,
        label: v.vibe.label,
        icon: v.vibe.icon,
      })),

      totalRequests: plan.requests.length,

      requests: plan.requests.map((r) => ({
        id: r.id,

        status: r.status,

        message: r.message,

        createdAt: r.createdAt,

        requester: {
          id: r.requester.id,
          name: r.requester.full_name,
          profileImage: r.requester.photos[0]?.media_url ?? null,
        },
      })),

      confirmedDate: plan.DateConfirmed,
    },
  };
};

export const createDatePlanPackageInfoService = async (
  payload: {
    howOnePlanWorks?: Prisma.InputJsonValue;
    whyPeopleBuyPlans?: Prisma.InputJsonValue;
    goodToKnow?: Prisma.InputJsonValue;
  },
) => {
  return prisma.$transaction(async (tx) => {
    // Find existing common info
    const existing = await tx.datePlanPackageInfo.findFirst();

    // If old data exists, delete it
    if (existing) {
      await tx.datePlanPackageInfo.delete({
        where: {
          id: existing.id,
        },
      });
    }

    // Create new data
    return tx.datePlanPackageInfo.create({
      data: {
        ...(payload.howOnePlanWorks !== undefined && {
          howOnePlanWorks: payload.howOnePlanWorks,
        }),

        ...(payload.whyPeopleBuyPlans !== undefined && {
          whyPeopleBuyPlans: payload.whyPeopleBuyPlans,
        }),

        ...(payload.goodToKnow !== undefined && {
          goodToKnow: payload.goodToKnow,
        }),
      },
    });
  });
};
export const getDatePlanPackageInfoService = async () => {
  return prisma.datePlanPackageInfo.findFirst();
};


export const createDatePlanPackageFeaturesService = async (
  payload: {
    costToPostPlan?: number;
    costToPostPlanActive?: boolean;
    costToPostPlanPaidOnly?: boolean;

    planBoostPrice?: number;
    planBoostActive?: boolean;
    planBoostPaidOnly?: boolean;
  },
) => {
  return prisma.$transaction(async (tx) => {
    // Find existing common features
    const existing = await tx.datePlanPackageFeatures.findFirst();

    // Delete old data
    if (existing) {
      await tx.datePlanPackageFeatures.delete({
        where: {
          id: existing.id,
        },
      });
    }

    // Create new data
    return tx.datePlanPackageFeatures.create({
      data: {
        ...(payload.costToPostPlan !== undefined && {
          costToPostPlan: new Prisma.Decimal(
            payload.costToPostPlan,
          ),
        }),

        ...(payload.costToPostPlanActive !== undefined && {
          costToPostPlanActive: payload.costToPostPlanActive,
        }),

        ...(payload.costToPostPlanPaidOnly !== undefined && {
          costToPostPlanPaidOnly: payload.costToPostPlanPaidOnly,
        }),

        ...(payload.planBoostPrice !== undefined && {
          planBoostPrice: new Prisma.Decimal(
            payload.planBoostPrice,
          ),
        }),

        ...(payload.planBoostActive !== undefined && {
          planBoostActive: payload.planBoostActive,
        }),

        ...(payload.planBoostPaidOnly !== undefined && {
          planBoostPaidOnly: payload.planBoostPaidOnly,
        }),
      },
    });
  });
};

export const getDatePlanPackageFeaturesService = async () => {
  return prisma.datePlanPackageFeatures.findFirst();
};

export const getAllDatePlanPackageDataService = async () => {
  const [packages, info, features] = await Promise.all([
    prisma.datePlanPackage.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
    }),

    prisma.datePlanPackageInfo.findFirst(),

    prisma.datePlanPackageFeatures.findFirst(),
  ]);

  return {
    packages,
    info,
    features,
  };
};

export const getDatePlanPackageDataService = async (
   userId: string
) => {
  
  const [packages, info, features,userStats] = await Promise.all([
    prisma.datePlanPackage.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
    }),

    prisma.datePlanPackageInfo.findFirst(),

    prisma.datePlanPackageFeatures.findFirst(),
     prisma.datePlanUserStats.findUnique({
      where: {
        userId,
      },
      select: {
        totalDatePlan: true,
      },
    }),
  ]);

  return {
    availableDatePlan: userStats?.totalDatePlan ?? 0,
    packages,
    info,
    
     
  };
};