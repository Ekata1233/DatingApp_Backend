import { prisma } from "../../prisma/prismaClient";

export const GiftRepository = {
 findGiftById(giftId: number) {
  return prisma.gift.findFirst({
    where: {
      id: giftId,
      isLive: true,
    },
  });
},

  findReceiver(receiverId: string) {
    return prisma.user.findUnique({
      where: {
        id: receiverId,
      },
      select: {
        id: true,
        full_name: true,
        profile_image: true,
      },
    });
  },

  findWallet(userId: string) {
    return prisma.wallet.findUnique({
      where: {
        userId,
      },
    });
  },
};