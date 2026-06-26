import { OptionType } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";

export const upsertDatePlanOptionsService = async (
  type: OptionType,
  options: any[]
) => {
  const existing = await prisma.datePlanOption.findMany({
    where: {
      type,
    },
  });

  const existingIds = existing.map((item) => item.id);

  const incomingIds = options
    .filter((item) => item.id)
    .map((item) => item.id);

  const deletedIds = existingIds.filter(
    (id) => !incomingIds.includes(id)
  );

  if (deletedIds.length) {
    await prisma.datePlanOption.deleteMany({
      where: {
        id: {
          in: deletedIds,
        },
      },
    });
  }

  return Promise.all(
    options.map(async (item) => {
      if (item.id) {
        return prisma.datePlanOption.update({
          where: {
            id: item.id,
          },
          data: {
            label: item.label,
            value: item.value,
            icon: item.icon,
            sortOrder: item.sortOrder ?? 0,
            isActive: item.isActive ?? true,
          },
        });
      }

      return prisma.datePlanOption.create({
        data: {
          type,
          label: item.label,
          value: item.value,
          icon: item.icon,
          sortOrder: item.sortOrder ?? 0,
          isActive: true,
        },
      });
    })
  );
};

export const getOptionsByTypeService = async (
  type?: OptionType
) => {
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
  }
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