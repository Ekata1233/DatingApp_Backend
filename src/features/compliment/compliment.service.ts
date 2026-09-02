import { prisma } from "../../prisma/prismaClient";
import { getOrCreateConversation } from "../chat/chat.helper";
import { createNotification } from "../notification/notification.service";
import { AppError } from "../rose/AppError";
import { checkBlockedStatus, checkMatch } from "../rose/rose.repository";
import { COMPLIMENT_CONSTANTS } from "./compliment.constant";
import { createComplimentChatMessage } from "./compliment.helper";
import { createComplimentLedger, createUserCompliment, deductCompliment, getComplimentBalance, getComplimentBalanceByUserId, getComplimentDashboard, getComplimentHistory } from "./compliment.repository";
import { ComplimentBalancebyIdResponse, ComplimentBalanceResponse, ComplimentHistoryQuery, SendComplimentDto, SendComplimentResponse } from "./compliment.types";


export const sendComplimentService = async (
    senderId: string,
    data: SendComplimentDto
): Promise<SendComplimentResponse> => {
    const { receiverId, targetType = null, targetId = null, ideaId, message } = data;

    /* -------------------------------------------------------------------------- */
    /*                              Self Validation                               */
    /* -------------------------------------------------------------------------- */

    if (senderId === receiverId) {
        throw new AppError(400, COMPLIMENT_CONSTANTS.ERRORS.SELF_SEND);
    }

    /* -------------------------------------------------------------------------- */
    /*                             Block Validation                               */
    /* -------------------------------------------------------------------------- */

    const isBlocked = await checkBlockedStatus(senderId, receiverId, prisma);

    if (isBlocked) {
        throw new AppError(403, COMPLIMENT_CONSTANTS.ERRORS.BLOCKED_USER);
    }

    /* -------------------------------------------------------------------------- */
    /*                             Match Validation                               */
    /* -------------------------------------------------------------------------- */

    const isMatched = await checkMatch(senderId, receiverId, prisma);

    if (isMatched) {
        throw new AppError(
            400,
            COMPLIMENT_CONSTANTS.ERRORS.ALREADY_MATCHED
        );
    }

    /* -------------------------------------------------------------------------- */
    /*                       Validate Compliment Idea                             */
    /* -------------------------------------------------------------------------- */

    if (ideaId) {
        const idea = await prisma.complimentIdea.findUnique({
            where: { id: ideaId },
        });

        if (!idea) {
            throw new AppError(
                404,
                COMPLIMENT_CONSTANTS.ERRORS.INVALID_COMPLIMENT_TYPE
            );
        }
    }

    /* -------------------------------------------------------------------------- */
    /*                            Check User Balance                             */
    /* -------------------------------------------------------------------------- */

    const balance = await getComplimentBalance(senderId, prisma);

    if (!balance) {
        throw new AppError(404, "Compliment balance not found");
    }
    if (balance.totalCompliments <= 0) {
        throw new AppError(
            400,
            COMPLIMENT_CONSTANTS.ERRORS.NO_COMPLIMENTS_AVAILABLE
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

    /* -------------------------------------------------------------------------- */
    /*                             Execute Transaction                            */
    /* -------------------------------------------------------------------------- */

    if (!ideaId && !message) {
        throw new AppError(
            400,
            "Either ideaId or message is required"
        );
    }

    let complimentIdeaText: string | null = null;

    if (ideaId) {
        const idea = await prisma.complimentIdea.findUnique({
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

    const result = await prisma.$transaction(async (tx) => {
        const deduction = await deductCompliment(senderId, tx);

        const compliment = await createUserCompliment(
            {
                senderId,
                receiverId,
                ideaId: ideaId ?? null,
                message,
                targetType,
                targetId
            },
            tx
        );

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

        const conversation = await getOrCreateConversation(
            senderId,
            receiverId,
            tx
        );

        const chatContent = message ?? complimentIdeaText;
        if (!chatContent) {
            throw new AppError(
                400,
                "Compliment message content is required."
            );
        }

        // 5. Create ROSE chat message
        const chatMessage = await createComplimentChatMessage(
            {
                conversationId: conversation.id,
                senderId,
                complimentId: compliment.id,
                targetType: compliment.targetType,
                targetId: compliment.targetId,
                content: chatContent,
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

        const updatedBalance = await getComplimentBalance(senderId, tx);

        if (!updatedBalance) {
            throw new AppError(
                404,
                "Compliment balance not found."
            );
        }

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

        const complimentResponse = {
            id: compliment.id,
            senderId: compliment.senderId,
            receiverId: compliment.receiverId,
            ideaId: compliment.ideaId,
            message: compliment.message,
            status: compliment.status,
            createdAt: compliment.createdAt,

            sender: {
                id: sender.id,
                full_name: sender.full_name ?? " ",
                photos: sender.photos.map((photo) => photo.media_url),
            },
        };

        const balanceResponse: ComplimentBalanceResponse = {
            totalCompliments: updatedBalance.totalCompliments,
            lastResetAt: updatedBalance.lastResetAt,
        };

        return {
            success: true,
            message:
                COMPLIMENT_CONSTANTS.SUCCESS.COMPLIMENT_SENT,
            data: {
                compliment: complimentResponse,
                remainingBalance: balanceResponse,
            },
        };
    });

    // 🔔 Send notification AFTER transaction successfully commits
      createNotification({
        senderId,
        receiverId,
        type: "COMPLIMENT",
        title: "You received a Compliment 💬",
        message: "Someone sent you a compliment 💬",
        data: {
          complimentId: result.data.compliment.id,
          senderId,
          receiverId,
          targetType,
          targetId,
          type: "COMPLIMENT",
        },
      }).catch((error) => {
        console.error("Failed to send rose notification:", error);
      });

    return result;
};

export async function getComplimentBalanceService(
    userId: string
): Promise<ComplimentBalancebyIdResponse> {
    const balance = await getComplimentBalanceByUserId(userId);

    if (!balance) {
        throw new Error("Compliment balance not found.");
    }

    return balance;
}

export const getComplimentHistoryService = async (
    userId: string,
    query: ComplimentHistoryQuery
) => {
    return getComplimentHistory(userId, query, prisma);
};

export const getComplimentDashboardService = async (
    userId: string
) => {
    return getComplimentDashboard(userId, prisma);
};