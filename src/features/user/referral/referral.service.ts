import {
  PaymentStatus,
  Prisma,
  ReferralStatus,
  TransactionSource,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";
import {
  ReferralDashboardResponse,
  ValidateReferralResponse,
} from "./referral.types";
import { applyReferralReward } from "./referral.helper";

export const validateReferralCode = async (
  referralCode: string,
): Promise<ValidateReferralResponse> => {
  referralCode = referralCode.trim().toUpperCase();

  if (!referralCode) {
    return {
      success: false,
      message: "Referral code is required.",
    };
  }

  const referrer = await prisma.user.findFirst({
    where: {
      referralCode,
      deleted_at: null,
    },
    select: {
      id: true,
      full_name: true,
    },
  });

  if (!referrer) {
    return {
      success: false,
      message: "Invalid referral code.",
    };
  }

  return {
    success: true,
    message: "Referral code is valid.",
    referrerName: referrer.full_name ?? "Welvors User",
  };
};

export const applyReferral = async (
  userId: string,
  referralCode: string
) => {
  try {
    return await prisma.$transaction(
      async (tx) => {

        // ==========================================
        // NEW: CHECK 7-DAY REFERRAL ELIGIBILITY
        // ==========================================

        const user = await tx.user.findUnique({
          where: {
            id: userId,
          },
          select: {
            id: true,
            created_at: true,
          },
        });

        if (!user) {
          throw new Error("User not found.");
        }

        // User registration date
        const registrationDate = new Date(
          user.created_at
        );

        // Referral expiry: 7 days after registration
        const referralExpiryDate = new Date(
          registrationDate.getTime() +
            7 * 24 * 60 * 60 * 1000
        );

        const currentDate = new Date();

        // Check whether 7 days have passed
        if (currentDate > referralExpiryDate) {
          throw new Error(
            "Your referral code eligibility has expired. Referral codes can only be applied within 7 days of joining Welvors."
          );
        }

        // ==========================================
        // EXISTING LOGIC - NO CHANGES
        // ==========================================

        return applyReferralReward(
          tx,
          userId,
          referralCode
        );
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel
            .Serializable,
        maxWait: 10000,
        timeout: 20000,
      }
    );
  } catch (error: any) {
    if (error?.code === "P2002") {
      throw new Error(
        "Referral code has already been applied."
      );
    }

    throw error;
  }
};

// export const applyReferral = async (userId: string, referralCode: string) => {
//   return await prisma.$transaction(async (tx) => {
//     // -----------------------------------------
//     // 1. Normalize referral code
//     // -----------------------------------------

//     referralCode = referralCode.trim().toUpperCase();

//     // -----------------------------------------
//     // 2. Find current user
//     // -----------------------------------------

//     const currentUser = await tx.user.findUnique({
//       where: {
//         id: userId,
//       },
//     });

//     if (!currentUser) {
//       throw new Error("User not found.");
//     }

//     // -----------------------------------------
//     // 3. Check referral already applied
//     // -----------------------------------------

//     const alreadyApplied = await tx.userReferral.findUnique({
//       where: {
//         referredUserId: userId,
//       },
//     });

//     if (alreadyApplied) {
//       throw new Error("Referral already applied.");
//     }

//     // -----------------------------------------
//     // 4. Find referrer
//     // -----------------------------------------

//     const referrer = await tx.user.findUnique({
//       where: {
//         referralCode,
//       },
//     });

//     if (!referrer) {
//       throw new Error("Invalid referral code.");
//     }

//     if (referrer.deleted_at) {
//       throw new Error("Referral code is inactive.");
//     }

//     // -----------------------------------------
//     // 5. Prevent self referral
//     // -----------------------------------------

//     if (referrer.id === currentUser.id) {
//       throw new Error("You cannot use your own referral code.");
//     }

//     // -----------------------------------------
//     // 6. Prevent reverse referral
//     // -----------------------------------------

//     const reverseReferral = await tx.userReferral.findFirst({
//       where: {
//         referrerId: userId,
//         referredUserId: referrer.id,
//       },
//     });

//     if (reverseReferral) {
//       throw new Error(
//         "You cannot use the referral code of someone who was referred by you.",
//       );
//     }

//     // -----------------------------------------
//     // 7. Create referral record
//     // EXISTING CODE
//     // -----------------------------------------

//     const referral = await tx.userReferral.create({
//       data: {
//         referrerId: referrer.id,
//         referredUserId: userId,
//         status: "PENDING",
//       },
//     });

//     // =========================================
//     // NEW CODE STARTS HERE
//     // =========================================

//     // -----------------------------------------
//     // 8. Get reward configuration
//     // -----------------------------------------

//     const rewardConfig = await tx.rewardConfig.findFirst();

//     if (!rewardConfig) {
//       throw new Error("Reward configuration not found.");
//     }

//     const signupReward = new Prisma.Decimal(rewardConfig.signupReward);

//     const waitlistReward = new Prisma.Decimal(rewardConfig.waitlistReward);

//     if (signupReward.lessThan(0) || waitlistReward.lessThan(0)) {
//       throw new Error("Invalid reward configuration.");
//     }

//     // -----------------------------------------
//     // 9. Get both wallets
//     // -----------------------------------------

//     const [referrerWallet, referredWallet] = await Promise.all([
//       tx.wallet.findUnique({
//         where: {
//           userId: referrer.id,
//         },
//       }),

//       tx.wallet.findUnique({
//         where: {
//           userId: userId,
//         },
//       }),
//     ]);

//     if (!referrerWallet) {
//       throw new Error("Referrer wallet not found.");
//     }

//     if (!referredWallet) {
//       throw new Error("Referred user wallet not found.");
//     }

//     // -----------------------------------------
//     // 10. Calculate wallet balances
//     // -----------------------------------------

//     const referrerBalanceBefore = new Prisma.Decimal(referrerWallet.balance);

//     const referrerBalanceAfter = referrerBalanceBefore.plus(signupReward);

//     const referredBalanceBefore = new Prisma.Decimal(referredWallet.balance);

//     const referredBalanceAfter = referredBalanceBefore.plus(waitlistReward);

//     // -----------------------------------------
//     // 11. Update both wallets
//     // -----------------------------------------

//     await tx.wallet.update({
//       where: {
//         id: referrerWallet.id,
//       },
//       data: {
//         balance: {
//           increment: signupReward,
//         },
//       },
//     });

//     await tx.wallet.update({
//       where: {
//         id: referredWallet.id,
//       },
//       data: {
//         balance: {
//           increment: waitlistReward,
//         },
//       },
//     });

//     // -----------------------------------------
//     // 12. Create referrer wallet transaction
//     // -----------------------------------------

//     await tx.walletTransaction.create({
//       data: {
//         walletId: referrerWallet.id,

//         amount: signupReward,

//         balanceBefore: referrerBalanceBefore,

//         balanceAfter: referrerBalanceAfter,

//         type: TransactionType.REWARD,

//         status: TransactionStatus.SUCCESS,

//         source: TransactionSource.REFERRAL_SIGNUP,

//         referenceId: referral.id,

//         description: "Referral signup reward",
//       },
//     });

//     // -----------------------------------------
//     // 13. Create referred user wallet transaction
//     // -----------------------------------------

//     await tx.walletTransaction.create({
//       data: {
//         walletId: referredWallet.id,

//         amount: waitlistReward,

//         balanceBefore: referredBalanceBefore,

//         balanceAfter: referredBalanceAfter,

//         type: TransactionType.REWARD,

//         status: TransactionStatus.SUCCESS,

//         source: TransactionSource.REFERRAL_SIGNUP,

//         referenceId: referral.id,

//         description: "Reward for applying referral code",
//       },
//     });

//     // -----------------------------------------
//     // 14. Update referral status
//     // -----------------------------------------

//     await tx.userReferral.update({
//       where: {
//         id: referral.id,
//       },
//       data: {
//         signupReward: signupReward,

//         rewardedAt: new Date(),

//         status: ReferralStatus.SIGNUP_REWARDED,
//       },
//     });

//     // -----------------------------------------
//     // 14. Get referral statistics
//     // -----------------------------------------

//     const referralStats = await tx.userReferralStats.findUnique({
//       where: {
//         userId: referrer.id,
//       },
//     });

//     // -----------------------------------------
//     // 15. Update referrer statistics
//     // -----------------------------------------

//     await tx.userReferralStats.upsert({
//       where: {
//         userId: referrer.id,
//       },

//       update: {
//         joinedUsers: {
//           increment: 1,
//         },

//         rewardedUsers: {
//           increment: 1,
//         },

//         totalCoinsEarned: {
//           increment: Number(signupReward),
//         },
//       },

//       create: {
//         userId: referrer.id,

//         totalInvites: 1,

//         joinedUsers: 1,

//         rewardedUsers: 1,

//         totalCoinsEarned: Number(signupReward),

//         pendingRewards: 0,
//       },
//     });

//     // =========================================
//     // NEW CODE ENDS HERE
//     // =========================================

//     return {
//       success: true,

//       message: "Referral applied successfully. Both users received rewards.",

//       data: {
//         referralId: referral.id,

//         referrer: {
//           userId: referrer.id,
//           reward: signupReward.toNumber(),
//           walletBalance: referrerBalanceAfter.toNumber(),
//         },

//         referredUser: {
//           userId: userId,
//           reward: waitlistReward.toNumber(),
//           walletBalance: referredBalanceAfter.toNumber(),
//         },
//       },
//     };
//   });
// };


export const getReferralDashboard = async (
  userId: string,
  page = 1,
  limit = 20,
): Promise<ReferralDashboardResponse> => {
  const skip = (page - 1) * limit;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      referralCode: true,
      referralStats: true,

      // NEW: Find whose referral code this user applied
      receivedReferral: {
        select: {
          referrer: {
            select: {
              id: true,
              full_name: true,
              birth_date: true,
              photos: {
                orderBy: {
                  order: "asc",
                },
                take: 1,
                select: {
                  media_url: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // ==========================================
  // NEW: REFERRER DETAILS
  // ==========================================

  const referrer = user.receivedReferral?.referrer;

  let referredBy = null;

  if (referrer) {
    let age: number | null = null;

    if (referrer.birth_date) {
      const today = new Date();
      const dob = new Date(referrer.birth_date);

      age = today.getUTCFullYear() - dob.getUTCFullYear();

      const monthDiff =
        today.getUTCMonth() - dob.getUTCMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 &&
          today.getUTCDate() < dob.getUTCDate())
      ) {
        age--;
      }
    }

    referredBy = {
      userId: referrer.id,
      full_name: referrer.full_name ?? "Unknown User",
      age,
      photo: referrer.photos[0]?.media_url ?? null,
    };
  }

  // ==========================================
  // EXISTING REFERRAL HISTORY
  // ==========================================

  const [history, total] = await prisma.$transaction([
    prisma.userReferral.findMany({
      where: {
        referrerId: userId,
      },
      include: {
        referredUser: {
          select: {
            id: true,
            full_name: true,
            photos: {
              where: {
                is_primary: true,
              },
              take: 1,
              select: {
                media_url: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),

    prisma.userReferral.count({
      where: {
        referrerId: userId,
      },
    }),
  ]);

  return {
    referralCode: user.referralCode || "",

    shareLink:
      "https://play.google.com/store/apps/details?id=com.infynod.welvors",

    selfSignupReward: 50,

    // NEW FIELD
    referredBy,

    stats: {
      totalEarned:
        user.referralStats?.totalCoinsEarned ?? 0,
      joined: user.referralStats?.joinedUsers ?? 0,
      rewarded: user.referralStats?.rewardedUsers ?? 0,
      pending: user.referralStats?.pendingRewards ?? 0,
    },

    history: history.map((item) => {
      const signupReward = item.signupReward.toNumber();
      const purchaseReward = item.purchaseReward.toNumber();

      return {
        id: item.id,
        userId: item.referredUser.id,
        name:
          item.referredUser.full_name || "Unknown User",
        profileImage:
          item.referredUser.photos[0]?.media_url ?? null,
        status: item.status,
        signupReward,
        purchaseReward,
        totalReward: signupReward + purchaseReward,
        joinedAt: item.createdAt,
        rewardedAt: item.rewardedAt,
      };
    }),

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
};



export const getReferralHistory = async (
  userId: string,
  status?: "joined" | "rewarded" | "pending",
  page = 1,
  limit = 20,
) => {
  if (!Number.isInteger(page) || page < 1) {
    throw new Error("Invalid page");
  }

  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    throw new Error("Invalid limit");
  }

  if (
    status &&
    !["joined", "rewarded", "pending"].includes(status)
  ) {
    throw new Error("Invalid referral history filter");
  }

  const skip = (page - 1) * limit;

  const where = {
    referrerId: userId,
  };

  // ==========================================
  // FETCH REFERRALS
  // ==========================================

  const referrals = await prisma.userReferral.findMany({
    where,
    include: {
      referredUser: {
        select: {
          id: true,
          full_name: true,
          photos: {
            where: {
              is_primary: true,
            },
            take: 1,
            select: {
              media_url: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const history: any[] = [];

  for (const item of referrals) {
    const signupReward = Number(item.signupReward);
    const purchaseReward = Number(item.purchaseReward);

    const base = {
      userId: item.referredUser.id,
      name: item.referredUser.full_name ?? "Unknown User",
      profileImage:
        item.referredUser.photos[0]?.media_url ?? null,
      joinedAt: item.createdAt,
    };

    // ==========================================
    // SIGNUP REWARD - SEPARATE ENTRY
    // ==========================================

    if (signupReward > 0 && item.rewardedAt) {
      history.push({
        id: `${item.id}-signup`,
        ...base,
        status: "SIGNUP_REWARDED",
        signupReward: item.signupReward,
        purchaseReward: "0",
        totalReward: signupReward,
        rewardedAt: item.rewardedAt,
      });
    }

    // ==========================================
    // PURCHASE REWARD - SEPARATE ENTRY
    // ==========================================

    if (item.purchaseAt !== null) {
      history.push({
        id: `${item.id}-purchase`,
        ...base,
        status: "PACKAGE_REWARDED",
        signupReward: "0",
        purchaseReward: item.purchaseReward,
        totalReward: purchaseReward,
        rewardedAt: item.purchaseAt,
      });
    } else {
      // Pending package purchase
      history.push({
        id: `${item.id}-purchase-pending`,
        ...base,
        status: "PENDING",
        signupReward: "0",
        purchaseReward: "0",
        totalReward: 0,
        rewardedAt: null,
      });
    }
  }

  // ==========================================
  // FILTER
  // ==========================================

 // ==========================================
// FILTER
// ==========================================

// ==========================================
// FILTER
// ==========================================

let filteredHistory = history;

if (status === "joined") {
  // Only signup reward history
  filteredHistory = history.filter(
    (item) => item.status === "SIGNUP_REWARDED"
  );
}

if (status === "rewarded") {
  // Only package purchase reward history
  filteredHistory = history.filter(
    (item) => item.status === "PACKAGE_REWARDED"
  );
}

if (status === "pending") {
  // Only pending package purchase rewards
  filteredHistory = history.filter(
    (item) => item.status === "PENDING"
  );
}

  // joined includes both reward types
  // and pending purchase entries.

  // No filter also includes all entries.

  // ==========================================
  // SORT
  // ==========================================

  filteredHistory.sort((a, b) => {
    const dateA = new Date(
      a.rewardedAt ?? a.joinedAt
    ).getTime();

    const dateB = new Date(
      b.rewardedAt ?? b.joinedAt
    ).getTime();

    return dateB - dateA;
  });

  // ==========================================
  // PAGINATION
  // ==========================================

  const total = filteredHistory.length;

  return {
    history: filteredHistory.slice(
      skip,
      skip + limit
    ),

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
};


const WAITLIST_PAYMENT_REWARD = 150;

export class ReferralService {
  static async onRegistrationCompleted(userId: string) {
    return prisma.$transaction(async (tx) => {
      const rewardConfig = await tx.rewardConfig.findFirst();

      if (!rewardConfig) {
        throw new Error("Reward configuration not found.");
      }

      const signupReward = Number(rewardConfig.signupReward);
      // Find referral record
      const referral = await tx.userReferral.findUnique({
        where: {
          referredUserId: userId,
        },
      });

      console.log("referral call ......", referral);

      // User was not referred
      if (!referral) {
        console.log("not refer?");
        return;
      }

      // Reward already given
      if (
        referral.status === ReferralStatus.SIGNUP_REWARDED ||
        referral.status === ReferralStatus.PACKAGE_REWARDED
      ) {
        console.log("already given");
        return;
      }

      // Referrer's wallet
      const wallet = await tx.wallet.findUnique({
        where: {
          userId: referral.referrerId,
        },
      });

      console.log("wallet call ......", wallet);

      if (!wallet) {
        throw new Error("Referrer wallet not found.");
      }

      const balanceBefore = Number(wallet.balance);
      const balanceAfter = balanceBefore + signupReward;

      console.log("balanceAfter call ......", balanceAfter);

      // Update wallet
      await tx.wallet.update({
        where: {
          id: wallet.id,
        },
        data: {
          balance: new Prisma.Decimal(balanceAfter),
        },
      });

      // Wallet transaction
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: new Prisma.Decimal(signupReward),
          balanceBefore: new Prisma.Decimal(balanceBefore),
          balanceAfter: new Prisma.Decimal(balanceAfter),
          type: TransactionType.REWARD,
          status: TransactionStatus.SUCCESS,
          source: TransactionSource.REFERRAL_SIGNUP,
          referenceId: referral.id,
          description: "Referral signup reward",
        },
      });

      // Update referral
      await tx.userReferral.update({
        where: {
          id: referral.id,
        },
        data: {
          signupReward: new Prisma.Decimal(signupReward),
          rewardedAt: new Date(),
          status: ReferralStatus.SIGNUP_REWARDED,
        },
      });

      const referralStats = await tx.userReferralStats.findUnique({
        where: {
          userId: referral.referrerId,
        },
      });
      // Update referral stats
      await tx.userReferralStats.upsert({
        where: {
          userId: referral.referrerId,
        },
        update: {
          joinedUsers: {
            increment: 1,
          },
          totalCoinsEarned: {
            increment: signupReward,
          },
          pendingRewards:
            referralStats && referralStats.pendingRewards > 0
              ? {
                  decrement: 1,
                }
              : undefined,
        },
        create: {
          userId: referral.referrerId,
          totalInvites: 1,
          joinedUsers: 1,
          rewardedUsers: 1,
          totalCoinsEarned: signupReward,
          pendingRewards: 0,
        },
      });

      return {
        success: true,
      };
    });
  }

  static async onSubscriptionPurchased(userId: string) {
    return prisma.$transaction(async (tx) => {
      const rewardConfig = await tx.rewardConfig.findFirst();

      if (!rewardConfig) {
        throw new Error("Reward configuration not found.");
      }

      const packageReward = rewardConfig.packageReward.toNumber();
      // Find referral
      const referral = await tx.userReferral.findUnique({
        where: {
          referredUserId: userId,
        },
      });

      // User wasn't referred
      if (!referral) {
        return;
      }

      // Signup reward must already be completed
      if (referral.status === ReferralStatus.PENDING) {
        return;
      }

      // Purchase reward already given
      if (referral.status === ReferralStatus.PACKAGE_REWARDED) {
        return;
      }

      // Referrer's wallet
      const wallet = await tx.wallet.findUnique({
        where: {
          userId: referral.referrerId,
        },
      });

      if (!wallet) {
        throw new Error("Referrer's wallet not found.");
      }

      const balanceBefore = Number(wallet.balance);
      const balanceAfter = balanceBefore + packageReward;

      // Update wallet balance
      await tx.wallet.update({
        where: {
          id: wallet.id,
        },
        data: {
          balance: new Prisma.Decimal(balanceAfter),
        },
      });

      // Create wallet transaction
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: new Prisma.Decimal(packageReward),
          type: TransactionType.REWARD,
          status: TransactionStatus.SUCCESS,
          source: TransactionSource.REFERRAL_PURCHASE,
          referenceId: referral.id,
          description: "Referral subscription purchase reward",
          balanceBefore: new Prisma.Decimal(balanceBefore),
          balanceAfter: new Prisma.Decimal(balanceAfter),
        },
      });

      // Update referral
      await tx.userReferral.update({
        where: {
          id: referral.id,
        },
        data: {
          purchaseReward: packageReward,
          purchaseAt: new Date(),
          status: ReferralStatus.PACKAGE_REWARDED,
        },
      });

      // Update referral stats
      await tx.userReferralStats.upsert({
        where: {
          userId: referral.referrerId,
        },
        update: {
          rewardedUsers: {
            increment: 1,
          },
          totalCoinsEarned: {
            increment: packageReward,
          },
        },
        create: {
          userId: referral.referrerId,
          totalInvites: 1,
          joinedUsers: 1,
          rewardedUsers: 1,
          totalCoinsEarned: packageReward,
          pendingRewards: 0,
        },
      });

      return {
        success: true,
        message: "Referral purchase reward credited successfully.",
      };
    });
  }

  // static async onWaitlistRegistration(userId: string) {
  //   return prisma.$transaction(async (tx) => {

  //     // Check referral
  //     const referral = await tx.userReferral.findUnique({
  //       where: {
  //         referredUserId: userId,
  //       },
  //     });

  //     if (!referral) {
  //       return;
  //     }

  //     // Already rewarded
  //     if (
  //       referral.status === ReferralStatus.PURCHASED ||
  //       referral.status === ReferralStatus.REWARDED
  //     ) {
  //       return;
  //     }

  //     // Check user is actually on waitlist
  //     const waitlist = await tx.waitlist.findUnique({
  //       where: {
  //         userId,
  //       },
  //     });

  //     if (!waitlist) {
  //       throw new Error("Waitlist record not found.");
  //     }

  //     // Referrer's wallet
  //     const wallet = await tx.wallet.findUnique({
  //       where: {
  //         userId: referral.referrerId,
  //       },
  //     });

  //     if (!wallet) {
  //       throw new Error("Referrer's wallet not found.");
  //     }

  //     const balanceBefore = Number(wallet.balance);
  //     const balanceAfter = balanceBefore + WAITLIST_SIGNUP_REWARD;

  //     // Update wallet
  //     await tx.wallet.update({
  //       where: {
  //         id: wallet.id,
  //       },
  //       data: {
  //         balance: new Prisma.Decimal(balanceAfter),
  //       },
  //     });

  //     // Wallet transaction
  //     await tx.walletTransaction.create({
  //       data: {
  //         walletId: wallet.id,
  //         amount: new Prisma.Decimal(WAITLIST_SIGNUP_REWARD),
  //         type: TransactionType.REWARD,
  //         status: TransactionStatus.SUCCESS,
  //         source: TransactionSource.WAITLIST_REFERRAL_SIGNUP,
  //         referenceId: referral.id,
  //         description: "Waitlist referral signup reward",
  //         balanceBefore: new Prisma.Decimal(balanceBefore),
  //         balanceAfter: new Prisma.Decimal(balanceAfter),
  //       },
  //     });

  //     // Update referral
  //     await tx.userReferral.update({
  //       where: {
  //         id: referral.id,
  //       },
  //       data: {
  //         signupReward: WAITLIST_SIGNUP_REWARD,
  //         rewardedAt: new Date(),
  //         status: ReferralStatus.SIGNED_UP,
  //       },
  //     });

  //     // Update stats
  //     await tx.userReferralStats.upsert({
  //       where: {
  //         userId: referral.referrerId,
  //       },
  //       update: {
  //         joinedUsers: {
  //           increment: 1,
  //         },
  //         totalCoinsEarned: {
  //           increment: WAITLIST_SIGNUP_REWARD,
  //         },
  //       },

  //       create: {
  //         userId: referral.referrerId,
  //         totalInvites: 1,
  //         joinedUsers: 1,
  //         purchasedUsers: 0,
  //         totalCoinsEarned: WAITLIST_SIGNUP_REWARD,
  //         pendingRewards: 0,
  //       },
  //     });

  //     return {
  //       success: true,
  //       message: "Waitlist referral signup reward credited successfully.",
  //     };
  //   });
  // }

  static async onWaitlistPayment(userId: string) {
    return prisma.$transaction(async (tx) => {
      // Find referral
      const referral = await tx.userReferral.findUnique({
        where: {
          referredUserId: userId,
        },
      });

      // User wasn't referred
      if (!referral) {
        return;
      }

      // Signup reward must already be completed
      if (referral.status === ReferralStatus.PENDING) {
        return;
      }

      // Payment reward already given
      if (referral.status === ReferralStatus.WAITLIST_REWARDED) {
        return;
      }

      // Verify waitlist payment
      const waitlist = await tx.waitlist.findUnique({
        where: {
          userId,
        },
      });

      if (!waitlist) {
        throw new Error("Waitlist record not found.");
      }

      if (waitlist.paymentStatus !== PaymentStatus.COMPLETED) {
        throw new Error("Waitlist payment is not completed.");
      }

      // Referrer's wallet
      const wallet = await tx.wallet.findUnique({
        where: {
          userId: referral.referrerId,
        },
      });

      if (!wallet) {
        throw new Error("Referrer's wallet not found.");
      }

      const balanceBefore = Number(wallet.balance);
      const balanceAfter = balanceBefore + WAITLIST_PAYMENT_REWARD;

      // Update wallet
      await tx.wallet.update({
        where: {
          id: wallet.id,
        },
        data: {
          balance: new Prisma.Decimal(balanceAfter),
        },
      });

      // Wallet transaction
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: new Prisma.Decimal(WAITLIST_PAYMENT_REWARD),
          type: TransactionType.REWARD,
          status: TransactionStatus.SUCCESS,
          source: TransactionSource.WAITLIST_REFERRAL_PAYMENT,
          referenceId: referral.id,
          description: "Waitlist referral payment reward",
          balanceBefore: new Prisma.Decimal(balanceBefore),
          balanceAfter: new Prisma.Decimal(balanceAfter),
        },
      });

      // Update referral
      await tx.userReferral.update({
        where: {
          id: referral.id,
        },
        data: {
          purchaseReward: WAITLIST_PAYMENT_REWARD,
          purchaseAt: new Date(),
          status: ReferralStatus.WAITLIST_REWARDED,
        },
      });

      // Update referral stats
      await tx.userReferralStats.upsert({
        where: {
          userId: referral.referrerId,
        },
        update: {
          rewardedUsers: {
            increment: 1,
          },
          totalCoinsEarned: {
            increment: WAITLIST_PAYMENT_REWARD,
          },
        },

        create: {
          userId: referral.referrerId,
          totalInvites: 1,
          joinedUsers: 1,
          rewardedUsers: 1,
          totalCoinsEarned: WAITLIST_PAYMENT_REWARD,
          pendingRewards: 0,
        },
      });

      return {
        success: true,
        message: "Waitlist payment referral reward credited successfully.",
      };
    });
  }
}
