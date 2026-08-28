import {
  Prisma,
  TransactionStatus,
  TransactionType,
  TransactionSource,
} from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";
import { AppError } from "../rose/AppError";
import { GiftRepository } from "./gift.repository";
import { SendGiftDTO } from "./gift.validation";
import { getOrCreateConversation } from "../chat/chat.helper";
import { createGiftChatMessage } from "./gift.helper";

export const sendGiftService = async (
  senderId: string,
  payload: SendGiftDTO,
) => {
  const { receiverId, giftId, message, targetType = null, targetId = null, } = payload;

  if (senderId === receiverId) {
    throw new AppError(400, "You cannot send a gift to yourself.");
  }

  // Receiver
  const receiver = await GiftRepository.findReceiver(receiverId);

  if (!receiver) {
    throw new AppError(404, "Receiver not found.");
  }

  // Gift
  const gift = await GiftRepository.findGiftById(giftId);

  if (!gift) {
    throw new AppError(404, "Gift not found.");
  }

  //CALCULATE REQUIRED MSG FOR UNLOCK GIFT
  const previousGift = await prisma.userGift.count({
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

  // EXPIRY TIME
  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  );

  if (
    (targetType === "PHOTO" || targetType === "PROMPT") &&
    !targetId
  ) {
    throw new AppError(400, "TARGET_ID_REQUIRED");
  }

  // targetId should not be accepted for other target types
  if (
    targetId &&
    targetType !== "PHOTO" &&
    targetType !== "PROMPT"
  ) {
    throw new AppError(400, "TARGET_ID_NOT_ALLOWED");
  }


  return prisma.$transaction(async (tx) => {
    // Wallet
    const wallet = await tx.wallet.findUnique({
      where: {
        userId: senderId,
      },
    });

    if (!wallet) {
      throw new AppError(404, "Wallet not found.");
    }

    // Balance check
    if (wallet.balance.toNumber() < gift.coinCost) {
      throw new AppError(400, "Insufficient wallet balance.");
    }

    const balanceBefore = wallet.balance;
    const balanceAfter = wallet.balance.minus(
      new Prisma.Decimal(gift.coinCost),
    );

    // Deduct balance
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

    // Wallet transaction
    const walletTransaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: new Prisma.Decimal(gift.coinCost),
        type: TransactionType.PURCHASE,
        status: TransactionStatus.SUCCESS,
        source: TransactionSource.GIFT_PURCHASE,
        description: `Gift "${gift.name}" sent to ${receiver.full_name}`,
        balanceBefore,
        balanceAfter,
      },
    });

    // Gift history
    const userGift = await tx.userGift.create({
      data: {
        senderId,
        receiverId,
        giftId: gift.id,
        giftName: gift.name,
        pricePaid: gift.coinCost,
        message,
        walletTransactionId: walletTransaction.id,
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

    const conversation = await getOrCreateConversation(
      senderId,
      receiverId,
      tx
    );

    // 5. Create GIFT chat message
    const chatMessage = await createGiftChatMessage(
      {
        conversationId: conversation.id,
        senderId,
        giftId: userGift.giftId,
        coinCost: userGift.pricePaid,
        targetType: userGift.targetType,
        targetId: userGift.targetId,
        mediaUrl: gift.image,
        requiredMessages: userGift.requiredMessages,
        expiresAt: userGift.expiresAt,
      },
      tx
    );

    // 6. Update conversation
    await tx.conversation.update({
      where: {
        id: conversation.id,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    return {
      walletBalance: updatedWallet.balance,
      gift: {
        ...userGift,
        receiver: {
          id: userGift.receiver.id,
          full_name: userGift.receiver.full_name,
          profile_image: userGift.receiver.photos[0]?.media_url ?? null,
        },
      },
    };

  });
};
