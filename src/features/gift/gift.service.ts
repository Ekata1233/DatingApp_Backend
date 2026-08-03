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

export const sendGiftService = async (
  senderId: string,
  payload: SendGiftDTO,
) => {
  const { receiverId, giftId, message } = payload;

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
