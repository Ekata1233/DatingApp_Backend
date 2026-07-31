// rose.repository.ts
import { PrismaClient, Prisma, RoseTransactionType } from '@prisma/client';
import { ROSE_CONSTANTS } from './rose.constants';
import { RoseHistoryQuery } from './rose.types';


export const getBalance = async (userId: string, prisma: PrismaClient) => {
  return prisma.userRoseBalance.findUnique({
    where: { userId },
  });
};

export const createBalance = async (userId: string, prisma: PrismaClient) => {
  return prisma.userRoseBalance.create({
    data: {
      userId,
      totalRoses: 0,
      lastResetAt: new Date(),
      nextResetAt: new Date(),
    },
  });
};

export const getOrCreateBalance = async (userId: string, prisma: PrismaClient) => {
  let balance = await getBalance(userId, prisma);

  if (!balance) {
    balance = await createBalance(userId, prisma);
  }

  // Check if we need to reset daily purchased roses
  const now = new Date();
  const lastReset = new Date(balance.lastResetAt);

  if (shouldResetDailyRoses(lastReset, now)) {
    balance = await prisma.userRoseBalance.update({
      where: { userId },
      data: {
        lastResetAt: now,
      },
    });
  }

  return balance;
};

export const deductRose = async (
  userId: string,
  prisma: PrismaClient | Prisma.TransactionClient
) => {
  const balance = await prisma.userRoseBalance.findUnique({
    where: { userId },
  });

  if (!balance) {
    throw new Error("Rose balance not found");
  }

  if (balance.totalRoses <= 0) {
    throw new Error("No roses available");
  }

  // Priority:
  // 1. freeRoses (package)
  // 2. purchasedRoses

  if (balance.freeRoses > 0) {
    const updated = await prisma.userRoseBalance.update({
      where: { userId },
      data: {
        freeRoses: { decrement: 1 },
        totalRoses: { decrement: 1 },
        totalRosesSent: { increment: 1 },
      },
    });

    return {
      balance: updated,
      transactionType: RoseTransactionType.PACKAGE_SEND,
    };
  }

  if (balance.purchasedRoses > 0) {
    const updated = await prisma.userRoseBalance.update({
      where: { userId },
      data: {
        purchasedRoses: { decrement: 1 },
        totalRoses: { decrement: 1 },
        totalRosesSent: { increment: 1 },
      },
    });

    return {
      balance: updated,
      transactionType: RoseTransactionType.PURCHASE_SEND,
    };
  }
   throw new Error("No roses available");
};

export const createRoseLedger = async (
  data: {
    userId: string;
    type: RoseTransactionType;
    quantity: number;
    roseBalanceAfter: number;
  },
  prisma: Prisma.TransactionClient
) => {
  return prisma.roseTransaction.create({
    data,
  });
};

export const createRoseTransaction = async (
  data: {
    senderId: string;
    receiverId: string;
  },
  prisma: PrismaClient | Prisma.TransactionClient
) => {
  return prisma.userRose.create({
    data: {
      senderId: data.senderId,
      receiverId: data.receiverId,
    },
  });
};

export const checkExistingRose = async (
  senderId: string,
  receiverId: string,
  since: Date,
  prisma: PrismaClient
) => {
  return prisma.userRose.findFirst({
    where: {
      senderId,
      receiverId,
      createdAt: {
        gte: since,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const countTodayRoses = async (userId: string, prisma: PrismaClient) => {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setUTCHours(23, 59, 59, 999);

  return prisma.userRose.count({
    where: {
      senderId: userId,
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  });
};

export const countTodayRosesToUser = async (
  senderId: string,
  receiverId: string,
  prisma: PrismaClient
) => {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setUTCHours(23, 59, 59, 999);

  return prisma.userRose.count({
    where: {
      senderId,
      receiverId,
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  });
};

export const checkBlockedStatus = async (
  userId1: string,
  userId2: string,
  prisma: PrismaClient
) => {
  const block = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: userId1, blockedId: userId2 },
        { blockerId: userId2, blockedId: userId1 },
      ],
    },
  });

  return !!block;
};

export const checkMatch = async (
  userId1: string,
  userId2: string,
  prisma: PrismaClient
): Promise<boolean> => {
  const match = await prisma.userMatch.findFirst({
    where: {
      OR: [
        {
          user1Id: userId1,
          user2Id: userId2,
        },
        {
          user1Id: userId2,
          user2Id: userId1,
        },
      ],
      is_active: true,
      is_deleted: false,
    },
    select: {
      id: true,
    },
  });

  return !!match;
};

export const getRoseHistory = async (
  userId: string,
  query: RoseHistoryQuery,
  prisma: PrismaClient
) => {
  const page = query.page || 1;
  const limit = Math.min(
    query.limit || ROSE_CONSTANTS.DEFAULT_PAGE_SIZE,
    ROSE_CONSTANTS.MAX_PAGE_SIZE
  );
  const skip = (page - 1) * limit;

  const where: Prisma.UserRoseWhereInput = query.type === 'sent'
    ? { senderId: userId }
    : query.type === 'received'
      ? { receiverId: userId }
      : {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      };

  if (query.startDate || query.endDate) {
    where.createdAt = {};
    if (query.startDate) {
      (where.createdAt as Prisma.DateTimeFilter).gte = new Date(query.startDate);
    }
    if (query.endDate) {
      (where.createdAt as Prisma.DateTimeFilter).lte = new Date(query.endDate);
    }
  }

  const [roses, totalItems] = await Promise.all([
    prisma.userRose.findMany({
      where,
      include: {
        sender: {
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
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.userRose.count({ where }),
  ]);

  return {
    roses,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
      itemsPerPage: limit,
    },
  };
};

const shouldResetDailyRoses = (lastReset: Date, now: Date): boolean => {
  const lastResetDay = new Date(lastReset);
  lastResetDay.setUTCHours(0, 0, 0, 0);

  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);

  return lastResetDay < today;
};

export const addPurchasedRoses = async (
  userId: string,
  amount: number,
  prisma: PrismaClient
) => {
  return prisma.userRoseBalance.update({
    where: { userId },
    data: {
      totalRoses: { increment: amount },
    },
  });
};