// rose.service.ts
import { prisma } from "../../prisma/prismaClient";
import {
  getOrCreateBalance,
  deductRose,
  createRoseTransaction,
  checkExistingRose,
  countTodayRoses,
  countTodayRosesToUser,
  checkBlockedStatus,
  checkMatch,
  getRoseHistory,
  addPurchasedRoses,
  createRoseLedger,
} from './rose.repository';
import { ROSE_CONSTANTS } from './rose.constants';
import {
  SendRoseDTO,
  SendRoseResponse,
  RoseBalanceResponse,
  RoseHistoryQuery,
  PaginatedRoseHistory,
} from './rose.types';
import { AppError } from './AppError';
import { getOrCreateConversation } from "../chat/chat.helper";
import { createRoseChatMessage } from "./rose.helper";
import { createNotification } from "../notification/notification.service";

export const sendRoseService = async (
  senderId: string,
  data: SendRoseDTO
): Promise<SendRoseResponse> => {
  const { receiverId, targetType = null, targetId = null, } = data;

  // Validate not sending to self
  if (senderId === receiverId) {
    throw new AppError(400, ROSE_CONSTANTS.ERRORS.SELF_SEND);
  }

  // Check if users are blocked
  const isBlocked = await checkBlockedStatus(senderId, receiverId, prisma);
  if (isBlocked) {
    throw new AppError(403, ROSE_CONSTANTS.ERRORS.BLOCKED_USER);
  }

  // Check if already matched
  const isMatched = await checkMatch(senderId, receiverId, prisma);
  if (isMatched) {
    throw new AppError(400, ROSE_CONSTANTS.ERRORS.ALREADY_MATCHED);
  }

  // Check daily limits
  const todayRoses = await countTodayRoses(senderId, prisma);
  if (todayRoses >= ROSE_CONSTANTS.MAX_ROSES_PER_DAY) {
    throw new AppError(429, ROSE_CONSTANTS.ERRORS.RATE_LIMIT_EXCEEDED);
  }

  // Check same user daily limit
  const rosesToUser = await countTodayRosesToUser(senderId, receiverId, prisma);
  if (rosesToUser >= ROSE_CONSTANTS.MAX_ROSES_TO_SAME_USER_PER_DAY) {
    throw new AppError(429, ROSE_CONSTANTS.ERRORS.SAME_USER_LIMIT);
  }

  // Check cooldown period
  const cooldownTime = new Date(
    Date.now() - ROSE_CONSTANTS.ROSE_COOLDOWN_PERIOD
  );
  const lastRose = await checkExistingRose(
    senderId,
    receiverId,
    cooldownTime,
    prisma
  );
  if (lastRose) {
    throw new AppError(429, ROSE_CONSTANTS.ERRORS.COOLDOWN_ACTIVE);
  }

  //CALCULATE REQUIRED MSG FOR UNLOCK GIFT
  const previousRoses = await prisma.userRose.count({
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
  } else {
    requiredMessages = 1;
  }

  // EXPIRY TIME
  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  );

  // Get user balance
  const balance = await getOrCreateBalance(senderId, prisma);

  if (balance.totalRoses <= 0) {
    throw new AppError(
      400,
      ROSE_CONSTANTS.ERRORS.PURCHASED_ROSES_UNAVAILABLE
    );
  }

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

  // Execute transaction
  const result = await prisma.$transaction(async (tx) => {
    // Deduct rose from balance
    const deduction = await deductRose(senderId, tx);

    // Create rose transaction
    const rose = await createRoseTransaction(
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

    await createRoseLedger(
      {
        userId: senderId,
        type: deduction.transactionType,
        quantity: 1,
        roseBalanceAfter: deduction.balance.totalRoses,
      },
      tx
    );

    const conversation = await getOrCreateConversation(
      senderId,
      receiverId,
      tx
    );

    // 5. Create ROSE chat message
    const chatMessage = await createRoseChatMessage(
      {
        conversationId: conversation.id,
        senderId,
        roseId: rose.id,
        targetType: rose.targetType,
        targetId: rose.targetId,
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

    // Get updated balance
    const updatedBalance = await getOrCreateBalance(senderId, tx as any);

    if (!updatedBalance) {
      throw new AppError(500, 'Failed to retrieve updated balance');
    }

    // Log success
    console.log('Rose sent successfully', {
      senderId,
      receiverId,
      roseId: rose.id,
    });

    const sender = await tx.user.findUniqueOrThrow({
      where: {
        id: senderId,
      },
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
    });
    // Format response
    const roseResponse = {
      id: rose.id,
      senderId: rose.senderId,
      receiverId: rose.receiverId,
      createdAt: rose.createdAt,
      sender: {
        id: sender.id,
        full_name: sender.full_name ?? " ",
        photos: sender.photos.map(photo => photo.media_url),
      },
    };

    const balanceResponse: RoseBalanceResponse = {
      totalRoses: updatedBalance.totalRoses,
      lastResetAt: updatedBalance.lastResetAt,
    };

    return {
      success: true,
      message: ROSE_CONSTANTS.SUCCESS.PURCHASED_ROSE_USED,
      data: {
        rose: roseResponse,
        remainingBalance: balanceResponse,
      },
    };
  });

   // 🔔 Send notification AFTER transaction successfully commits
  createNotification({
    senderId,
    receiverId,
    type: "NEW_ROSE",
    title: "You received a Rose 🌹",
    message: "Someone sent you a rose 🌹",
    data: {
      roseId: result.data.rose.id,
      senderId,
      receiverId,
      targetType,
      targetId,
      type: "ROSE",
    },
  }).catch((error) => {
    console.error("Failed to send rose notification:", error);
  });

  return result;
};

export const getRoseBalanceService = async (
  userId: string
): Promise<RoseBalanceResponse> => {
  const balance = await getOrCreateBalance(userId, prisma);

  return {
    totalRoses: balance.totalRoses,
    lastResetAt: balance.lastResetAt,
  };
};

export const getRoseHistoryService = async (
  userId: string,
  query: RoseHistoryQuery
): Promise<PaginatedRoseHistory> => {
  return getRoseHistory(userId, query, prisma);
};

export const addPurchasedRosesService = async (
  userId: string,
  amount: number
): Promise<RoseBalanceResponse> => {
  if (amount <= 0) {
    throw new AppError(400, 'Amount must be positive');
  }

  const updatedBalance = await addPurchasedRoses(userId, amount, prisma);

  console.log('Purchased roses added', { userId, amount });

  return {
    totalRoses: updatedBalance.totalRoses,
    lastResetAt: updatedBalance.lastResetAt,
  };
};