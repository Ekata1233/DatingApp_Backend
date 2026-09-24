import {
  Prisma,
  PurchasePaymentMethod,
  ComplimentTransactionType,
  StoreItemType,
  TransactionSource,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";

// Update the Prisma import path as per your project.

export const purchaseComplimentWithWalletService =
  async (
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
        // 2. Get selected Compliment pack
        // ---------------------------------------

        const pack =
          await tx.storePack.findFirst({
            where: {
              id: packId,

              itemType:
                StoreItemType.COMPLIMENT,

              isActive: true,
            },
          });

        if (!pack) {
          throw new Error(
            "COMPLIMENT_PACK_NOT_FOUND"
          );
        }

        if (
          pack.quantity <= 0 ||
          pack.totalPrice.lte(0)
        ) {
          throw new Error(
            "INVALID_COMPLIMENT_PACK"
          );
        }

        const purchaseAmount =
          pack.totalPrice;

        const complimentQuantity =
          pack.quantity;

        // ---------------------------------------
        // 3. Get user's wallet
        // ---------------------------------------

        const wallet =
          await tx.wallet.findUnique({
            where: {
              userId,
            },
          });

        if (!wallet) {
          throw new Error(
            "WALLET_NOT_FOUND"
          );
        }

        // ---------------------------------------
        // 4. Check wallet balance
        // ---------------------------------------

        if (
          wallet.balance.lt(purchaseAmount)
        ) {
          throw new Error(
            "INSUFFICIENT_WALLET_BALANCE"
          );
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

        if (
          walletDeduction.count !== 1
        ) {
          throw new Error(
            "INSUFFICIENT_WALLET_BALANCE"
          );
        }

        // ---------------------------------------
        // 6. Get updated wallet balance
        // ---------------------------------------

        const updatedWallet =
          await tx.wallet.findUniqueOrThrow({
            where: {
              id: wallet.id,
            },
          });

        // ---------------------------------------
        // 7. Create wallet transaction
        // ---------------------------------------

        const walletTransaction =
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,

              amount: purchaseAmount,

              type:
                TransactionType.PURCHASE,

              status:
                TransactionStatus.SUCCESS,

              source:
                TransactionSource.WALLET_TOPUP,

              description:
                `Purchased ${complimentQuantity} Compliments using wallet`,

              balanceBefore:
                wallet.balance,

              balanceAfter:
                updatedWallet.balance,
            },
          });

        // ---------------------------------------
        // 8. Create Compliment purchase record
        // ---------------------------------------

        const complimentPurchase =
          await tx.complimentPurchase.create({
            data: {
              userId,

              quantity:
                complimentQuantity,

              amount:
                purchaseAmount,

              paymentMethod:
                PurchasePaymentMethod.WALLET,

              walletTransactionId:
                walletTransaction.id,
            },
          });

        // ---------------------------------------
        // 9. Update Compliment balance
        // ---------------------------------------

        const now = new Date();

        const nextResetAt =
          new Date(
            now.getTime() +
            7 * 24 * 60 * 60 * 1000
          );

        const updatedComplimentBalance =
          await tx.userComplimentBalance.upsert({
            where: {
              userId,
            },

            update: {
              totalCompliments: {
                increment:
                  complimentQuantity,
              },

              purchasedCompliments: {
                increment:
                  complimentQuantity,
              },
            },

            create: {
              userId,

              totalCompliments:
                complimentQuantity,

              freeCompliments: 0,

              purchasedCompliments:
                complimentQuantity,

              weeklyLimit: 0,

              totalComplimentsSent: 0,

              lastResetAt: now,

              nextResetAt,
            },
          });

        // ---------------------------------------
        // 10. Create Compliment transaction
        // ---------------------------------------

        const complimentTransaction =
          await tx.complimentTransaction.create({
            data: {
              userId,

              type:
                ComplimentTransactionType.PURCHASE,

              quantity:
                complimentQuantity,

              complimentBalanceAfter:
                updatedComplimentBalance
                  .totalCompliments,

              purchaseId:
                complimentPurchase.id,
            },
          });

        // ---------------------------------------
        // 11. Return purchase details
        // ---------------------------------------

        return {
          purchaseId:
            complimentPurchase.id,

          walletTransactionId:
            walletTransaction.id,

          complimentTransactionId:
            complimentTransaction.id,

          pack: {
            id: pack.id,

            title: pack.title,

            quantity:
              complimentQuantity,

            totalPrice:
              purchaseAmount,
          },

          payment: {
            method: "WALLET",

            status: "SUCCESS",

            amountPaid:
              purchaseAmount,

            balanceBefore:
              wallet.balance,

            balanceAfter:
              updatedWallet.balance,
          },

          compliments: {
            purchased:
              complimentQuantity,

            totalCompliments:
              updatedComplimentBalance
                .totalCompliments,

            freeCompliments:
              updatedComplimentBalance
                .freeCompliments,

            purchasedCompliments:
              updatedComplimentBalance
                .purchasedCompliments,
          },

          purchasedAt:
            complimentPurchase.createdAt,
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