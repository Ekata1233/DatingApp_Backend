import {
  Prisma,
  TransactionSource,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";

export const dateNowConfirmMessage = {
  async createDateConfirmedMessage(
    tx: any,
    conversationId: string,
    senderId: string,
    datePlanId: string,
    confirmedDateId: string,
  ) {
    return tx.chatMessage.create({
      data: {
        conversationId,
        senderId,

        messageType: "DATE_CONFIRMED",

        datePlanId,

        metadata: {
          confirmedDateId,

          // Chat card status
          status: "ACTIVE",
        },
      },

      include: {
        datePlan: {
          include: {
            user: true,

            activity: true,

            quickTitle: true,

            whoPays: true,

            joinRequestGender: true,

            visibility: true,

            vibes: {
              include: {
                option: true,
              },
            },

            requests: {
              select: {
                id: true,
                requesterId: true,
                status: true,
              },
            },
          },
        },

        sender: true,
      },
    });
  }
}

export const DATE_PLAN_WALLET_PRICE = 10;

export const deductDatePlanAmountFromWallet = async (
  userId: string,
  amount: number,
  tx: Prisma.TransactionClient
) => {
  const wallet = await tx.wallet.findUnique({
    where: {
      userId,
    },
  });

  if (!wallet) {
    throw new Error(
      "You don't have any date plan credits or wallet balance."
    );
  }

  const amountDecimal = new Prisma.Decimal(amount);

  if (wallet.balance.lessThan(amountDecimal)) {
    throw new Error(
      `Insufficient wallet balance. ₹${amount} is required to publish a date plan.`
    );
  }

  const balanceBefore = wallet.balance;

  const balanceAfter =
    balanceBefore.minus(amountDecimal);

  const updatedWallet = await tx.wallet.update({
    where: {
      id: wallet.id,
    },
    data: {
      balance: balanceAfter,
    },
  });

  const walletTransaction =
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: amountDecimal,
        type: TransactionType.PURCHASE,
        status: TransactionStatus.SUCCESS,
        source:TransactionSource.WALLET_TOPUP,
        referenceId: null,
        description:"Date plan publish purchase",
        balanceBefore,
        balanceAfter,
      },
    });

  return {
    wallet: updatedWallet,
    transaction: walletTransaction,
    amountCharged: amountDecimal,
  };
};