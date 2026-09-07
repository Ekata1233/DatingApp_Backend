import {
  Prisma,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";


interface GetWalletTransactionsParams {
  walletId: string;
  filter: "ALL" | "IN" | "OUT";
  skip: number;
  take: number;
}

export const walletRepository = {
  // ==========================================
  // GET USER WALLET
  // ==========================================

  getWalletByUserId: async (
    userId: string,
  ) => {
    return prisma.wallet.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
        userId: true,
        balance: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  // ==========================================
  // GET DATE PLAN BALANCE
  // ==========================================

  getDatePlanBalance: async (
    userId: string,
  ) => {
    return prisma.datePlanUserStats.findUnique({
      where: {
        userId,
      },
      select: {
        balance: true,
        totalDatePlan: true,
        purchasedDataPlan: true,
      },
    });
  },

  // ==========================================
  // GET WALLET TRANSACTIONS
  // ==========================================

  getTransactions: async ({
    walletId,
    filter,
    skip,
    take,
  }: GetWalletTransactionsParams) => {
    const where =
      buildTransactionWhere(
        walletId,
        filter,
      );

    const [transactions, total] =
      await Promise.all([
        prisma.walletTransaction.findMany({
          where,

          orderBy: {
            createdAt: "desc",
          },

          skip,
          take,

          select: {
            id: true,
            amount: true,
            type: true,
            status: true,
            source: true,
            referenceId: true,
            description: true,
            balanceBefore: true,
            balanceAfter: true,
            createdAt: true,
          },
        }),

        prisma.walletTransaction.count({
          where,
        }),
      ]);

    return {
      transactions,
      total,
    };
  },
};

// ==========================================
// TRANSACTION FILTER
// ==========================================

const buildTransactionWhere = (
  walletId: string,
  filter: "ALL" | "IN" | "OUT",
): Prisma.WalletTransactionWhereInput => {
  const where: Prisma.WalletTransactionWhereInput =
    {
      walletId,

      status: TransactionStatus.SUCCESS,
    };

  if (filter === "IN") {
    where.type = {
      in: [
        TransactionType.DEPOSIT,
        TransactionType.REFUND,
        TransactionType.REWARD,
        TransactionType.PACKAGE_BONUS,
      ],
    };
  }

  if (filter === "OUT") {
    where.type = {
      in: [
        TransactionType.WITHDRAW,
        TransactionType.PURCHASE,
      ],
    };
  }

  return where;
};