import {
  PayoutMethodType,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";

export const createPayoutMethodRepository = async (
  data: Prisma.UserPayoutMethodCreateInput
) => {
  return prisma.userPayoutMethod.create({
    data,
  });
};

export const findPayoutMethodByIdRepository =
  async (
    id: string,
    userId: string
  ) => {
    return prisma.userPayoutMethod.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });
  };

export const getUserPayoutMethodsRepository =
  async (userId: string) => {
    return prisma.userPayoutMethod.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  };

export const updatePayoutMethodRepository =
  async (
    id: string,
    data: Prisma.UserPayoutMethodUpdateInput
  ) => {
    return prisma.userPayoutMethod.update({
      where: {
        id,
      },
      data,
    });
  };

export const deactivateOtherPrimaryBankRepository =
  async (
    tx: Prisma.TransactionClient,
    userId: string,
    excludeId?: string
  ) => {
    return tx.userPayoutMethod.updateMany({
      where: {
        userId,
        type: PayoutMethodType.BANK_ACCOUNT,
        bankIsPrimary: true,

        ...(excludeId && {
          id: {
            not: excludeId,
          },
        }),

        deletedAt: null,
      },

      data: {
        bankIsPrimary: false,
      },
    });
  };

export const deactivateOtherPrimaryUpiRepository =
  async (
    tx: Prisma.TransactionClient,
    userId: string,
    excludeId?: string
  ) => {
    return tx.userPayoutMethod.updateMany({
      where: {
        userId,
        type: PayoutMethodType.UPI,
        upiIsPrimary: true,

        ...(excludeId && {
          id: {
            not: excludeId,
          },
        }),

        deletedAt: null,
      },

      data: {
        upiIsPrimary: false,
      },
    });
  };