import { prisma } from "../../prisma/prismaClient";
import { AppError } from "../rose/AppError";
import { checkBlockedStatus, checkMatch } from "../rose/rose.repository";
import { COMPLIMENT_CONSTANTS } from "./compliment.constant";
import { createComplimentLedger, createUserCompliment, deductCompliment, getComplimentBalance, getComplimentBalanceByUserId, getComplimentDashboard, getComplimentHistory } from "./compliment.repository";
import { ComplimentBalancebyIdResponse, ComplimentBalanceResponse, ComplimentHistoryQuery, SendComplimentDto, SendComplimentResponse } from "./compliment.types";


export const sendComplimentService = async (
    senderId: string,
    data: SendComplimentDto
): Promise<SendComplimentResponse> => {
    const { receiverId, ideaId, message } = data;

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

    /* -------------------------------------------------------------------------- */
    /*                             Execute Transaction                            */
    /* -------------------------------------------------------------------------- */

    return prisma.$transaction(async (tx) => {
        const deduction = await deductCompliment(senderId, tx);

        const compliment = await createUserCompliment(
            {
                senderId,
                receiverId,
                ideaId,
                message,
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
                full_name: sender.full_name?? " ",
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