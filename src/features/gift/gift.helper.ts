import { MessageType, Prisma, TransactionSource, TransactionStatus, TransactionType } from "@prisma/client";
import { SendEngagementDTO } from "../engagement/engagement.validation";
import { AppError } from "../rose/AppError";

interface CreateGiftMessageData {
  conversationId: string;
  senderId: string;
  giftId: string;
  targetType: string | null;
  targetId: string | null;
  mediaUrl: string | null;
}

export const createGiftChatMessage = async (
  data: CreateGiftMessageData,
  tx: Prisma.TransactionClient
) => {
  return tx.chatMessage.create({
    data: {
      conversationId: data.conversationId,
      senderId: data.senderId,
      content: null,
      messageType: MessageType.GIFT,
      mediaUrl: data.mediaUrl,
      giftId: data.giftId,
      metadata: {
        targetType: data.targetType,
        targetId: data.targetId,
      },
    },
  });
};



export const createBundleGift = async (
  senderId: string,
  receiverId: string,
  data: NonNullable<SendEngagementDTO["gift"]>,
  targetType: SendEngagementDTO["targetType"],
  targetId: SendEngagementDTO["targetId"],
  tx: Prisma.TransactionClient,
) => {
  const {
    giftId,
    message,
  } = data;

  /* -------------------------------------------------------------------------- */
  /*                              Receiver Validation                           */
  /* -------------------------------------------------------------------------- */

  const receiver = await tx.user.findUnique({
    where: {
      id: receiverId,
    },
    select: {
      id: true,
      full_name: true,
    },
  });

  if (!receiver) {
    throw new AppError(404, "Receiver not found.");
  }

  /* -------------------------------------------------------------------------- */
  /*                                Gift Validation                             */
  /* -------------------------------------------------------------------------- */

  const gift = await tx.gift.findUnique({
    where: {
      id: giftId,
    },
  });

  if (!gift) {
    throw new AppError(404, "Gift not found.");
  }

  /* -------------------------------------------------------------------------- */
  /*                            Target Validation                               */
  /* -------------------------------------------------------------------------- */

  if (
    (targetType === "PHOTO" || targetType === "PROMPT") &&
    !targetId
  ) {
    throw new AppError(400, "TARGET_ID_REQUIRED");
  }

  if (
    targetId &&
    targetType !== "PHOTO" &&
    targetType !== "PROMPT"
  ) {
    throw new AppError(400, "TARGET_ID_NOT_ALLOWED");
  }

  /* -------------------------------------------------------------------------- */
  /*                     Calculate Required Messages                            */
  /* -------------------------------------------------------------------------- */

  const previousGift = await tx.userGift.count({
    where: {
      senderId,
      receiverId,
    },
  });

  let requiredMessages = 1;

  if (previousGift === 0) {
    requiredMessages = 25;
  } else if (previousGift === 1) {
    requiredMessages = 5;
  } else {
    requiredMessages = 1;
  }

  /* -------------------------------------------------------------------------- */
  /*                                Expiry                                      */
  /* -------------------------------------------------------------------------- */

  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  );

  /* -------------------------------------------------------------------------- */
  /*                              Wallet                                        */
  /* -------------------------------------------------------------------------- */

  const wallet = await tx.wallet.findUnique({
    where: {
      userId: senderId,
    },
  });

  if (!wallet) {
    throw new AppError(404, "Wallet not found.");
  }

  /* -------------------------------------------------------------------------- */
  /*                         Balance Validation                                 */
  /* -------------------------------------------------------------------------- */

  if (wallet.balance.toNumber() < gift.coinCost) {
    throw new AppError(
      400,
      "Insufficient wallet balance.",
    );
  }

  const balanceBefore = wallet.balance;

  const balanceAfter = wallet.balance.minus(
    new Prisma.Decimal(gift.coinCost),
  );

  /* -------------------------------------------------------------------------- */
  /*                           Deduct Wallet                                    */
  /* -------------------------------------------------------------------------- */

  const updatedWallet = await tx.wallet.update({
    where: {
      id: wallet.id,
    },
    data: {
      balance: {
        decrement: new Prisma.Decimal(gift.coinCost),
      },
    },
  });

  /* -------------------------------------------------------------------------- */
  /*                         Wallet Transaction                                 */
  /* -------------------------------------------------------------------------- */

  const walletTransaction =
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,

        amount: new Prisma.Decimal(
          gift.coinCost,
        ),

        type: TransactionType.PURCHASE,

        status: TransactionStatus.SUCCESS,

        source: TransactionSource.GIFT_PURCHASE,

        description: `Gift "${gift.name}" sent to ${receiver.full_name}`,

        balanceBefore,

        balanceAfter,
      },
    });

  /* -------------------------------------------------------------------------- */
  /*                              Create Gift                                    */
  /* -------------------------------------------------------------------------- */

  const userGift = await tx.userGift.create({
    data: {
      senderId,
      receiverId,

      giftId: gift.id,

      giftName: gift.name,

      pricePaid: gift.coinCost,

      message: message ?? null,

      walletTransactionId:
        walletTransaction.id,

      targetType,

      targetId,

      requiredMessages,

      expiresAt,
    },

    include: {
      gift: true,

      receiver: {
        select: {
          id: true,
          full_name: true,

          photos: {
            where: {
              is_primary: true,
            },

            select: {
              media_url: true,
            },

            take: 1,
          },
        },
      },
    },
  });

  /* -------------------------------------------------------------------------- */
  /*                              Return                                        */
  /* -------------------------------------------------------------------------- */

  return {
    userGift,

    gift,

    walletBalance: updatedWallet.balance,

    giftMessage: message ?? null,

    mediaUrl: gift.image,
  };
};