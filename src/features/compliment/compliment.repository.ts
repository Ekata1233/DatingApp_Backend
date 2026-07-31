import { ComplimentTransactionType, Prisma, PrismaClient } from "@prisma/client";

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
