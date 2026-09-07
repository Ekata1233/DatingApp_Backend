import { getMyBalancesRepository } from "./myBalance.repository";

export const getMyBalancesService = async (
  userId: string,
) => {
  const {
    roseBalance,
    complimentBalance,
    boostBalance,
    wallet,
    datePlanStats,
  } = await getMyBalancesRepository(userId);

  // =========================================
  // ROSES
  // =========================================

  const roses =
    roseBalance?.totalRoses ?? 0;

  // =========================================
  // COMPLIMENTS
  // =========================================

  const compliments =
    complimentBalance?.totalCompliments ?? 0;

  // =========================================
  // BOOSTS
  // =========================================
  // Because UserBoost can contain multiple rows,
  // calculate all available boosts.

  const boosts = boostBalance.reduce(
    (total, boost) =>
      total + (boost.remaining_boosts ?? 0),
    0,
  );

  // =========================================
  // WALLET
  // =========================================

  const walletBalance = Number(
    wallet?.balance ?? 0,
  );

  // =========================================
  // DATE PLANS
  // =========================================

  const datePlans =
    datePlanStats?.balance ?? 0;

  return {
    roses: {
      balance: roses,
      hasBalance: roses > 0,
    },

    compliments: {
      balance: compliments,
      hasBalance: compliments > 0,
    },

    boosts: {
      balance: boosts,
      hasBalance: boosts > 0,
    },

    wallet: {
      balance: walletBalance,
      currency: "INR",

      formattedBalance: `₹${walletBalance.toLocaleString(
        "en-IN",
      )}`,
    },

    datePlans: {
      balance: datePlans,
      hasBalance: datePlans > 0,
    },
  };
};