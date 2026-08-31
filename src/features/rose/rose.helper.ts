import { MessageType, Prisma, TargetType } from "@prisma/client";
import { checkExistingRose, countTodayRoses, countTodayRosesToUser, createRoseLedger, createRoseTransaction, deductRose, getOrCreateBalance } from "./rose.repository";
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
  tx: Prisma.TransactionClient
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

export const validateRoseForBundle = async (
  senderId: string,
  receiverId: string
) => {

  const todayRoses =
    await countTodayRoses(
      senderId,
      prisma
    );

  if (
    todayRoses >=
    ROSE_CONSTANTS.MAX_ROSES_PER_DAY
  ) {
    throw new AppError(
      429,
      ROSE_CONSTANTS.ERRORS.RATE_LIMIT_EXCEEDED
    );
  }

  const rosesToUser =
    await countTodayRosesToUser(
      senderId,
      receiverId,
      prisma
    );

  if (
    rosesToUser >=
    ROSE_CONSTANTS.MAX_ROSES_TO_SAME_USER_PER_DAY
  ) {
    throw new AppError(
      429,
      ROSE_CONSTANTS.ERRORS.SAME_USER_LIMIT
    );
  }

  const cooldownTime = new Date(
    Date.now() -
      ROSE_CONSTANTS.ROSE_COOLDOWN_PERIOD
  );

  const lastRose =
    await checkExistingRose(
      senderId,
      receiverId,
      cooldownTime,
      prisma
    );

  if (lastRose) {
    throw new AppError(
      429,
      ROSE_CONSTANTS.ERRORS.COOLDOWN_ACTIVE
    );
  }

  const balance =
    await getOrCreateBalance(
      senderId,
      prisma
    );

  if (balance.totalRoses <= 0) {
    throw new AppError(
      400,
      ROSE_CONSTANTS.ERRORS
        .PURCHASED_ROSES_UNAVAILABLE
    );
  }
};

export const createBundleRose = async (
  senderId: string,
  receiverId: string,
  data: NonNullable<SendEngagementDTO["rose"]>,
  tx: Prisma.TransactionClient
) => {

  const {
    targetType = null,
    targetId = null,
  } = data;

  // Daily limit
  const todayRoses =
    await countTodayRoses(senderId, tx);

  if (
    todayRoses >=
    ROSE_CONSTANTS.MAX_ROSES_PER_DAY
  ) {
    throw new AppError(
      429,
      ROSE_CONSTANTS.ERRORS.RATE_LIMIT_EXCEEDED
    );
  }

  // Same user limit
  const rosesToUser =
    await countTodayRosesToUser(
      senderId,
      receiverId,
      tx
    );

  if (
    rosesToUser >=
    ROSE_CONSTANTS.MAX_ROSES_TO_SAME_USER_PER_DAY
  ) {
    throw new AppError(
      429,
      ROSE_CONSTANTS.ERRORS.SAME_USER_LIMIT
    );
  }

  // Cooldown
  const cooldownTime = new Date(
    Date.now() -
      ROSE_CONSTANTS.ROSE_COOLDOWN_PERIOD
  );

  const lastRose =
    await checkExistingRose(
      senderId,
      receiverId,
      cooldownTime,
      tx
    );

  if (lastRose) {
    throw new AppError(
      429,
      ROSE_CONSTANTS.ERRORS.COOLDOWN_ACTIVE
    );
  }

  // Required messages
  const previousRoses =
    await tx.userRose.count({
      where: {
        senderId,
        receiverId,
      },
    });

  let requiredMessages = 1;

  if (previousRoses === 0) {
    requiredMessages = 25;
  } else if (previousRoses === 1) {
    requiredMessages = 5;
  }

  // Expiry
  const expiresAt = new Date(
    Date.now() +
      7 * 24 * 60 * 60 * 1000
  );

  // Balance
  const balance =
    await getOrCreateBalance(
      senderId,
      tx
    );

  if (balance.totalRoses <= 0) {
    throw new AppError(
      400,
      ROSE_CONSTANTS.ERRORS
        .PURCHASED_ROSES_UNAVAILABLE
    );
  }

  // Deduct
  const deduction =
    await deductRose(
      senderId,
      tx
    );

  // Create Rose
  const rose =
    await createRoseTransaction(
      {
        senderId,
        receiverId,
        targetType,
        targetId,
        requiredMessages,
        expiresAt,
      },
      tx
    );

  // Ledger
  await createRoseLedger(
    {
      userId: senderId,
      type: deduction.transactionType,
      quantity: 1,
      roseBalanceAfter:
        deduction.balance.totalRoses,
    },
    tx
  );

  return {
    roseId: rose.id,
    rose,
  };
};