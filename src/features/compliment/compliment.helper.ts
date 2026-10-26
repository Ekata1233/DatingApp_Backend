import { MessageType, Prisma, StoreFeatureType, TargetType, TransactionSource, TransactionStatus, TransactionType } from "@prisma/client";
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

// export const createBundleCompliment = async (
//   senderId: string,
//   receiverId: string,
//   data: NonNullable<SendEngagementDTO["compliment"]>,
//   targetType: SendEngagementDTO["targetType"],
//   targetId: SendEngagementDTO["targetId"],
//   tx: Prisma.TransactionClient
// ) => {
//   const {
//     ideaId,
//     message,
//   } = data;

//   /* -------------------------------------------------------------------------- */
//   /*                        Validate Compliment Idea                            */
//   /* -------------------------------------------------------------------------- */

//   let complimentIdeaText: string | null = null;

//   if (ideaId) {
//     const idea = await tx.complimentIdea.findUnique({
//       where: {
//         id: ideaId,
//       },
//       select: {
//         id: true,
//         text: true,
//       },
//     });

//     if (!idea) {
//       throw new AppError(
//         404,
//         COMPLIMENT_CONSTANTS.ERRORS.INVALID_COMPLIMENT_TYPE
//       );
//     }

//     complimentIdeaText = idea.text;
//   }

//   /* -------------------------------------------------------------------------- */
//   /*                         Validate Message                                    */
//   /* -------------------------------------------------------------------------- */

//   if (!ideaId && !message) {
//     throw new AppError(
//       400,
//       "Either ideaId or message is required"
//     );
//   }

//   const chatContent = message ?? complimentIdeaText;

//   if (!chatContent) {
//     throw new AppError(
//       400,
//       "Compliment message content is required."
//     );
//   }

//   /* -------------------------------------------------------------------------- */
//   /*                         Target Validation                                   */
//   /* -------------------------------------------------------------------------- */

//   if (
//     (targetType === "PHOTO" || targetType === "PROMPT") &&
//     !targetId
//   ) {
//     throw new AppError(
//       400,
//       "TARGET_ID_REQUIRED"
//     );
//   }

//   if (
//     targetId &&
//     targetType !== "PHOTO" &&
//     targetType !== "PROMPT"
//   ) {
//     throw new AppError(
//       400,
//       "TARGET_ID_NOT_ALLOWED"
//     );
//   }

//   /* -------------------------------------------------------------------------- */
//   /*                         Check Compliment Balance                            */
//   /* -------------------------------------------------------------------------- */

//   const balance = await getComplimentBalance(
//     senderId,
//     tx
//   );

//   if (!balance) {
//     throw new AppError(
//       404,
//       "Compliment balance not found"
//     );
//   }

//   if (balance.totalCompliments <= 0) {
//     throw new AppError(
//       400,
//       COMPLIMENT_CONSTANTS.ERRORS
//         .NO_COMPLIMENTS_AVAILABLE
//     );
//   }

//   /* -------------------------------------------------------------------------- */
//   /*                              Deduct Balance                                 */
//   /* -------------------------------------------------------------------------- */

//   const deduction = await deductCompliment(
//     senderId,
//     tx
//   );

//   /* -------------------------------------------------------------------------- */
//   /*                         Create User Compliment                              */
//   /* -------------------------------------------------------------------------- */

//   const compliment = await createUserCompliment(
//     {
//       senderId,
//       receiverId,
//       ideaId: ideaId ?? null,
//       message: message ?? null,
//       targetType,
//       targetId,
//     },
//     tx
//   );

//   /* -------------------------------------------------------------------------- */
//   /*                              Create Ledger                                  */
//   /* -------------------------------------------------------------------------- */

//   await createComplimentLedger(
//     {
//       userId: senderId,
//       type: deduction.transactionType,
//       quantity: 1,
//       complimentBalanceAfter:
//         deduction.balance.totalCompliments,
//     },
//     tx
//   );

//   return {
//     compliment,
//     chatContent,
//     remainingBalance: {
//       totalCompliments:
//         deduction.balance.totalCompliments,
//       lastResetAt:
//         balance.lastResetAt,
//     },
//   };
// };

export const deductComplimentAmountFromWallet = async (
  userId: string,
  amount: number,
  tx: Prisma.TransactionClient
) => {
  const wallet = await tx.wallet.findUnique({
    where: {
      userId,
    },
  });

  if (!wallet) {
    throw new AppError(
      400,
      "You don't have enough compliments or wallet balance"
    );
  }

  const amountDecimal = new Prisma.Decimal(amount);

  if (wallet.balance.lessThan(amountDecimal)) {
    throw new AppError(
      400,
      `Insufficient wallet balance. ₹${amount} is required to send a compliment.`
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

  const walletTransaction =
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: amountDecimal,
        type: TransactionType.PURCHASE,
        status: TransactionStatus.SUCCESS,
        source: TransactionSource.WALLET_COMPLIMENT,
        description: "Compliment purchase",
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


export const createBundleCompliment = async (
  senderId: string,
  receiverId: string,
  data: NonNullable<SendEngagementDTO["compliment"]>,
  targetType: SendEngagementDTO["targetType"],
  targetId: SendEngagementDTO["targetId"],
  tx: Prisma.TransactionClient
) => {
  const { ideaId, message } = data;

  // ============================================
  // 1. VALIDATE IDEA OR MESSAGE
  // ============================================

  if (!ideaId && !message?.trim()) {
    throw new AppError(
      400,
      "Either ideaId or message is required"
    );
  }

  // ============================================
  // 2. GET PREDEFINED COMPLIMENT TEXT
  // ============================================

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
        COMPLIMENT_CONSTANTS.ERRORS
          .INVALID_COMPLIMENT_TYPE
      );
    }

    complimentIdeaText = idea.text;
  }

  // Custom message takes priority.
  const chatContent =
    message?.trim() || complimentIdeaText;

  if (!chatContent) {
    throw new AppError(
      400,
      "Compliment message content is required."
    );
  }

  // ============================================
  // 3. TARGET VALIDATION
  // ============================================

  if (
    (targetType === "PHOTO" ||
      targetType === "PROMPT") &&
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

  // ============================================
  // 4. CHECK COMPLIMENT BALANCE
  // ============================================

  const complimentBalance =
    await getComplimentBalance(senderId, tx);
// ============================================
// GET DYNAMIC COMPLIMENT PRICE
// ============================================

const complimentFeature =
  await tx.storeFeature.findUnique({
    where: {
      feature: StoreFeatureType.COMPLIMENT_SEND_COST,
    },
    select: {
      intValue: true,
      enabled: true,
    },
  });

if (
  !complimentFeature ||
  !complimentFeature.enabled
) {
  throw new AppError(
    400,
    "Compliment sending is currently unavailable."
  );
}

if (
  complimentFeature.intValue === null ||
  complimentFeature.intValue < 0
) {
  throw new AppError(
    500,
    "Invalid compliment send cost configuration."
  );
}

const COMPLIMENT_PRICE =
  complimentFeature.intValue;

  let deduction:
    Awaited<ReturnType<typeof deductCompliment>> | null =
      null;

  let walletDeduction:
    Awaited<
      ReturnType<
        typeof deductComplimentAmountFromWallet
      >
    > | null = null;

  let paymentMethod:
    | "COMPLIMENT_BALANCE"
    | "WALLET";

  // ============================================
  // 5. COMPLIMENT BALANCE FIRST
  // ============================================

  if (
    complimentBalance &&
    complimentBalance.totalCompliments > 0
  ) {
    deduction = await deductCompliment(
      senderId,
      tx
    );

    paymentMethod = "COMPLIMENT_BALANCE";
  } else {
    // No compliments: wallet fallback
    walletDeduction =
      await deductComplimentAmountFromWallet(
        senderId,
        COMPLIMENT_PRICE,
        tx
      );

    paymentMethod = "WALLET";
  }

  // ============================================
  // 6. CREATE USER COMPLIMENT
  // ============================================

  const compliment = await createUserCompliment(
    {
      senderId,
      receiverId,
      ideaId: ideaId ?? null,
      message: message?.trim() ?? null,
      targetType: targetType ?? null,
      targetId: targetId ?? null,
    },
    tx
  );

  // ============================================
  // 7. COMPLIMENT LEDGER
  // ============================================

  if (deduction) {
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
  }

  // ============================================
  // 8. UPDATED BALANCE
  // ============================================

  const updatedBalance =
    await getComplimentBalance(senderId, tx);

  return {
    compliment,
    chatContent,

    payment: {
      method: paymentMethod,
      amount:
        paymentMethod === "WALLET"
          ? COMPLIMENT_PRICE
          : 0,
      walletBalance:
        walletDeduction?.wallet.balance.toString() ??
        null,
    },

    remainingBalance: {
      totalCompliments:
        updatedBalance?.totalCompliments ?? 0,
      lastResetAt:
        updatedBalance?.lastResetAt ?? null,
    },
  };
};
