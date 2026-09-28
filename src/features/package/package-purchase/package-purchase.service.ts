import {
  BillingCycle,
  PackageStatus,
  Prisma,
  TransactionSource,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";

const calculatePackageEndDate = (
  startDate: Date,
  billingCycle: BillingCycle,
  months: number | null
): Date | null => {
  // Lifetime package never expires
  if (billingCycle === BillingCycle.LIFETIME) {
    return null;
  }

  const endDate = new Date(startDate);

  // Prefer explicitly configured months
  if (months && months > 0) {
    endDate.setMonth(endDate.getMonth() + months);
    return endDate;
  }

  // Fallback based on billing cycle
  switch (billingCycle) {
    case BillingCycle.MONTHLY:
      endDate.setMonth(endDate.getMonth() + 1);
      break;

    case BillingCycle.QUARTERLY:
      endDate.setMonth(endDate.getMonth() + 3);
      break;

    case BillingCycle.HALF_YEARLY:
      endDate.setMonth(endDate.getMonth() + 6);
      break;

    case BillingCycle.YEARLY:
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;

    default:
      throw new Error("INVALID_BILLING_CYCLE");
  }

  return endDate;
};

export const purchasePackageWithWalletService = async (
  userId: string,
  priceId: string
) => {
  return prisma.$transaction(
    async (tx) => {
      // ---------------------------------
      // 1. Validate user
      // ---------------------------------

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

      // ---------------------------------
      // 2. Get PackagePrice + Package
      // ---------------------------------

      const packagePrice =
        await tx.packagePrice.findFirst({
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

      // ---------------------------------
      // 3. Get wallet
      // ---------------------------------

      const wallet = await tx.wallet.findUnique({
        where: {
          userId,
        },
      });

      if (!wallet) {
        throw new Error("WALLET_NOT_FOUND");
      }

      // ---------------------------------
      // 4. Check wallet balance
      // ---------------------------------

      if (wallet.balance.lt(purchaseAmount)) {
        throw new Error(
          "INSUFFICIENT_WALLET_BALANCE"
        );
      }

      // ---------------------------------
      // 5. Atomically deduct wallet
      // ---------------------------------

      const deduction =
        await tx.wallet.updateMany({
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
        throw new Error(
          "INSUFFICIENT_WALLET_BALANCE"
        );
      }

      const updatedWallet =
        await tx.wallet.findUniqueOrThrow({
          where: {
            id: wallet.id,
          },
        });

      // ---------------------------------
      // 6. Wallet transaction
      // ---------------------------------

      const walletTransaction =
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,

            amount: purchaseAmount,

            type: TransactionType.PURCHASE,

            status:
              TransactionStatus.SUCCESS,

            source:
              TransactionSource.PREMIUM_PLAN,

            referenceId:
              selectedPackage.id,

            description:
              `Purchased ${selectedPackage.name} package - ${packagePrice.billingCycle}`,

            balanceBefore: wallet.balance,

            balanceAfter:
              updatedWallet.balance,
          },
        });

      // ---------------------------------
      // 7. Calculate package dates
      // ---------------------------------

      const startDate = new Date();

      const endDate = calculatePackageEndDate(
        startDate,
        packagePrice.billingCycle,
        packagePrice.months
      );

      // ---------------------------------
      // 8. Handle existing active package
      // ---------------------------------

      await tx.userPackage.updateMany({
        where: {
          user_id: userId,
          status: PackageStatus.ACTIVE,
        },

        data: {
          status: PackageStatus.EXPIRED,
          autoRenew: false,
        },
      });

      // ---------------------------------
      // 9. Create UserPackage
      // ---------------------------------

      const userPackage =
        await tx.userPackage.create({
          data: {
            user_id: userId,

            packageId: selectedPackage.id,

            priceId: packagePrice.id,

            purchasePrice:
              packagePrice.price,

            purchaseOriginalPrice:
              packagePrice.originalPrice,

            purchaseDiscount:
              packagePrice.discountPercent,

            startDate,

            endDate,

            status: PackageStatus.ACTIVE,

            autoRenew: false,

            currentPackageId:
              selectedPackage.id,

            // paymentId is null because
            // this is wallet payment.
          },

          include: {
            package: true,
            price: true,
          },
        });

      // ---------------------------------
      // 10. Return
      // ---------------------------------

      return {
        userPackageId: userPackage.id,

        package: {
          id: selectedPackage.id,
          name: selectedPackage.name,
          slug: selectedPackage.slug,
          tagline: selectedPackage.tagline,
        },

        billing: {
          priceId: packagePrice.id,
          billingCycle:
            packagePrice.billingCycle,
          months: packagePrice.months,

          originalPrice:
            packagePrice.originalPrice,

          discountPercent:
            packagePrice.discountPercent,

          purchasePrice:
            packagePrice.price,
        },

        subscription: {
          status: userPackage.status,
          startDate:
            userPackage.startDate,
          endDate:
            userPackage.endDate,
          autoRenew:
            userPackage.autoRenew,
        },

        payment: {
          method: "WALLET",
          status: "SUCCESS",

          amountPaid:
            purchaseAmount,

          walletTransactionId:
            walletTransaction.id,

          balanceBefore:
            wallet.balance,

          balanceAfter:
            updatedWallet.balance,
        },
      };
    },
    {
      isolationLevel:
        Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000,
    }
  );
};