import {
  Prisma,
  PrismaClient,
  PurchasePaymentMethod,
  RoseTransactionType,
  StoreItemType,
  TransactionSource,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";


// Change the Prisma import path to match your project.

export const purchaseRoseWithWalletService = async (
  userId: string,
  packId: string
) => {
  return await prisma.$transaction(
    async (tx) => {

      // ---------------------------------------
      // 1. Validate logged-in user
      // ---------------------------------------

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

      // ---------------------------------------
      // 2. Get selected Rose pack
      // ---------------------------------------

      const pack = await tx.storePack.findFirst({
        where: {
          id: packId,
          itemType: StoreItemType.ROSE,
          isActive: true,
        },
      });

      if (!pack) {
        throw new Error("ROSE_PACK_NOT_FOUND");
      }

      if (
        pack.quantity <= 0 ||
        pack.totalPrice.lte(0)
      ) {
        throw new Error("INVALID_ROSE_PACK");
      }

      const purchaseAmount = pack.totalPrice;
      const roseQuantity = pack.quantity;

      // ---------------------------------------
      // 3. Get user wallet
      // ---------------------------------------

      const wallet = await tx.wallet.findUnique({
        where: {
          userId,
        },
      });

      if (!wallet) {
        throw new Error("WALLET_NOT_FOUND");
      }

      // ---------------------------------------
      // 4. Check sufficient wallet balance
      // ---------------------------------------

      if (wallet.balance.lt(purchaseAmount)) {
        throw new Error("INSUFFICIENT_WALLET_BALANCE");
      }

      // ---------------------------------------
      // 5. Deduct wallet balance atomically
      // ---------------------------------------

      const walletDeduction =
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

      if (walletDeduction.count !== 1) {
        throw new Error("INSUFFICIENT_WALLET_BALANCE");
      }

      const updatedWallet =
        await tx.wallet.findUniqueOrThrow({
          where: {
            id: wallet.id,
          },
        });

      // ---------------------------------------
      // 6. Create wallet transaction
      // ---------------------------------------

      const walletTransaction =
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,

            amount: purchaseAmount,

            type: TransactionType.PURCHASE,

            status: TransactionStatus.SUCCESS,

            source:
              TransactionSource.WALLET_TOPUP,

            description:
              `Purchased ${roseQuantity} Roses using wallet`,

            balanceBefore: wallet.balance,

            balanceAfter: updatedWallet.balance,
          },
        });

      // ---------------------------------------
      // 7. Create Rose purchase record
      // ---------------------------------------

      const rosePurchase =
        await tx.rosePurchase.create({
          data: {
            userId,

            quantity: roseQuantity,

            amount: purchaseAmount,

            paymentMethod:
              PurchasePaymentMethod.WALLET,

            walletTransactionId:
              walletTransaction.id,
          },
        });

      // ---------------------------------------
      // 8. Update Rose balance
      // ---------------------------------------

      const now = new Date();

      const updatedRoseBalance =
        await tx.userRoseBalance.upsert({
          where: {
            userId,
          },

          update: {
            totalRoses: {
              increment: roseQuantity,
            },

            purchasedRoses: {
              increment: roseQuantity,
            },
          },

          create: {
            userId,

            totalRoses: roseQuantity,

            freeRoses: 0,

            purchasedRoses: roseQuantity,

            weeklyLimit: 0,

            totalRosesSent: 0,

            lastResetAt: now,

            nextResetAt: new Date(
              now.getTime() +
              7 * 24 * 60 * 60 * 1000
            ),
          },
        });

      // ---------------------------------------
      // 9. Create Rose transaction history
      // ---------------------------------------

      const roseTransaction =
        await tx.roseTransaction.create({
          data: {
            userId,

            type: RoseTransactionType.PURCHASE,

            quantity: roseQuantity,

            roseBalanceAfter:
              updatedRoseBalance.totalRoses,

            purchaseId: rosePurchase.id,
          },
        });

      // ---------------------------------------
      // 10. Return purchase result
      // ---------------------------------------

      return {
        purchaseId: rosePurchase.id,

        walletTransactionId:
          walletTransaction.id,

        roseTransactionId:
          roseTransaction.id,

        pack: {
          id: pack.id,
          title: pack.title,
          quantity: roseQuantity,
          totalPrice: purchaseAmount,
        },

        payment: {
          method: "WALLET",
          status: "SUCCESS",
          amountPaid: purchaseAmount,

          balanceBefore: wallet.balance,

          balanceAfter: updatedWallet.balance,
        },

        roses: {
          purchased: roseQuantity,

          totalRoses:
            updatedRoseBalance.totalRoses,

          freeRoses:
            updatedRoseBalance.freeRoses,

          purchasedRoses:
            updatedRoseBalance.purchasedRoses,
        },

        purchasedAt: rosePurchase.createdAt,
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