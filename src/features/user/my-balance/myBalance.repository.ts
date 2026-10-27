import { prisma } from "../../../prisma/prismaClient";

export const getMyBalancesRepository = async (
  userId: string,
) => {
  const [
    roseBalance,
    complimentBalance,
    boostBalance,
    wallet,
    datePlanStats,
  ] = await Promise.all([
    // =========================
    // ROSES
    // =========================
    prisma.userRoseBalance.findUnique({
      where: {
        userId,
      },
      select: {
        totalRoses: true,
      },
    }),

    // =========================
    // COMPLIMENTS
    // =========================
    prisma.userComplimentBalance.findUnique({
      where: {
        userId,
      },
      select: {
        totalCompliments: true,
      },
    }),

    // =========================
    // BOOSTS
    // =========================
    prisma.userBoost.aggregate({
  where: {
    user_id: userId,
    is_active: true,
    OR: [
      { expires_at: null },
      { expires_at: { gt: new Date() } },
    ],
  },
  _sum: {
    remaining_boosts: true,
  },
}),

    // =========================
    // WALLET
    // =========================
    prisma.wallet.findUnique({
      where: {
        userId,
      },
      select: {
        balance: true,
      },
    }),

    // =========================
    // DATE PLAN
    // =========================
    prisma.datePlanUserStats.findUnique({
      where: {
        userId,
      },
      select: {
        balance: true,
      },
    }),
  ]);

  return {
    roseBalance,
    complimentBalance,
    boostBalance,
    wallet,
    datePlanStats,
  };
};