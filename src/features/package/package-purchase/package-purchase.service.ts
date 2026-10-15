import {
  BillingCycle,
  PackageStatus,
  Prisma,
  TransactionSource,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";
import { rewardReferrerOnPackagePurchase } from "../../user/referral/referral.helper";

type Tx = Prisma.TransactionClient;

type SubscriptionAction = "NEW_PURCHASE" | "RENEW" | "UPGRADE" | "DOWNGRADE";

const PACKAGE_PRIORITY: Record<string, number> = {
  premium: 1,
  vip: 2,
  "vip-elite": 3,
};

const getPackagePriority = (slug: string): number => {
  const normalizedSlug = slug.trim().toLowerCase().replace(/_/g, "-");
  console.log("Package slug:", normalizedSlug);
  return PACKAGE_PRIORITY[normalizedSlug] ?? 0;
};

// Prevent month-end overflow, e.g. Jan 31 + 1 month.
const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  const originalDay = result.getUTCDate();

  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);

  const lastDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();

  result.setUTCDate(Math.min(originalDay, lastDay));
  return result;
};

const calculatePackageEndDate = (
  startDate: Date,
  billingCycle: BillingCycle,
  months: number | null,
): Date | null => {
  if (billingCycle === BillingCycle.LIFETIME) {
    return null;
  }

  if (months && months > 0) {
    return addMonths(startDate, months);
  }

  switch (billingCycle) {
    case BillingCycle.MONTHLY:
      return addMonths(startDate, 1);

    case BillingCycle.QUARTERLY:
      return addMonths(startDate, 3);

    case BillingCycle.HALF_YEARLY:
      return addMonths(startDate, 6);

    case BillingCycle.YEARLY:
      return addMonths(startDate, 12);

    default:
      throw new Error("INVALID_BILLING_CYCLE");
  }
};

// export const purchasePackageWithWalletService = async (
//   userId: string,
//   priceId: string,
// ) => {
//   return prisma.$transaction(
//     async (tx) => {
//       // ---------------------------------
//       // 1. Validate user
//       // ---------------------------------

//       const user = await tx.user.findUnique({
//         where: {
//           id: userId,
//         },
//         select: {
//           id: true,
//           account_status: true,
//         },
//       });

//       if (!user) {
//         throw new Error("USER_NOT_FOUND");
//       }

//       if (user.account_status !== "ACTIVE") {
//         throw new Error("ACCOUNT_NOT_ACTIVE");
//       }

//       // ---------------------------------
//       // 2. Get PackagePrice + Package
//       // ---------------------------------

//       const packagePrice = await tx.packagePrice.findFirst({
//         where: {
//           id: priceId,
//           active: true,

//           package: {
//             active: true,
//           },
//         },

//         include: {
//           package: true,
//         },
//       });

//       if (!packagePrice) {
//         throw new Error("PACKAGE_PRICE_NOT_FOUND");
//       }

//       const selectedPackage = packagePrice.package;

//       if (packagePrice.price.lte(0)) {
//         throw new Error("INVALID_PACKAGE_PRICE");
//       }

//       const purchaseAmount = packagePrice.price;

//       // ---------------------------------
//       // 3. Get wallet
//       // ---------------------------------

//       const wallet = await tx.wallet.findUnique({
//         where: {
//           userId,
//         },
//       });

//       if (!wallet) {
//         throw new Error("WALLET_NOT_FOUND");
//       }

//       // ---------------------------------
//       // 4. Check wallet balance
//       // ---------------------------------

//       if (wallet.balance.lt(purchaseAmount)) {
//         throw new Error("INSUFFICIENT_WALLET_BALANCE");
//       }

//       // ---------------------------------
//       // 5. Atomically deduct wallet
//       // ---------------------------------

//       const deduction = await tx.wallet.updateMany({
//         where: {
//           id: wallet.id,

//           balance: {
//             gte: purchaseAmount,
//           },
//         },

//         data: {
//           balance: {
//             decrement: purchaseAmount,
//           },
//         },
//       });

//       if (deduction.count !== 1) {
//         throw new Error("INSUFFICIENT_WALLET_BALANCE");
//       }

//       const updatedWallet = await tx.wallet.findUniqueOrThrow({
//         where: {
//           id: wallet.id,
//         },
//       });

//       // ---------------------------------
//       // 6. Wallet transaction
//       // ---------------------------------

//       const walletTransaction = await tx.walletTransaction.create({
//         data: {
//           walletId: wallet.id,
//           amount: purchaseAmount,
//           type: TransactionType.PURCHASE,
//           status: TransactionStatus.SUCCESS,
//           source: TransactionSource.PREMIUM_PLAN,
//           referenceId: selectedPackage.id,
//           description: `Purchased ${selectedPackage.name} package - ${packagePrice.billingCycle}`,
//           balanceBefore: wallet.balance,
//           balanceAfter: updatedWallet.balance,
//         },
//       });

//       // ---------------------------------
//       // 7. Calculate package dates
//       // ---------------------------------

//       const startDate = new Date();

//       const endDate = calculatePackageEndDate(
//         startDate,
//         packagePrice.billingCycle,
//         packagePrice.months,
//       );

//       // ---------------------------------
//       // 8. Handle existing active package
//       // ---------------------------------

//       await tx.userPackage.updateMany({
//         where: {
//           user_id: userId,
//           status: PackageStatus.ACTIVE,
//         },

//         data: {
//           status: PackageStatus.EXPIRED,
//           autoRenew: false,
//         },
//       });

//       // ---------------------------------
//       // 9. Create UserPackage
//       // ---------------------------------

//       const userPackage = await tx.userPackage.create({
//         data: {
//           user_id: userId,
//           packageId: selectedPackage.id,
//           priceId: packagePrice.id,
//           purchasePrice: packagePrice.price,
//           purchaseOriginalPrice: packagePrice.originalPrice,
//           purchaseDiscount: packagePrice.discountPercent,
//           startDate,
//           endDate,
//           status: PackageStatus.ACTIVE,
//           autoRenew: true,
//           currentPackageId: selectedPackage.id,
//           // paymentId is null because
//           // this is wallet payment.
//         },

//         include: {
//           package: true,
//           price: true,
//         },
//       });

//       // ==========================================
//       // 10. CREDIT PACKAGE REFERRAL REWARD
//       // ==========================================

//       const referralPackageReward = await rewardReferrerOnPackagePurchase(
//         tx,
//         userId,
//       );
//       // ---------------------------------
//       // 11. Return
//       // ---------------------------------

//       return {
//         userPackageId: userPackage.id,

//         package: {
//           id: selectedPackage.id,
//           name: selectedPackage.name,
//           slug: selectedPackage.slug,
//           tagline: selectedPackage.tagline,
//         },

//         referralReward: referralPackageReward
//           ? {
//               credited: true,
//               referrerId: referralPackageReward.referrerId,
//               amount: referralPackageReward.rewardAmount,
//               walletTransactionId: referralPackageReward.walletTransactionId,
//             }
//           : {
//               credited: false,
//             },

//         billing: {
//           priceId: packagePrice.id,
//           billingCycle: packagePrice.billingCycle,
//           months: packagePrice.months,

//           originalPrice: packagePrice.originalPrice,

//           discountPercent: packagePrice.discountPercent,

//           purchasePrice: packagePrice.price,
//         },

//         subscription: {
//           status: userPackage.status,
//           startDate: userPackage.startDate,
//           endDate: userPackage.endDate,
//           autoRenew: userPackage.autoRenew,
//         },

//         payment: {
//           method: "WALLET",
//           status: "SUCCESS",

//           amountPaid: purchaseAmount,

//           walletTransactionId: walletTransaction.id,

//           balanceBefore: wallet.balance,

//           balanceAfter: updatedWallet.balance,
//         },
//       };
//     },
//     {
//       isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
//       maxWait: 5000,
//       timeout: 10000,
//     },
//   );
// };

export const purchasePackageWithWalletService = async (
  userId: string,
  priceId: string,
) => {
  return prisma.$transaction(
    async (tx) => {
      // ==========================================
      // 1. VALIDATE USER
      // ==========================================

      const user = await tx.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          id: true,
          account_status: true,
        },
      });

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      if (user.account_status !== "ACTIVE") {
        throw new Error("ACCOUNT_NOT_ACTIVE");
      }

      // ==========================================
      // 2. GET PACKAGE PRICE + PACKAGE
      // ==========================================

      const packagePrice = await tx.packagePrice.findFirst({
        where: {
          id: priceId,
          active: true,

          package: {
            active: true,
          },
        },

        include: {
          package: true,
        },
      });

      if (!packagePrice) {
        throw new Error("PACKAGE_PRICE_NOT_FOUND");
      }

      const selectedPackage = packagePrice.package;

      if (packagePrice.price.lte(0)) {
        throw new Error("INVALID_PACKAGE_PRICE");
      }

      const purchaseAmount = packagePrice.price;

      const now = new Date();

      // ==========================================
      // 3. CHECK LIFETIME PACKAGE
      // ==========================================

      const lifetimePackage = await tx.userPackage.findFirst({
        where: {
          user_id: userId,

          status: PackageStatus.ACTIVE,

          price: {
            billingCycle: BillingCycle.LIFETIME,
          },

          OR: [
            {
              endDate: null,
            },
            {
              endDate: {
                gt: now,
              },
            },
          ],
        },

        include: {
          package: true,
        },
      });

      if (lifetimePackage) {
        throw new Error("LIFETIME_PACKAGE_ALREADY_OWNED");
      }

      // ==========================================
      // 4. GET CURRENT ACTIVE PACKAGE
      // ==========================================

      const activePackage = await tx.userPackage.findFirst({
        where: {
          user_id: userId,

          status: PackageStatus.ACTIVE,

          endDate: {
            gt: now,
          },
        },

        include: {
          package: true,
          price: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

      // ==========================================
      // 5. CHECK PENDING PACKAGE
      // ==========================================

      const pendingPackage = await tx.userPackage.findFirst({
        where: {
          user_id: userId,

          status: PackageStatus.PENDING,
        },

        include: {
          package: true,
        },
      });

      // ==========================================
      // 6. DETERMINE SUBSCRIPTION ACTION
      // ==========================================

      let action: SubscriptionAction = "NEW_PURCHASE";

      if (activePackage) {
        // SAME PACKAGE = RENEW

        if (activePackage.packageId === selectedPackage.id) {
          action = "RENEW";
        } else {
          const currentPriority = getPackagePriority(
            activePackage.package.slug,
          );

          const newPriority = getPackagePriority(selectedPackage.slug);

          if (currentPriority === 0 || newPriority === 0) {
            throw new Error("UNKNOWN_PACKAGE_PRIORITY");
          }

          // HIGHER PACKAGE = UPGRADE

          if (newPriority > currentPriority) {
            action = "UPGRADE";
          }

          // LOWER PACKAGE = DOWNGRADE
          else if (newPriority < currentPriority) {
            action = "DOWNGRADE";
          }

          // SAME PRIORITY, DIFFERENT PACKAGE
          else {
            throw new Error("SAME_PRIORITY_PACKAGE_CONFLICT");
          }
        }
      }

      // ==========================================
      // 7. PREVENT CONFLICTING PENDING PACKAGE
      // ==========================================

      if (pendingPackage) {
        throw new Error("PENDING_PACKAGE_ALREADY_EXISTS");
      }

      // ==========================================
      // 8. GET WALLET
      // ==========================================

      const wallet = await tx.wallet.findUnique({
        where: {
          userId,
        },
      });

      if (!wallet) {
        throw new Error("WALLET_NOT_FOUND");
      }

      // ==========================================
      // 9. CHECK WALLET BALANCE
      // ==========================================

      if (wallet.balance.lt(purchaseAmount)) {
        throw new Error("INSUFFICIENT_WALLET_BALANCE");
      }

      // ==========================================
      // 10. ATOMICALLY DEDUCT WALLET
      // ==========================================

      const deduction = await tx.wallet.updateMany({
        where: {
          id: wallet.id,

          balance: {
            gte: purchaseAmount,
          },
        },

        data: {
          balance: {
            decrement: purchaseAmount,
          },
        },
      });

      if (deduction.count !== 1) {
        throw new Error("INSUFFICIENT_WALLET_BALANCE");
      }

      const updatedWallet = await tx.wallet.findUniqueOrThrow({
        where: {
          id: wallet.id,
        },
      });

      // ==========================================
      // 11. CREATE WALLET TRANSACTION
      // ==========================================

      const walletTransaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,

          amount: purchaseAmount,

          type: TransactionType.PURCHASE,

          status: TransactionStatus.SUCCESS,

          source: TransactionSource.PREMIUM_PLAN,

          referenceId: selectedPackage.id,

          description:
            `${action}: ${selectedPackage.name} package - ` +
            `${packagePrice.billingCycle}`,

          balanceBefore: wallet.balance,

          balanceAfter: updatedWallet.balance,
        },
      });

      // ==========================================
      // 12. CALCULATE SUBSCRIPTION DATES
      // ==========================================

      let startDate = now;

      let endDate: Date | null = null;

      if (action === "RENEW") {
        // Extend existing package expiry

        startDate = activePackage!.startDate;

        endDate = calculatePackageEndDate(
          activePackage!.endDate!,
          packagePrice.billingCycle,
          packagePrice.months,
        );
      } else if (action === "DOWNGRADE") {
        // Start lower package after current expiry

        startDate = activePackage!.endDate!;

        endDate = calculatePackageEndDate(
          startDate,
          packagePrice.billingCycle,
          packagePrice.months,
        );
      } else {
        // New purchase or upgrade

        startDate = now;

        endDate = calculatePackageEndDate(
          startDate,
          packagePrice.billingCycle,
          packagePrice.months,
        );
      }

      // ==========================================
      // 13. CREATE / UPDATE USER PACKAGE
      // ==========================================

      let userPackage;

      // ------------------------------------------
      // CASE 1: RENEW
      // ------------------------------------------

      if (action === "RENEW") {
        userPackage = await tx.userPackage.update({
          where: {
            id: activePackage!.id,
          },

          data: {
            endDate,

            priceId: packagePrice.id,

            purchasePrice: packagePrice.price,

            purchaseOriginalPrice: packagePrice.originalPrice,

            purchaseDiscount: packagePrice.discountPercent,
          },

          include: {
            package: true,
            price: true,
          },
        });
      } else {
        // ----------------------------------------
        // CASE 2: UPGRADE
        // ----------------------------------------

        if (action === "UPGRADE") {
          await tx.userPackage.updateMany({
            where: {
              user_id: userId,

              status: PackageStatus.ACTIVE,
            },

            data: {
              status: PackageStatus.EXPIRED,

              endDate: now,

              autoRenew: false,
            },
          });
        }

        // ----------------------------------------
        // CASE 3: NEW PURCHASE / DOWNGRADE
        // ----------------------------------------

        userPackage = await tx.userPackage.create({
          data: {
            user_id: userId,

            packageId: selectedPackage.id,

            priceId: packagePrice.id,

            purchasePrice: packagePrice.price,

            purchaseOriginalPrice: packagePrice.originalPrice,

            purchaseDiscount: packagePrice.discountPercent,

            startDate,

            endDate,

            status:
              action === "DOWNGRADE"
                ? PackageStatus.PENDING
                : PackageStatus.ACTIVE,

            autoRenew: false,

            currentPackageId: selectedPackage.id,

            // Wallet payment:
            // paymentId remains null
          },

          include: {
            package: true,
            price: true,
          },
        });
      }

      // ==========================================
      // 14. CREDIT REFERRAL REWARD
      // ==========================================

      const referralPackageReward = await rewardReferrerOnPackagePurchase(
        tx,
        userId,
      );

      // ==========================================
      // 15. RETURN RESPONSE
      // ==========================================

      return {
        success: true,

        action,

        userPackageId: userPackage.id,

        package: {
          id: selectedPackage.id,

          name: selectedPackage.name,

          slug: selectedPackage.slug,

          tagline: selectedPackage.tagline,
        },

        referralReward: referralPackageReward
          ? {
              credited: true,

              referrerId: referralPackageReward.referrerId,

              amount: referralPackageReward.rewardAmount,

              walletTransactionId: referralPackageReward.walletTransactionId,
            }
          : {
              credited: false,
            },

        billing: {
          priceId: packagePrice.id,

          billingCycle: packagePrice.billingCycle,

          months: packagePrice.months,

          originalPrice: packagePrice.originalPrice,

          discountPercent: packagePrice.discountPercent,

          purchasePrice: packagePrice.price,
        },

        subscription: {
          status: userPackage.status,

          startDate: userPackage.startDate,

          endDate: userPackage.endDate,

          autoRenew: userPackage.autoRenew,
        },

        payment: {
          method: "WALLET",

          status: "SUCCESS",

          amountPaid: purchaseAmount,

          walletTransactionId: walletTransaction.id,

          balanceBefore: wallet.balance,

          balanceAfter: updatedWallet.balance,
        },
      };
    },

    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,

      maxWait: 5000,

      timeout: 10000,
    },
  );
};
