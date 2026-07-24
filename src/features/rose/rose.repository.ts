// rose.repository.ts
import { PrismaClient, RoseType, Prisma } from '@prisma/client';
import { ROSE_CONSTANTS } from './rose.constants';
import { RoseHistoryQuery } from './rose.types';

export class RoseRepository {
  constructor(private prisma: PrismaClient) {}

  async getUserBalance(userId: string) {
    return this.prisma.userRoseBalance.findUnique({
      where: { userId },
    });
  }

  async createUserBalance(userId: string) {
    return this.prisma.userRoseBalance.create({
      data: {
        userId,
        freeRoses: ROSE_CONSTANTS.DAILY_FREE_ROSES,
        purchasedRoses: 0,
        lastResetAt: new Date(),
      },
    });
  }

  async getOrCreateBalance(userId: string) {
    let balance = await this.getUserBalance(userId);
    
    if (!balance) {
      balance = await this.createUserBalance(userId);
    }
    
    // Check if we need to reset daily free roses
    const now = new Date();
    const lastReset = new Date(balance.lastResetAt);
    
    if (this.shouldResetDailyRoses(lastReset, now)) {
      balance = await this.prisma.userRoseBalance.update({
        where: { userId },
        data: {
          freeRoses: ROSE_CONSTANTS.DAILY_FREE_ROSES,
          lastResetAt: now,
        },
      });
    }
    
    return balance;
  }

  async deductRose(
    userId: string,
    roseType: RoseType,
    prisma?: Prisma.TransactionClient
  ) {
    const client = prisma || this.prisma;
    
    if (roseType === 'FREE') {
      return client.userRoseBalance.update({
        where: { userId },
        data: {
          freeRoses: { decrement: 1 },
        },
      });
    } else {
      return client.userRoseBalance.update({
        where: { userId },
        data: {
          purchasedRoses: { decrement: 1 },
        },
      });
    }
  }

  async createRoseTransaction(
    data: {
      senderId: string;
      receiverId: string;
      type: RoseType;
      message?: string;
    },
    prisma?: Prisma.TransactionClient
  ) {
    const client = prisma || this.prisma;
    
    return client.userRose.create({
      data: {
        senderId: data.senderId,
        receiverId: data.receiverId,
        type: data.type,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            photos: {
              select: {
                url: true,
              },
              take: 1,
            },
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            photos: {
              select: {
                url: true,
              },
              take: 1,
            },
          },
        },
      },
    });
  }

  async checkExistingRose(
    senderId: string,
    receiverId: string,
    since: Date
  ) {
    return this.prisma.userRose.findFirst({
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
  }

  async countTodayRoses(userId: string) {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);
    
    return this.prisma.userRose.count({
      where: {
        senderId: userId,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });
  }

  async countTodayRosesToUser(senderId: string, receiverId: string) {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);
    
    return this.prisma.userRose.count({
      where: {
        senderId,
        receiverId,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });
  }

  async checkBlockedStatus(userId1: string, userId2: string) {
    const block = await this.prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userId1, blockedId: userId2 },
          { blockerId: userId2, blockedId: userId1 },
        ],
      },
    });
    
    return !!block;
  }

  async checkMatch(userId1: string, userId2: string) {
    const match = await this.prisma.match.findFirst({
      where: {
        OR: [
          { userId1, userId2 },
          { userId1: userId2, userId2: userId1 },
        ],
        status: 'ACTIVE',
      },
    });
    
    return !!match;
  }

  async getRoseHistory(userId: string, query: RoseHistoryQuery) {
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
      this.prisma.userRose.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              photos: {
                select: { url: true },
                take: 1,
              },
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              photos: {
                select: { url: true },
                take: 1,
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.userRose.count({ where }),
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
  }

  private shouldResetDailyRoses(lastReset: Date, now: Date): boolean {
    const lastResetDay = new Date(lastReset);
    lastResetDay.setUTCHours(0, 0, 0, 0);
    
    const today = new Date(now);
    today.setUTCHours(0, 0, 0, 0);
    
    return lastResetDay < today;
  }

  async addPurchasedRoses(userId: string, amount: number) {
    return this.prisma.userRoseBalance.update({
      where: { userId },
      data: {
        purchasedRoses: { increment: amount },
      },
    });
  }
}