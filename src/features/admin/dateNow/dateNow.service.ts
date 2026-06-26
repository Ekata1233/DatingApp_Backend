

import { OptionType } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";

export const upsertDatePlanOptionsService = async (
  type: OptionType,
  options: any[]
) => {
  return prisma.$transaction(async (tx) => {
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
        // Create NEW record
        // Even if same value exists with isActive=false
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

    return tx.datePlanOption.findMany({
      where: {
        type,
        isActive: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
    });
  });
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

