
import { PaymentStatus, Prisma, ReferralStatus, TransactionSource, TransactionStatus, TransactionType } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";
import { ReferralDashboardResponse, ValidateReferralResponse } from "./referral.types";

export const validateReferralCode = async (
  referralCode: string
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
  return await prisma.$transaction(async (tx) => {

    referralCode = referralCode.trim().toUpperCase();

    const currentUser = await tx.user.findUnique({
      where: {
        id: userId
      }
    });

    if (!currentUser) {
      throw new Error("User not found.");
    }

    const alreadyApplied = await tx.userReferral.findUnique({
      where: {
        referredUserId: userId
      }
    });

    if (alreadyApplied) {
      throw new Error("Referral already applied.");
    }

    const referrer = await tx.user.findUnique({
      where: {
        referralCode
      }
    });

    if (!referrer) {
      throw new Error("Invalid referral code.");
    }

    if (referrer.deleted_at) {
      throw new Error("Referral code is inactive.");
    }

    if (referrer.id === currentUser.id) {
      throw new Error(
        "You cannot use your own referral code."
      );
    }

    const reverseReferral = await tx.userReferral.findFirst({
      where: {
        referrerId: userId,
        referredUserId: referrer.id
      }
    });

    if (reverseReferral) {
      throw new Error(
        "You cannot use the referral code of someone who was referred by you."
      );
    }

    await tx.userReferral.create({
      data: {
        referrerId: referrer.id,
        referredUserId: userId,
        status: "PENDING"
      }
    });

    return {
      success: true,
      message: "Referral applied successfully."
    };

  });
}

export const getReferralDashboard = async (
  userId: string,
  page = 1,
  limit = 20
): Promise<ReferralDashboardResponse> => {
  const skip = (page - 1) * limit;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      referralCode: true,
      referralStats: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

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

    shareLink: `https://play.google.com/store/apps/details?id=com.fetchtrue.bizbooster2x&pcampaignid=web_share`,

    stats: {
      totalEarned: user.referralStats?.totalCoinsEarned ?? 0,
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
        name: item.referredUser.full_name || "Unknown User",
        profileImage: item.referredUser.photos[0]?.media_url ?? null,
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
  limit = 20
) => {
  const skip = (page - 1) * limit;

  const where: any = {
    referrerId: userId,
  };

  if (status) {
    switch (status) {
      case "joined":
        where.status = {
          in: [
            ReferralStatus.PENDING,
            ReferralStatus.SIGNUP_REWARDED,
            ReferralStatus.PACKAGE_REWARDED,
          ],
        };
        break;

      case "rewarded":
        where.status = {
          in: [
            ReferralStatus.SIGNUP_REWARDED,
            ReferralStatus.PACKAGE_REWARDED,
          ],
        };
        break;

      case "pending":
        where.status = ReferralStatus.PENDING;
        break;
    }
  }

  const [history, total] = await prisma.$transaction([
    prisma.userReferral.findMany({
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
      skip,
      take: limit,
    }),

    prisma.userReferral.count({
      where,
    }),
  ]);

  return {
    history: history.map((item) => ({
      id: item.id,
      userId: item.referredUser.id,
      name: item.referredUser.full_name ?? "Unknown User",
      profileImage:
        item.referredUser.photos[0]?.media_url ?? null,
      status: item.status,
      signupReward: item.signupReward,
      purchaseReward: item.purchaseReward,
      totalReward:
        Number(item.signupReward) +
        Number(item.purchaseReward),
      joinedAt: item.createdAt,
      rewardedAt: item.rewardedAt,
    })),

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

      console.log("referral call ......", referral)

      // User was not referred
      if (!referral) {
        console.log("not refer?")
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

      console.log("wallet call ......", wallet)

      if (!wallet) {
        throw new Error("Referrer wallet not found.");
      }

      const balanceBefore = Number(wallet.balance);
      const balanceAfter = balanceBefore + signupReward;

      console.log("balanceAfter call ......", balanceAfter)

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
          pendingRewards: referralStats && referralStats.pendingRewards > 0
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
      if (
        referral.status === ReferralStatus.PACKAGE_REWARDED
      ) {
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
      if (
        referral.status === ReferralStatus.WAITLIST_REWARDED
      ) {
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
