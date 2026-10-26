import {
  MessageType,
  Prisma,
  PrismaClient,
  StoreFeatureType,
  TargetType,
  TransactionSource,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import {
  checkExistingRose,
  countTodayRoses,
  countTodayRosesToUser,
  createRoseLedger,
  createRoseTransaction,
  deductRose,
  getOrCreateBalance,
} from "./rose.repository";
import { prisma } from "../../prisma/prismaClient";
import { ROSE_CONSTANTS } from "./rose.constants";
import { AppError } from "./AppError";
import { SendEngagementDTO } from "../engagement/engagement.validation";

interface CreateRoseMessageData {
  conversationId: string;
  senderId: string;
  roseId: string;
  targetType?: TargetType | null;
  targetId?: string | null;
}

export const createRoseChatMessage = async (
  data: CreateRoseMessageData,
  tx: Prisma.TransactionClient,
) => {
  return tx.chatMessage.create({
    data: {
      conversationId: data.conversationId,
      senderId: data.senderId,
      content: null,
      messageType: MessageType.ROSE,
      roseId: data.roseId,
      metadata: {
        targetType: data.targetType,
        targetId: data.targetId,
      },
    },
  });
};

// export const validateRoseForBundle = async (
//   senderId: string,
//   receiverId: string
// ) => {

//   const todayRoses =
//     await countTodayRoses(
//       senderId,
//       prisma
//     );

//   if (
//     todayRoses >=
//     ROSE_CONSTANTS.MAX_ROSES_PER_DAY
//   ) {
//     throw new AppError(
//       429,
//       ROSE_CONSTANTS.ERRORS.RATE_LIMIT_EXCEEDED
//     );
//   }

//   const rosesToUser =
//     await countTodayRosesToUser(
//       senderId,
//       receiverId,
//       prisma
//     );

//   if (
//     rosesToUser >=
//     ROSE_CONSTANTS.MAX_ROSES_TO_SAME_USER_PER_DAY
//   ) {
//     throw new AppError(
//       429,
//       ROSE_CONSTANTS.ERRORS.SAME_USER_LIMIT
//     );
//   }

//   const cooldownTime = new Date(
//     Date.now() -
//       ROSE_CONSTANTS.ROSE_COOLDOWN_PERIOD
//   );

//   const lastRose =
//     await checkExistingRose(
//       senderId,
//       receiverId,
//       cooldownTime,
//       prisma
//     );

//   if (lastRose) {
//     throw new AppError(
//       429,
//       ROSE_CONSTANTS.ERRORS.COOLDOWN_ACTIVE
//     );
//   }

//   const balance =
//     await getOrCreateBalance(
//       senderId,
//       prisma
//     );

//   if (balance.totalRoses <= 0) {
//     throw new AppError(
//       400,
//       ROSE_CONSTANTS.ERRORS
//         .PURCHASED_ROSES_UNAVAILABLE
//     );
//   }
// };

// export const createBundleRose = async (
//   senderId: string,
//   receiverId: string,
//   data: NonNullable<SendEngagementDTO["rose"]>,
//   targetType: SendEngagementDTO["targetType"],
//   targetId: SendEngagementDTO["targetId"],
//   tx: Prisma.TransactionClient
// ) => {

//   const {
//   } = data;

//   // Daily limit
//   const todayRoses =
//     await countTodayRoses(senderId, prisma);

//   if (
//     todayRoses >=
//     ROSE_CONSTANTS.MAX_ROSES_PER_DAY
//   ) {
//     throw new AppError(
//       429,
//       ROSE_CONSTANTS.ERRORS.RATE_LIMIT_EXCEEDED
//     );
//   }

//   // Same user limit
//   const rosesToUser =
//     await countTodayRosesToUser(
//       senderId,
//       receiverId,
//       prisma
//     );

//   if (
//     rosesToUser >=
//     ROSE_CONSTANTS.MAX_ROSES_TO_SAME_USER_PER_DAY
//   ) {
//     throw new AppError(
//       429,
//       ROSE_CONSTANTS.ERRORS.SAME_USER_LIMIT
//     );
//   }

//   // Cooldown
//   const cooldownTime = new Date(
//     Date.now() -
//       ROSE_CONSTANTS.ROSE_COOLDOWN_PERIOD
//   );

//   const lastRose =
//     await checkExistingRose(
//       senderId,
//       receiverId,
//       cooldownTime,
//       prisma
//     );

//   if (lastRose) {
//     throw new AppError(
//       429,
//       ROSE_CONSTANTS.ERRORS.COOLDOWN_ACTIVE
//     );
//   }

//   // Required messages
//   const previousRoses =
//     await tx.userRose.count({
//       where: {
//         senderId,
//         receiverId,
//       },
//     });

//   let requiredMessages = 1;

//   if (previousRoses === 0) {
//     requiredMessages = 25;
//   } else if (previousRoses === 1) {
//     requiredMessages = 5;
//   }

//   // Expiry
//   const expiresAt = new Date(
//     Date.now() +
//       7 * 24 * 60 * 60 * 1000
//   );

//   // Balance
//   const balance =
//     await getOrCreateBalance(
//       senderId,
//       prisma
//     );

//   if (balance.totalRoses <= 0) {
//     throw new AppError(
//       400,
//       ROSE_CONSTANTS.ERRORS
//         .PURCHASED_ROSES_UNAVAILABLE
//     );
//   }

//   // Deduct
//   const deduction =
//     await deductRose(
//       senderId,
//       tx
//     );

//   // Create Rose
//   const rose =
//     await createRoseTransaction(
//       {
//         senderId,
//         receiverId,
//         targetType,
//         targetId,
//         requiredMessages,
//         expiresAt,
//       },
//       tx
//     );

//   // Ledger
//   await createRoseLedger(
//     {
//       userId: senderId,
//       type: deduction.transactionType,
//       quantity: 1,
//       roseBalanceAfter:
//         deduction.balance.totalRoses,
//     },
//     tx
//   );

//   return {
//     roseId: rose.id,
//     rose,
//   };
// };

export const deductRoseAmountFromWallet = async (
  userId: string,
  amount: number,
  tx: Prisma.TransactionClient,
) => {
  const wallet = await tx.wallet.findUnique({
    where: {
      userId,
    },
  });

  if (!wallet) {
    throw new AppError(400, "You don't have enough roses or wallet balance");
  }

  const amountDecimal = new Prisma.Decimal(amount);

  if (wallet.balance.lessThan(amountDecimal)) {
    throw new AppError(
      400,
      `Insufficient wallet balance. ₹${amount} is required to send a Rose.`,
    );
  }

  const balanceBefore = wallet.balance;
  const balanceAfter = balanceBefore.minus(amountDecimal);

  const updatedWallet = await tx.wallet.update({
    where: {
      id: wallet.id,
    },
    data: {
      balance: balanceAfter,
    },
  });

  const walletTransaction = await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      amount: amountDecimal,
      type: TransactionType.PURCHASE,
      status: TransactionStatus.SUCCESS,
      source: TransactionSource.WALLET_ROSE,
      description: "Rose purchase",
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

export const validateRoseForBundle = async (
  senderId: string,
  receiverId: string,
) => {
  const todayRoses = await countTodayRoses(senderId, prisma);

  if (todayRoses >= ROSE_CONSTANTS.MAX_ROSES_PER_DAY) {
    throw new AppError(429, ROSE_CONSTANTS.ERRORS.RATE_LIMIT_EXCEEDED);
  }

  const rosesToUser = await countTodayRosesToUser(senderId, receiverId, prisma);

  if (rosesToUser >= ROSE_CONSTANTS.MAX_ROSES_TO_SAME_USER_PER_DAY) {
    throw new AppError(429, ROSE_CONSTANTS.ERRORS.SAME_USER_LIMIT);
  }

  const cooldownTime = new Date(
    Date.now() - ROSE_CONSTANTS.ROSE_COOLDOWN_PERIOD,
  );

  const lastRose = await checkExistingRose(
    senderId,
    receiverId,
    cooldownTime,
    prisma,
  );

  if (lastRose) {
    throw new AppError(429, ROSE_CONSTANTS.ERRORS.COOLDOWN_ACTIVE);
  }

  // Do not reject when rose balance is zero.
  // The wallet fallback is handled in createBundleRose.
};

export const createBundleRose = async (
  senderId: string,
  receiverId: string,
  data: NonNullable<SendEngagementDTO["rose"]>,
  targetType: SendEngagementDTO["targetType"],
  targetId: SendEngagementDTO["targetId"],
  tx: Prisma.TransactionClient,
) => {
  const roseFeature = await tx.storeFeature.findUnique({
    where: {
      feature: StoreFeatureType.ROSE_SEND_COST,
    },
    select: {
      intValue: true,
      enabled: true,
    },
  });

  if (!roseFeature || !roseFeature.enabled) {
    throw new AppError(400, "Rose sending is currently unavailable.");
  }

  if (roseFeature.intValue === null || roseFeature.intValue < 0) {
    throw new AppError(500, "Invalid rose send cost configuration.");
  }

  const ROSE_PRICE = roseFeature.intValue || 120;
  // Validate limits inside transaction.
  const todayRoses = await countTodayRoses(
    senderId,
    tx as unknown as PrismaClient,
  );

  if (todayRoses >= ROSE_CONSTANTS.MAX_ROSES_PER_DAY) {
    throw new AppError(429, ROSE_CONSTANTS.ERRORS.RATE_LIMIT_EXCEEDED);
  }

  const rosesToUser = await countTodayRosesToUser(
    senderId,
    receiverId,
    tx as unknown as PrismaClient,
  );

  if (rosesToUser >= ROSE_CONSTANTS.MAX_ROSES_TO_SAME_USER_PER_DAY) {
    throw new AppError(429, ROSE_CONSTANTS.ERRORS.SAME_USER_LIMIT);
  }

  const cooldownTime = new Date(
    Date.now() - ROSE_CONSTANTS.ROSE_COOLDOWN_PERIOD,
  );

  const lastRose = await checkExistingRose(
    senderId,
    receiverId,
    cooldownTime,
    tx as unknown as PrismaClient,
  );

  if (lastRose) {
    throw new AppError(429, ROSE_CONSTANTS.ERRORS.COOLDOWN_ACTIVE);
  }

  // Required messages
  // const previousRoses = await tx.userRose.count({
  //   where: {
  //     senderId,
  //     receiverId,
  //   },
  // });

  // const requiredMessages =
  //   previousRoses === 0 ? 25 : previousRoses === 1 ? 5 : 1;

  const [previousRoses, previousGifts] = await Promise.all([
    tx.userRose.count({
      where: { senderId, receiverId },
    }),
    tx.userGift.count({
      where: { senderId, receiverId },
    }),
  ]);

  const totalPrevious = previousRoses + previousGifts;

  const requiredMessages =
    totalPrevious === 0 ? 25 : totalPrevious === 1 ? 5 : 1;

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Rose balance
  const balance = await getOrCreateBalance(
    senderId,
    tx as unknown as PrismaClient,
  );

  let paymentMethod: "ROSE_BALANCE" | "WALLET";

  let deduction: Awaited<ReturnType<typeof deductRose>> | null = null;

  let walletDeduction: Awaited<
    ReturnType<typeof deductRoseAmountFromWallet>
  > | null = null;

  if (balance.totalRoses > 0) {
    deduction = await deductRose(senderId, tx);

    paymentMethod = "ROSE_BALANCE";
  } else {
    walletDeduction = await deductRoseAmountFromWallet(
      senderId,
      ROSE_PRICE,
      tx,
    );

    paymentMethod = "WALLET";
  }

  const rose = await createRoseTransaction(
    {
      senderId,
      receiverId,
      targetType: targetType ?? null,
      targetId: targetId ?? null,
      requiredMessages,
      expiresAt,
    },
    tx,
  );

  // Create ledger only when rose balance is used.
  if (deduction) {
    await createRoseLedger(
      {
        userId: senderId,
        type: deduction.transactionType,
        quantity: 1,
        roseBalanceAfter: deduction.balance.totalRoses,
      },
      tx,
    );
  }

  const updatedBalance = await getOrCreateBalance(
    senderId,
    tx as unknown as PrismaClient,
  );

  return {
    roseId: rose.id,
    rose,

    payment: {
      method: paymentMethod,
      amount: paymentMethod === "WALLET" ? ROSE_PRICE : 0,
      walletBalance: walletDeduction?.wallet.balance.toString() ?? null,
    },

    remainingBalance: {
      totalRoses: updatedBalance.totalRoses,
      lastResetAt: updatedBalance.lastResetAt,
    },
  };
};
