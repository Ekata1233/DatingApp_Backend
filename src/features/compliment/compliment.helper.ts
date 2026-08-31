import { MessageType, Prisma, TargetType } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";
import { SendEngagementDTO } from "../engagement/engagement.validation";
import { AppError } from "../rose/AppError";
import { COMPLIMENT_CONSTANTS } from "./compliment.constant";
import { createComplimentLedger, createUserCompliment, deductCompliment, getComplimentBalance } from "./compliment.repository";

interface CreateComplimentMessageData {
  conversationId: string;
  senderId: string;
  complimentId: string;
  targetType?: TargetType | null;
  targetId?: string | null;
  content: string;
}

export const createComplimentChatMessage = async (
  data: CreateComplimentMessageData,
  tx: Prisma.TransactionClient = prisma
) => {
  return tx.chatMessage.create({
    data: {
      conversationId: data.conversationId,
      senderId: data.senderId,
      content: data.content,
      messageType: MessageType.COMPLIMENT,
      complimentId: data.complimentId,
      metadata: {
        complimentId: data.complimentId,
        targetType: data.targetType ?? null,
        targetId: data.targetId ?? null,
      },
    },
  });
};



export const createBundleCompliment = async (
  senderId: string,
  receiverId: string,
  data: NonNullable<SendEngagementDTO["compliment"]>,
  tx: Prisma.TransactionClient
) => {
  const {
    ideaId,
    message,
    targetType = null,
    targetId = null,
  } = data;

  /* -------------------------------------------------------------------------- */
  /*                        Validate Compliment Idea                            */
  /* -------------------------------------------------------------------------- */

  let complimentIdeaText: string | null = null;

  if (ideaId) {
    const idea = await tx.complimentIdea.findUnique({
      where: {
        id: ideaId,
      },
      select: {
        id: true,
        text: true,
      },
    });

    if (!idea) {
      throw new AppError(
        404,
        COMPLIMENT_CONSTANTS.ERRORS.INVALID_COMPLIMENT_TYPE
      );
    }

    complimentIdeaText = idea.text;
  }

  /* -------------------------------------------------------------------------- */
  /*                         Validate Message                                    */
  /* -------------------------------------------------------------------------- */

  if (!ideaId && !message) {
    throw new AppError(
      400,
      "Either ideaId or message is required"
    );
  }

  const chatContent = message ?? complimentIdeaText;

  if (!chatContent) {
    throw new AppError(
      400,
      "Compliment message content is required."
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                         Target Validation                                   */
  /* -------------------------------------------------------------------------- */

  if (
    (targetType === "PHOTO" || targetType === "PROMPT") &&
    !targetId
  ) {
    throw new AppError(
      400,
      "TARGET_ID_REQUIRED"
    );
  }

  if (
    targetId &&
    targetType !== "PHOTO" &&
    targetType !== "PROMPT"
  ) {
    throw new AppError(
      400,
      "TARGET_ID_NOT_ALLOWED"
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                         Check Compliment Balance                            */
  /* -------------------------------------------------------------------------- */

  const balance = await getComplimentBalance(
    senderId,
    tx
  );

  if (!balance) {
    throw new AppError(
      404,
      "Compliment balance not found"
    );
  }

  if (balance.totalCompliments <= 0) {
    throw new AppError(
      400,
      COMPLIMENT_CONSTANTS.ERRORS
        .NO_COMPLIMENTS_AVAILABLE
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                              Deduct Balance                                 */
  /* -------------------------------------------------------------------------- */

  const deduction = await deductCompliment(
    senderId,
    tx
  );

  /* -------------------------------------------------------------------------- */
  /*                         Create User Compliment                              */
  /* -------------------------------------------------------------------------- */

  const compliment = await createUserCompliment(
    {
      senderId,
      receiverId,
      ideaId: ideaId ?? null,
      message: message ?? null,
      targetType,
      targetId,
    },
    tx
  );

  /* -------------------------------------------------------------------------- */
  /*                              Create Ledger                                  */
  /* -------------------------------------------------------------------------- */

  await createComplimentLedger(
    {
      userId: senderId,
      type: deduction.transactionType,
      quantity: 1,
      complimentBalanceAfter:
        deduction.balance.totalCompliments,
    },
    tx
  );

  return {
    compliment,
    chatContent,
    remainingBalance: {
      totalCompliments:
        deduction.balance.totalCompliments,
      lastResetAt:
        balance.lastResetAt,
    },
  };
};