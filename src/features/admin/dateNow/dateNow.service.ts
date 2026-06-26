import { OptionType } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";

export const upsertDatePlanOptionsService = async (
  type: OptionType,
  options: any[]
) => {
  // Industry-level transaction with proper timeout and error handling
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
  }, {
    // Industry-level transaction options to prevent timeout errors
    timeout: 30000, // 30 seconds - plenty of time for bulk operations
    maxWait: 10000, // 10 seconds max wait for transaction to start
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