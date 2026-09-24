import {
  Prisma,
  PurchasePaymentMethod,
  TransactionSource,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";


type WalletPurchaseInput = {
  boostOptionId: string;
};

export const purchaseBoostWithWalletService = async (
  userId: string,
  input: WalletPurchaseInput
) => {
  const { boostOptionId } = input;

  const result = await prisma.$transaction(
    async (tx) => {

      // -----------------------------------------
      // 1. Fetch selected Boost Option
      // -----------------------------------------

      const boostOption = await tx.boostOption.findUnique({
        where: {
          id: boostOptionId,
        },

        include: {
          boost: true,
        },
      });

      if (!boostOption) {
        throw new Error("BOOST_OPTION_NOT_FOUND");
      }

      if (
        !boostOption.is_active ||
        !boostOption.boost.is_active
      ) {
        throw new Error("BOOST_OPTION_NOT_ACTIVE");
      }

      if (boostOption.boostCount <= 0) {
        throw new Error("INVALID_BOOST_COUNT");
      }

      // -----------------------------------------
      // 2. Get final package amount from database
      // -----------------------------------------

      const amount = new Prisma.Decimal(
        boostOption.totalPrice
      );

      if (!amount.isFinite() || amount.lte(0)) {
        throw new Error("INVALID_BOOST_PRICE");
      }

      // -----------------------------------------
      // 3. Fetch user wallet
      // -----------------------------------------

      const wallet = await tx.wallet.findUnique({
        where: {
          userId,
        },
      });

      if (!wallet) {
        throw new Error("WALLET_NOT_FOUND");
      }

      // -----------------------------------------
      // 4. Check wallet balance
      // -----------------------------------------

      const balanceBefore = new Prisma.Decimal(
        wallet.balance
      );

      if (balanceBefore.lt(amount)) {
        throw new Error(
          "INSUFFICIENT_WALLET_BALANCE"
        );
      }

      // -----------------------------------------
      // 5. Deduct wallet balance atomically
      // -----------------------------------------

      const deduction = await tx.wallet.updateMany({
        where: {
          id: wallet.id,

          balance: {
            gte: amount,
          },
        },

        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      if (deduction.count !== 1) {
        throw new Error(
          "INSUFFICIENT_WALLET_BALANCE"
        );
      }

      // -----------------------------------------
      // 6. Fetch updated wallet balance
      // -----------------------------------------

      const updatedWallet =
        await tx.wallet.findUniqueOrThrow({
          where: {
            id: wallet.id,
          },
        });

      const balanceAfter = updatedWallet.balance;

      // -----------------------------------------
      // 7. Create wallet transaction
      // -----------------------------------------

      const walletTransaction =
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,

            amount,

            type: TransactionType.PURCHASE,

            status: TransactionStatus.SUCCESS,

            source:
              TransactionSource.BOOST_PURCHASE,

            description:
              `Purchased ${boostOption.label}`,

            balanceBefore,

            balanceAfter,
          },
        });

      // -----------------------------------------
      // 8. Create Boost Purchase record
      // -----------------------------------------

      const purchase = await tx.boostPurchase.create({
        data: {
          userId,

          boostOptionId: boostOption.id,

          quantity: boostOption.boostCount,

          amount,

          paymentMethod:
            PurchasePaymentMethod.WALLET,

          walletTransactionId:
            walletTransaction.id,
        },
      });

      // -----------------------------------------
      // 9. Credit purchased Boosts
      // -----------------------------------------

      const now = new Date();

      const userBoost = await tx.userBoost.create({
        data: {
          user_id: userId,

          boostId: boostOption.boost_id,

          boost_option_id: boostOption.id,

          total_boosts: boostOption.boostCount,

          remaining_boosts:
            boostOption.boostCount,

          weeklyLimit: 0,

          last_reset_at: now,

          next_reset_at: now,

          start_at: now,

          expires_at: null,

          is_active: true,
        },
      });

      // -----------------------------------------
      // 10. Return purchase details
      // -----------------------------------------

      return {
        purchaseId: purchase.id,

        walletTransactionId:
          walletTransaction.id,

        boostOptionId: boostOption.id,

        boostType: boostOption.boost.name,

        packageName: boostOption.label,

        purchasedBoosts:
          boostOption.boostCount,

        boostDuration:
          boostOption.timePerBoost,

        amountPaid: amount.toFixed(2),

        wallet: {
          balanceBefore:
            balanceBefore.toFixed(2),

          amountDeducted:
            amount.toFixed(2),

          balanceAfter:
            balanceAfter.toFixed(2),
        },

        transaction: {
          id: walletTransaction.id,

          type: walletTransaction.type,

          status: walletTransaction.status,

          source: walletTransaction.source,

          description:
            walletTransaction.description,
        },

        userBoost: {
          id: userBoost.id,

          totalBoosts:
            userBoost.total_boosts,

          remainingBoosts:
            userBoost.remaining_boosts,

          expiresAt: userBoost.expires_at,
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

  return result;
};