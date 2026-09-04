import { prisma } from "../../../../prisma/prismaClient";
import { CreateOrUpdateDatePlanBoostInput } from "./datePlanBoost.types";


export const createOrUpdateDatePlanBoostService = async (
  data: CreateOrUpdateDatePlanBoostInput,
) => {
  const existingBoost = await prisma.datePlanBoost.findFirst();

  // =====================================================
  // FIRST TIME -> CREATE
  // =====================================================

  if (!existingBoost) {
    return prisma.datePlanBoost.create({
      data: {
        title: data.title,
        description: data.description,
        isActive: data.isActive ?? true,

        options: {
          create: data.options.map((option) => ({
            title: option.title,
            durationHours: option.durationHours,
            price: option.price,
            currency: option.currency ?? "INR",
            isPopular: option.isPopular ?? false,
            sortOrder: option.sortOrder ?? 0,
          })),
        },
      },

      include: {
        options: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });
  }

  // =====================================================
  // SECOND TIME AND AFTER -> UPDATE SAME RECORD
  // =====================================================

  return prisma.$transaction(async (tx) => {
    // Remove previous options
    await tx.datePlanBoostOption.deleteMany({
      where: {
        boostId: existingBoost.id,
      },
    });

    // Update same boost and create new options
    const updatedBoost = await tx.datePlanBoost.update({
      where: {
        id: existingBoost.id,
      },

      data: {
        title: data.title,
        description: data.description,
        isActive: data.isActive ?? true,

        options: {
          create: data.options.map((option) => ({
            title: option.title,
            durationHours: option.durationHours,
            price: option.price,
            currency: option.currency ?? "INR",
            isPopular: option.isPopular ?? false,
            sortOrder: option.sortOrder ?? 0,
          })),
        },
      },

      include: {
        options: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });

    return updatedBoost;
  });
};

export const getDatePlanBoostService = async () => {
  const boost = await prisma.datePlanBoost.findFirst({
    include: {
      options: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!boost) {
    throw new Error("Date plan boost not found");
  }

  return boost;
};
export const getActiveDatePlanBoostForMobileService = async (
  userId: string,
) => {
  const boost = await prisma.datePlanBoost.findFirst({
    where: {
      isActive: true,
    },
    include: {
      options: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!boost) {
    throw new Error("Active date plan boost not found");
  }

  const wallet = await prisma.wallet.findUnique({
    where: {
      userId,
    },
    select: {
      balance: true,
    },
  });

  return {
    id: boost.id,
    title: boost.title,
    description: boost.description,
    isActive: boost.isActive,

    walletBalance: wallet
      ? Number(wallet.balance)
      : 0,

    options: boost.options.map((option) => ({
      id: option.id,
      title: option.title,
      durationHours: option.durationHours,
      price: Number(option.price),
      currency: option.currency,
      isPopular: option.isPopular,
      sortOrder: option.sortOrder,
    })),
  };
};