import { OptionType } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";

export const upsertDatePlanOptionsService = async (
  type: OptionType,
  options: any[],
) => {
  // Industry-level transaction with proper timeout and error handling
  return prisma.$transaction(
    async (tx) => {
      const incomingValues = options.map((item) => item.value);

      // Soft delete records not present in request
      await tx.datePlanOption.updateMany({
        where: {
          type,
          isActive: true,
          value: {
            notIn: incomingValues,
          },
        },
        data: {
          isActive: false,
        },
      });

      for (const item of options) {
        // Find only ACTIVE records
        const existingActive = await tx.datePlanOption.findFirst({
          where: {
            type,
            value: item.value,
            isActive: true,
          },
        });

        if (existingActive) {
          // Update active record
          await tx.datePlanOption.update({
            where: {
              id: existingActive.id,
            },
            data: {
              label: item.label,
              value: item.value,
              icon: item.icon,
              sortOrder: item.sortOrder ?? 0,
            },
          });
        } else {
          // Check for inactive record to reactivate
          const existingInactive = await tx.datePlanOption.findFirst({
            where: {
              type,
              value: item.value,
              isActive: false,
            },
          });

          if (existingInactive) {
            // Reactivate the inactive record
            await tx.datePlanOption.update({
              where: {
                id: existingInactive.id,
              },
              data: {
                label: item.label,
                icon: item.icon,
                sortOrder: item.sortOrder ?? 0,
                isActive: true,
              },
            });
          } else {
            // Create NEW record
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
        }
      }

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
      // Industry-level transaction options to prevent timeout errors
      timeout: 30000, // 30 seconds - plenty of time for bulk operations
      maxWait: 10000, // 10 seconds max wait for transaction to start
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
