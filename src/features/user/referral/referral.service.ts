
import { PaymentStatus, Prisma, ReferralStatus, TransactionSource, TransactionStatus, TransactionType } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";
import { ValidateReferralResponse } from "./referral.types";

export const validateReferralCode = async (
  userId: string,
  referralCode: string
): Promise<ValidateReferralResponse> => {

  referralCode = referralCode.trim().toUpperCase();

  // Find current user
  const currentUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      referralCode: true,
    },
  });

  if (!currentUser) {
    return {
      success: false,
      message: "User not found",
    };
  }

  // Self referral
  if (currentUser.referralCode === referralCode) {
    return {
      success: false,
      message: "You cannot use your own referral code.",
    };
  }

  // Already used a referral?
  const alreadyUsed = await prisma.userReferral.findUnique({
    where: {
      referredUserId: userId,
    },
  });

  if (alreadyUsed) {
    return {
      success: false,
      message: "Referral code has already been used.",
    };
  }


  // Find referrer
  const referrer = await prisma.user.findFirst({
    where: {
      referralCode,
      deleted_at: null,
    },
    select: {
      id: true,
      full_name: true,
      referralCode: true,
    },
  });

  if (!referrer) {
    return {
      success: false,
      message: "Invalid referral code.",
    };
  }

  const reverseReferral = await prisma.userReferral.findFirst({
    where: {
      referrerId: currentUser.id,
      referredUserId: referrer.id,
    },
  });

  if (reverseReferral) {
    throw new Error(
      "You cannot apply a referral code from a user you have already referred."
    );
  }
  // Extra safety
  if (referrer.id === userId) {
    return {
      success: false,
      message: "You cannot use your own referral code.",
    };
  }

  return {
    success: true,
    message: "Referral code is validate.",
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
        status: "SIGNED_UP"
      }
    });

    return {
      success: true,
      message: "Referral applied successfully."
    };

  });
}

const SIGNUP_REWARD = 100;
const PURCHASE_REWARD = 500;
// const WAITLIST_SIGNUP_REWARD = 50;
const WAITLIST_PAYMENT_REWARD = 150;

export class ReferralService {
  static async onRegistrationCompleted(userId: string) {
    return prisma.$transaction(async (tx) => {

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
        referral.status === ReferralStatus.PURCHASED ||
        referral.status === ReferralStatus.REWARDED
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
      const balanceAfter = balanceBefore + SIGNUP_REWARD;

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
          amount: new Prisma.Decimal(SIGNUP_REWARD),
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
          signupReward: SIGNUP_REWARD,
          rewardedAt: new Date(),
          status: ReferralStatus.SIGNED_UP,
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
            increment: SIGNUP_REWARD,
          },
        },
        create: {
          userId: referral.referrerId,
          totalInvites: 1,
          joinedUsers: 1,
          purchasedUsers: 0,
          totalCoinsEarned: SIGNUP_REWARD,
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
        referral.status === ReferralStatus.PURCHASED ||
        referral.status === ReferralStatus.REWARDED
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
      const balanceAfter = balanceBefore + PURCHASE_REWARD;

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
          amount: new Prisma.Decimal(PURCHASE_REWARD),
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
          purchaseReward: PURCHASE_REWARD,
          purchaseAt: new Date(),
          status: ReferralStatus.REWARDED,
        },
      });

      // Update referral stats
      await tx.userReferralStats.upsert({
        where: {
          userId: referral.referrerId,
        },
        update: {
          purchasedUsers: {
            increment: 1,
          },
          totalCoinsEarned: {
            increment: PURCHASE_REWARD,
          },
        },
        create: {
          userId: referral.referrerId,
          totalInvites: 1,
          joinedUsers: 1,
          purchasedUsers: 1,
          totalCoinsEarned: PURCHASE_REWARD,
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
        referral.status === ReferralStatus.PURCHASED ||
        referral.status === ReferralStatus.REWARDED
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

      if (waitlist.paymentStatus !== PaymentStatus.PAID) {
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
          status: ReferralStatus.REWARDED,
        },
      });

      // Update referral stats
      await tx.userReferralStats.upsert({
        where: {
          userId: referral.referrerId,
        },
        update: {
          purchasedUsers: {
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
          purchasedUsers: 1,
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
