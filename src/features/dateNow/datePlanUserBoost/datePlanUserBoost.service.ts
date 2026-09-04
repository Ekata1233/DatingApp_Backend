import {
  DatePlanUserBoostStatus,
  TransactionStatus,
  TransactionType,
  TransactionSource,
} from "@prisma/client";

import {
  ActivateDatePlanBoostInput,
  GetActiveDatePlanBoostInput,
} from "./datePlanUserBoost.types";

import { prisma } from "../../../prisma/prismaClient";


const serviceError = (
  message: string,
  statusCode: number,
) => {
  const error: any = new Error(message);

  error.statusCode = statusCode;

  return error;
};


// =====================================================
// ACTIVATE DATE PLAN BOOST + WALLET DEDUCTION
// =====================================================

export const activateDatePlanBoostService = async (
  data: ActivateDatePlanBoostInput,
) => {
  const {
    userId,
    datePlanId,
    boostOptionId,
  } = data;

  const now = new Date();

  return prisma.$transaction(async (tx) => {

    // =================================================
    // 1. CHECK DATE PLAN BELONGS TO USER
    // =================================================

    const datePlan = await tx.datePlan.findFirst({
      where: {
        id: datePlanId,
        userId,
      },

      select: {
        id: true,
        userId: true,
        status: true,
      },
    });

    if (!datePlan) {
      throw serviceError(
        "Date plan not found or you do not own this plan",
        404,
      );
    }


    // =================================================
    // 2. GET SELECTED BOOST OPTION
    // =================================================

    const boostOption =
      await tx.datePlanBoostOption.findUnique({
        where: {
          id: boostOptionId,
        },

        include: {
          boost: {
            select: {
              id: true,
              isActive: true,
            },
          },
        },
      });

    if (!boostOption) {
      throw serviceError(
        "Boost option not found",
        404,
      );
    }


    // =================================================
    // 3. CHECK MAIN BOOST CONFIG IS ACTIVE
    // =================================================

    if (!boostOption.boost.isActive) {
      throw serviceError(
        "Date plan boost is currently unavailable",
        400,
      );
    }


    // =================================================
    // 4. EXPIRE OLD FINISHED BOOSTS
    // =================================================

    await tx.datePlanUserBoost.updateMany({
      where: {
        datePlanId,
        userId,

        status:
          DatePlanUserBoostStatus.ACTIVE,

        expiresAt: {
          lte: now,
        },
      },

      data: {
        status:
          DatePlanUserBoostStatus.EXPIRED,
      },
    });


    // =================================================
    // 5. CHECK IF SAME PLAN ALREADY BOOSTED
    // =================================================

    const existingActiveBoost =
      await tx.datePlanUserBoost.findFirst({
        where: {
          datePlanId,
          userId,

          status:
            DatePlanUserBoostStatus.ACTIVE,

          expiresAt: {
            gt: now,
          },
        },

        select: {
          id: true,
          expiresAt: true,
        },
      });

    if (existingActiveBoost) {
      throw serviceError(
        "This date plan already has an active boost",
        409,
      );
    }


    // =================================================
    // 6. GET USER WALLET
    // =================================================

    const wallet = await tx.wallet.findUnique({
      where: {
        userId,
      },

      select: {
        id: true,
        balance: true,
      },
    });

    if (!wallet) {
      throw serviceError(
        "Wallet not found",
        404,
      );
    }


    // =================================================
    // 7. GET BOOST PRICE
    // =================================================

    const boostPrice = boostOption.price;

    const balanceBefore = wallet.balance;


    // =================================================
    // 8. CHECK WALLET BALANCE
    // =================================================

    if (balanceBefore.lessThan(boostPrice)) {
      throw serviceError(
        "Insufficient wallet balance",
        400,
      );
    }


    // =================================================
    // 9. DEDUCT BOOST PRICE
    // =================================================

    const updatedWallet = await tx.wallet.update({
      where: {
        id: wallet.id,
      },

      data: {
        balance: {
          decrement: boostPrice,
        },
      },

      select: {
        id: true,
        balance: true,
      },
    });

    const balanceAfter =
      updatedWallet.balance;


    // =================================================
    // 10. CREATE WALLET TRANSACTION
    // =================================================

 const walletTransaction =
  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,

      amount: boostPrice,

      type: TransactionType.PURCHASE,

      status: TransactionStatus.SUCCESS,

      source: TransactionSource.BOOST_PURCHASE,

      referenceId: datePlanId,

      description:
        `Date plan boost - ${boostOption.title}`,

      balanceBefore,

      balanceAfter,
    },
  });


    // =================================================
    // 11. CALCULATE BOOST TIMING
    // =================================================

    const startedAt = now;

    const expiresAt = new Date(
      startedAt.getTime() +
        boostOption.durationHours *
          60 *
          60 *
          1000,
    );


    // =================================================
    // 12. CREATE USER BOOST
    // =================================================

    const userBoost =
      await tx.datePlanUserBoost.create({
        data: {
          datePlanId,
          userId,

          boostOptionId:
            boostOption.id,

          status:
            DatePlanUserBoostStatus.ACTIVE,

          startedAt,
          expiresAt,
        },

        include: {
          boostOption: {
            select: {
              id: true,
              title: true,
              durationHours: true,
              price: true,
              currency: true,
              isPopular: true,
              sortOrder: true,
            },
          },
        },
      });


    // =================================================
    // 13. CALCULATE REMAINING TIME
    // =================================================

    const remainingSeconds = Math.max(
      0,
      Math.floor(
        (
          expiresAt.getTime() -
          Date.now()
        ) / 1000,
      ),
    );


    // =================================================
    // 14. RETURN
    // =================================================

    return {
      isBoosted: true,

      wallet: {
        balanceBefore:
          Number(balanceBefore),

        deductedAmount:
          Number(boostPrice),

        balanceAfter:
          Number(balanceAfter),
      },

      transaction: {
        id:
          walletTransaction.id,

        amount:
          Number(walletTransaction.amount),

        type:
          walletTransaction.type,

        status:
          walletTransaction.status,
      },

      boost: {
        ...userBoost,

        remainingSeconds,
      },
    };
  });
};

// ==========================================
// GET ACTIVE DATE PLAN BOOST
// ==========================================

export const getActiveDatePlanBoostService =
  async (
    data: GetActiveDatePlanBoostInput,
  ) => {
    const {
      userId,
      datePlanId,
    } = data;

    const now = new Date();


    // ========================================
    // 1. CHECK DATE PLAN OWNER
    // ========================================

    const datePlan =
      await prisma.datePlan.findFirst({
        where: {
          id: datePlanId,
          userId,
        },

        select: {
          id: true,
        },
      });

    if (!datePlan) {
      throw serviceError(
        "Date plan not found or you do not own this plan",
        404,
      );
    }


    // ========================================
    // 2. EXPIRE FINISHED BOOSTS
    // ========================================

    await prisma.datePlanUserBoost.updateMany({
      where: {
        datePlanId,
        userId,

        status:
          DatePlanUserBoostStatus.ACTIVE,

        expiresAt: {
          lte: now,
        },
      },

      data: {
        status:
          DatePlanUserBoostStatus.EXPIRED,
      },
    });


    // ========================================
    // 3. FIND ACTIVE BOOST
    // ========================================

    const boost =
      await prisma.datePlanUserBoost.findFirst({
        where: {
          datePlanId,
          userId,

          status:
            DatePlanUserBoostStatus.ACTIVE,

          expiresAt: {
            gt: now,
          },
        },

        include: {
          boostOption: {
            select: {
              id: true,
              title: true,
              durationHours: true,
              price: true,
              currency: true,
              isPopular: true,
              sortOrder: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });


    // ========================================
    // 4. NO ACTIVE BOOST
    // ========================================

    if (!boost) {
      return {
        isBoosted: false,
        boost: null,
      };
    }


    // ========================================
    // 5. CALCULATE REMAINING TIME
    // ========================================

    const remainingSeconds = Math.max(
      0,
      Math.floor(
        (
          boost.expiresAt.getTime() -
          Date.now()
        ) / 1000,
      ),
    );

const requestCount =
  await prisma.datePlanRequest.count({
    where: {
      planId: boost.datePlanId,

      createdAt: {
        gte: boost.startedAt,
        lte: now,
      },
    },
  });

const approvedRequestCount =
  await prisma.datePlanRequest.count({
    where: {
      planId: boost.datePlanId,

      status: "APPROVED",

      createdAt: {
        gte: boost.startedAt,
        lte: now,
      },
    },
  });
    return {
  isBoosted: true,

  boost: {
    id: boost.id,

    datePlanId: boost.datePlanId,

    userId: boost.userId,

    boostOptionId: boost.boostOptionId,

    status: boost.status,

    startedAt: boost.startedAt,

    expiresAt: boost.expiresAt,

    createdAt: boost.createdAt,

    updatedAt: boost.updatedAt,

    boostOption: boost.boostOption,

    remainingSeconds,

    stats: {
      views: boost.viewCount,

      requests: requestCount,

      approved: approvedRequestCount,
    },
  },
};
  };