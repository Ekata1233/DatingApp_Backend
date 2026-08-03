import { ComplimentTransactionType, Prisma, PrismaClient } from "@prisma/client";
import { COMPLIMENT_CONSTANTS } from "./compliment.constant";
import { ComplimentHistoryQuery } from "./compliment.types";

const prisma = new PrismaClient();

/* -------------------------------------------------------------------------- */
/*                              User / Balance                                */
/* -------------------------------------------------------------------------- */

export async function findUserById(
  userId: string,
  tx: Prisma.TransactionClient = prisma
) {
  return tx.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      isDeleted: true, 
    },
  });
}

export async function getComplimentBalance(
  userId: string,
  tx: Prisma.TransactionClient = prisma
) {
  return tx.userComplimentBalance.findUnique({
    where: {
      userId,
    },
  });
}

export async function updateComplimentBalance(
  userId: string,
  data: Prisma.UserComplimentBalanceUpdateInput,
  tx: Prisma.TransactionClient = prisma
) {
  return tx.userComplimentBalance.update({
    where: {
      userId,
    },
    data,
  });
}

/* -------------------------------------------------------------------------- */
/*                             Compliment Ideas                               */
/* -------------------------------------------------------------------------- */

export async function findComplimentIdea(
  ideaId: string,
  tx: Prisma.TransactionClient = prisma
) {
  return tx.complimentIdea.findUnique({
    where: {
      id: ideaId,
    },
    include: {
      category: true,
    },
  });
}

/* -------------------------------------------------------------------------- */
/*                           User Compliment                                  */
/* -------------------------------------------------------------------------- */

export async function createUserCompliment(
  data: Prisma.UserComplimentUncheckedCreateInput,
  tx: Prisma.TransactionClient = prisma
) {
  return tx.userCompliment.create({
    data,
  });
}

/* -------------------------------------------------------------------------- */
/*                        Compliment Transaction                              */
/* -------------------------------------------------------------------------- */

export async function createComplimentTransaction(
  data: Prisma.ComplimentTransactionUncheckedCreateInput,
  tx: Prisma.TransactionClient = prisma
) {
  return tx.complimentTransaction.create({
    data,
  });
}

/* -------------------------------------------------------------------------- */
/*                           Balance Increment                                */
/* -------------------------------------------------------------------------- */

export async function incrementComplimentSent(
  userId: string,
  tx: Prisma.TransactionClient = prisma
) {
  return tx.userComplimentBalance.update({
    where: {
      userId,
    },
    data: {
      totalComplimentsSent: {
        increment: 1,
      },
    },
  });
}

export const deductCompliment = async (
  userId: string,
  prisma: PrismaClient | Prisma.TransactionClient
) => {
  const balance = await prisma.userComplimentBalance.findUnique({
    where: { userId },
  });

  if (!balance) {
    throw new Error("Compliment balance not found");
  }

  if (balance.totalCompliments <= 0) {
    throw new Error("No compliments available");
  }

  // Priority:
  // 1. Free compliments (Package)
  // 2. Purchased compliments

  if (balance.freeCompliments > 0) {
    const updated = await prisma.userComplimentBalance.update({
      where: { userId },
      data: {
        freeCompliments: { decrement: 1 },
        totalCompliments: { decrement: 1 },
        totalComplimentsSent: { increment: 1 },
      },
    });

    return {
      balance: updated,
      transactionType: ComplimentTransactionType.PACKAGE_SEND,
    };
  }

  if (balance.purchasedCompliments > 0) {
    const updated = await prisma.userComplimentBalance.update({
      where: { userId },
      data: {
        purchasedCompliments: { decrement: 1 },
        totalCompliments: { decrement: 1 },
        totalComplimentsSent: { increment: 1 },
      },
    });

    return {
      balance: updated,
      transactionType: ComplimentTransactionType.PURCHASE_SEND,
    };
  }

  throw new Error("No compliments available");
};

export const createComplimentLedger = async (
  data: {
    userId: string;
    type: ComplimentTransactionType;
    quantity: number;
    complimentBalanceAfter: number;
  },
  prisma: Prisma.TransactionClient
) => {
  return prisma.complimentTransaction.create({
    data,
  });
};

export async function getComplimentBalanceByUserId(userId: string) {
  return prisma.userComplimentBalance.findUnique({
    where: {
      userId,
    },
    select: {
      totalCompliments: true,
      freeCompliments: true,
      purchasedCompliments: true,
      weeklyLimit: true,
      totalComplimentsSent: true,
      lastResetAt: true,
      nextResetAt: true,
    },
  });
};

export const getComplimentHistory = async (
  userId: string,
  query: ComplimentHistoryQuery,
  prisma: PrismaClient
) => {
  const page = query.page || 1;

  const limit = Math.min(
    query.limit || COMPLIMENT_CONSTANTS.DEFAULT_PAGE_SIZE,
    COMPLIMENT_CONSTANTS.MAX_PAGE_SIZE
  );

  const skip = (page - 1) * limit;

  const where: Prisma.UserComplimentWhereInput =
    query.type === "sent"
      ? {
          senderId: userId,
        }
      : query.type === "received"
      ? {
          receiverId: userId,
        }
      : {
          OR: [
            {
              senderId: userId,
            },
            {
              receiverId: userId,
            },
          ],
        };

  if (query.startDate || query.endDate) {
    where.createdAt = {};

    if (query.startDate) {
      (where.createdAt as Prisma.DateTimeFilter).gte = new Date(
        query.startDate
      );
    }

    if (query.endDate) {
      (where.createdAt as Prisma.DateTimeFilter).lte = new Date(
        query.endDate
      );
    }
  }

  const [compliments, totalItems] = await Promise.all([
    prisma.userCompliment.findMany({
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
        idea: {
          select: {
            id: true,
            text: true,
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),

    prisma.userCompliment.count({
      where,
    }),
  ]);

  return {
    compliments,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
      itemsPerPage: limit,
    },
  };
};

export const getComplimentDashboard = async (
  userId: string,
  prisma: PrismaClient
) => {
  const [complimentBalance, roseBalance, wallet] = await Promise.all([
    prisma.userComplimentBalance.findUnique({
      where: {
        userId,
      },
      select: {
        totalCompliments: true,
      },
    }),

    prisma.userRoseBalance.findUnique({
      where: {
        userId,
      },
      select: {
        totalRoses: true,
      },
    }),

    prisma.wallet.findUnique({
      where: {
        userId,
      },
      select: {
        balance: true,
      },
    }),
  ]);

  return {
    compliments: complimentBalance?.totalCompliments ?? 0,
    roses: roseBalance?.totalRoses ?? 0,
    balance: Number(wallet?.balance ?? 0),
  };
};