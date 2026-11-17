import { Prisma } from "@prisma/client";
import { addDays } from "date-fns";

const PACKAGE_BENEFIT_CODES = {
  ROSE: "ROSES",
  COMPLIMENT: "WEEKLY_COMPLIMENTS",
  BOOST: "WEEKLY_BOOSTS",
  DATE_PLAN: "WEEKLY_DATE_PLANS",
  WELCOME_COINS: "WELCOME_COINS",
} as const;

export const creditPackageBenefits = async (
  tx: Prisma.TransactionClient,
  userId: string,
  packageId: string,
) => {
  const now = new Date();
  const nextResetAt = addDays(now, 7);

  // ==========================================
  // 1. FETCH PACKAGE BENEFITS
  // ==========================================

  const limits = await tx.planLimit.findMany({
    where: {
      packageId,
      enabled: true,
      unlimited: false,
      resetPeriod: "WEEKLY",

      feature: {
        active: true,
        code: {
          in: Object.values(PACKAGE_BENEFIT_CODES),
        },
      },
    },

    select: {
      limit: true,
      feature: {
        select: {
          code: true,
        },
      },
    },
  });

  const getLimit = (code: string): number => {
    return limits.find((item) => item.feature.code === code)?.limit ?? 0;
  };

  const roses = getLimit(PACKAGE_BENEFIT_CODES.ROSE);

  const compliments = getLimit(PACKAGE_BENEFIT_CODES.COMPLIMENT);

  const boosts = getLimit(PACKAGE_BENEFIT_CODES.BOOST);

  const datePlans = getLimit(PACKAGE_BENEFIT_CODES.DATE_PLAN);

  // ==========================================
  // 2. CREDIT FREE ROSES
  // ==========================================

  const existingRoseBalance = await tx.userRoseBalance.findUnique({
    where: { userId },
  });

  const purchasedRoses = existingRoseBalance?.purchasedRoses ?? 0;

  const roseBalance = await tx.userRoseBalance.upsert({
    where: { userId },

    create: {
      userId,
      totalRoses: roses,
      freeRoses: roses,
      purchasedRoses: 0,
      weeklyLimit: roses,
      lastResetAt: now,
      nextResetAt,
    },

    update: {
      freeRoses: {
        increment: roses,
      },
      totalRoses: {
        increment: roses,
      },
      weeklyLimit: roses,
      lastResetAt: now,
      nextResetAt,
    },
  });

  const roseDifference = roses - (existingRoseBalance?.freeRoses ?? 0);

  if (roses > 0) {
    await tx.roseTransaction.create({
      data: {
        userId,
        type: "PACKAGE_CREDIT",
        quantity: roses,
        roseBalanceAfter: roseBalance.totalRoses,
      },
    });
  }

  // ==========================================
  // 3. CREDIT FREE COMPLIMENTS
  // ==========================================

  const existingComplimentBalance = await tx.userComplimentBalance.findUnique({
    where: { userId },
  });

  const purchasedCompliments =
    existingComplimentBalance?.purchasedCompliments ?? 0;

  const complimentBalance = await tx.userComplimentBalance.upsert({
    where: { userId },

    create: {
      userId,
      totalCompliments: compliments,
      freeCompliments: compliments,
      purchasedCompliments: 0,
      weeklyLimit: compliments,
      lastResetAt: now,
      nextResetAt,
    },

    update: {
      freeCompliments: {
        increment: compliments,
      },
      totalCompliments: {
        increment: compliments,
      },
      weeklyLimit: compliments,
      lastResetAt: now,
      nextResetAt,
    },
  });

  const complimentDifference =
    compliments - (existingComplimentBalance?.freeCompliments ?? 0);

  if (compliments > 0) {
    await tx.complimentTransaction.create({
      data: {
        userId,
        type: "PACKAGE_CREDIT",
        quantity: compliments,
        complimentBalanceAfter: complimentBalance.totalCompliments,
      },
    });
  }

  // ==========================================
  // 4. CREDIT FREE BOOSTS
  // ==========================================

  const normalBoost = await tx.boost.findUnique({
    where: {
      name: "BOOST",
    },
    select: {
      id: true,
      is_active: true,
    },
  });

  if (boosts > 0 && (!normalBoost || !normalBoost.is_active)) {
    throw new Error("NORMAL_BOOST_NOT_FOUND_OR_INACTIVE");
  }

  if (normalBoost && boosts > 0) {
    const boostOption = await tx.boostOption.findFirst({
      where: {
        boost_id: normalBoost.id,
        is_active: true,
      },
      orderBy: {
        boostCount: "asc",
      },
      select: {
        id: true,
      },
    });

    if (!boostOption) {
      throw new Error("NORMAL_BOOST_OPTION_NOT_FOUND");
    }
    const existingPackageBoost = await tx.userBoost.findFirst({
      where: {
        user_id: userId,
        boostId: normalBoost.id,
        weeklyLimit: {
          gt: 0,
        },
        is_active: true,
      },
    });

    if (existingPackageBoost) {
      await tx.userBoost.update({
        where: {
          id: existingPackageBoost.id,
        },
        data: {
          total_boosts: {
            increment: boosts,
          },

          remaining_boosts: {
            increment: boosts,
          },

          weeklyLimit: boosts,
          last_reset_at: now,
          next_reset_at: nextResetAt,
          expires_at: null,
          is_active: true,
        },
      });
    } else {
      await tx.userBoost.create({
        data: {
          user_id: userId,
          boostId: normalBoost.id,
          boost_option_id: boostOption.id,

          total_boosts: boosts,
          remaining_boosts: boosts,
          weeklyLimit: boosts,

          last_reset_at: now,
          next_reset_at: nextResetAt,

          start_at: now,
          expires_at: null,
          is_active: true,
        },
      });
    }

    // ==========================================
    // CALCULATE TOTAL AVAILABLE BOOST BALANCE
    // ==========================================

    const boostBalance = await tx.userBoost.aggregate({
      where: {
        user_id: userId,
        boostId: normalBoost.id,
        is_active: true,

        OR: [{ expires_at: null }, { expires_at: { gt: now } }],
      },
      _sum: {
        remaining_boosts: true,
      },
    });

    // ==========================================
    // CREATE BOOST TRANSACTION
    // ==========================================

    await tx.boostTransaction.create({
      data: {
        userId,
        type: "PACKAGE_CREDIT",
        quantity: boosts,
        boostBalanceAfter: boostBalance._sum.remaining_boosts ?? 0,
      },
    });
  }

  // ==========================================
  // 5. CREDIT FREE DATE PLANS
  // ==========================================

  const existingDatePlanStats = await tx.datePlanUserStats.findUnique({
    where: { userId },
  });

  const purchasedDatePlans = existingDatePlanStats?.purchasedDataPlan ?? 0;

  const datePlanStats = await tx.datePlanUserStats.upsert({
    where: { userId },

    create: {
      userId,
      totalDatePlan: datePlans,
      balance: datePlans,
      purchasedDataPlan: 0,
      weeklyLimit: datePlans,
      lastResetAt: now,
      nextResetAt,
    },

    update: {
      totalDatePlan: {
        increment: datePlans,
      },

      balance: {
        increment: datePlans,
      },

      weeklyLimit: datePlans,

      lastResetAt: now,
      nextResetAt,
    },
  });

  // ==========================================
  // CREATE DATE PLAN TRANSACTION
  // ==========================================

  if (datePlans > 0) {
    await tx.datePlanTransaction.create({
      data: {
        userId,
        type: "PACKAGE_CREDIT",
        quantity: datePlans,
        balanceAfter: datePlanStats.balance,
        referenceId: packageId,
        description: "Free date plans credited from membership package",
      },
    });
  }

  // ==========================================
  // 6. CREDIT WELCOME COINS
  // ==========================================

  const welcomeCoins = await creditPackageWelcomeCoins(tx, userId, packageId);
  // ==========================================
  // 7. RETURN CREDITED BENEFITS
  // ==========================================

  return {
    roses: {
      free: roses,
      total: roseBalance.totalRoses,
    },

    compliments: {
      free: compliments,
      total: complimentBalance.totalCompliments,
    },

    boosts: {
      free: boosts,
    },

    datePlans: {
      free: datePlans,
      total: datePlanStats.balance,
    },
    welcomeCoins,
    nextResetAt,
  };
};

export const creditPackageWelcomeCoins = async (
  tx: Prisma.TransactionClient,
  userId: string,
  packageId: string,
) => {
  // ==========================================
  // 1. FETCH WELCOME COINS CONFIGURATION
  // ==========================================

  const welcomeCoinLimit = await tx.planLimit.findFirst({
    where: {
      packageId,

      enabled: true,
      unlimited: false,
      resetPeriod: "NONE",

      feature: {
        active: true,
        code: PACKAGE_BENEFIT_CODES.WELCOME_COINS,
      },
    },

    select: {
      limit: true,
    },
  });

  const welcomeCoins = welcomeCoinLimit?.limit ?? 0;

  if (welcomeCoins <= 0) {
    return {
      credited: false,
      amount: 0,
      reason: "NO_WELCOME_COINS_CONFIGURED",
    };
  }

  // ==========================================
  // 2. GET OR CREATE USER WALLET
  // ==========================================

  const wallet = await tx.wallet.upsert({
    where: {
      userId,
    },

    create: {
      userId,
      balance: 0,
    },

    update: {},
  });

  // ==========================================
  // 3. PREVENT DUPLICATE WELCOME COINS
  // ==========================================

  const existingReward = await tx.walletTransaction.findFirst({
    where: {
      walletId: wallet.id,

      type: "PACKAGE_BONUS",
      status: "SUCCESS",
      source: "PACKAGE_ACTIVATION",

      referenceId: packageId,
    },

    select: {
      id: true,
    },
  });

  if (existingReward) {
    return {
      credited: false,
      amount: 0,
      reason: "WELCOME_COINS_ALREADY_CREDITED",
    };
  }

  // ==========================================
  // 4. CREDIT WALLET BALANCE
  // ==========================================

  const amount = new Prisma.Decimal(welcomeCoins);

  const updatedWallet = await tx.wallet.update({
    where: {
      id: wallet.id,
    },

    data: {
      balance: {
        increment: amount,
      },
    },
  });

  // ==========================================
  // 5. CREATE WALLET TRANSACTION
  // ==========================================

  const walletTransaction = await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,

      amount,

      type: "PACKAGE_BONUS",
      status: "SUCCESS",
      source: "PACKAGE_ACTIVATION",

      referenceId: packageId,

      description: "Package welcome coins credited",

      balanceBefore: updatedWallet.balance.minus(amount),
      balanceAfter: updatedWallet.balance,
    },
  });

  // ==========================================
  // 6. RETURN RESPONSE
  // ==========================================

  return {
    credited: true,
    amount: welcomeCoins,
    walletTransactionId: walletTransaction.id,
    balanceBefore: walletTransaction.balanceBefore,
    balanceAfter: updatedWallet.balance,
  };
};
