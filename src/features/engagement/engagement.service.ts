import { MessageType } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";
import { getOrCreateConversation } from "../chat/chat.helper";
import { AppError } from "../rose/AppError";
import { checkBlockedStatus, checkMatch, getOrCreateBalance } from "../rose/rose.repository";
import { SendEngagementDTO } from "./engagement.validation";
import { SendEngagementResponse } from "./engagement.types";
import { createBundleRose, validateRoseForBundle } from "../rose/rose.helper";
import { createBundleCompliment } from "../compliment/compliment.helper";
import { createBundleGift } from "../gift/gift.helper";
import { updateEngagementProgress } from "./engagement.helper";

export const sendEngagementService = async (
    senderId: string,
    data: SendEngagementDTO
): Promise<SendEngagementResponse> => {
    const {
        receiverId,
        rose: roseData,
        compliment: complimentData,
        gift: giftData,
    } = data;

    // --------------------------------------------------
    // 1. BASIC VALIDATIONS
    // --------------------------------------------------

    if (senderId === receiverId) {
        throw new AppError(400, "CANNOT_SEND_TO_SELF");
    }

    // --------------------------------------------------
    // 2. BLOCK CHECK
    // --------------------------------------------------

    const isBlocked = await checkBlockedStatus(
        senderId,
        receiverId,
        prisma
    );

    if (isBlocked) {
        throw new AppError(403, "BLOCKED_USER");
    }

    // --------------------------------------------------
    // 3. MATCH CHECK
    // --------------------------------------------------

    const isMatched = await checkMatch(
        senderId,
        receiverId,
        prisma
    );

    if (isMatched) {
        throw new AppError(
            400,
            "ALREADY_MATCHED"
        );
    }

    // --------------------------------------------------
    // 4. ROSE-SPECIFIC VALIDATIONS
    // --------------------------------------------------

    if (roseData) {
        await validateRoseForBundle(
            senderId,
            receiverId
        );
    }

    // --------------------------------------------------
    // 5. TRANSACTION
    // --------------------------------------------------

    return prisma.$transaction(
        async (tx) => {

            let roseId: string | null = null;
            let complimentId: string | null = null;
            let giftId: string | null = null;

            // =================================================
            // ROSE
            // =================================================

            if (roseData) {

                const roseResult =
                    await createBundleRose(
                        senderId,
                        receiverId,
                        roseData,
                        tx
                    );

                console.log("rose result : ", roseResult)

                roseId = roseResult.roseId;
            }

            // =================================================
            // COMPLIMENT
            // =================================================

            if (complimentData) {

                const compliment =
                    await createBundleCompliment(
                        senderId,
                        receiverId,
                        complimentData,
                        tx
                    );

                console.log("compliment result : ", compliment)


                complimentId = compliment.compliment.id;
            }

            // =================================================
            // GIFT
            // =================================================

            if (giftData) {

                const gift =
                    await createBundleGift(
                        senderId,
                        receiverId,
                        giftData,
                        tx
                    );

                console.log("gift result : ", gift)


                giftId = gift.userGift.id;
            }

            // =================================================
            // CONVERSATION
            // =================================================

            const conversation =
                await getOrCreateConversation(
                    senderId,
                    receiverId,
                    tx
                );

            // =================================================
            // MESSAGE TYPE
            // =================================================

            const engagementCount =
                Number(!!roseId) +
                Number(!!complimentId) +
                Number(!!giftId);

            let messageType: MessageType;

            if (engagementCount > 1) {
                messageType = MessageType.ENGAGEMENT;
            } else if (roseId) {
                messageType = MessageType.ROSE;
            } else if (complimentId) {
                messageType = MessageType.COMPLIMENT;
            } else {
                messageType = MessageType.GIFT;
            }

            // =================================================
            // CREATE ONE CHAT MESSAGE
            // =================================================

            const chatMessage =
                await tx.chatMessage.create({
                    data: {
                        conversationId: conversation.id,
                        senderId,

                        messageType,

                        roseId,
                        complimentId,
                        giftId,

                        metadata: {
                            isBundle: true,
                        },
                    },

                    include: {
                        rose: true,
                        compliment: true,
                        gift: true,
                    },
                });

            // =================================================
            // PROGRESS +1 ONLY ONCE
            // =================================================

            // await updateEngagementProgress(
            //     tx,
            //     senderId,
            //     receiverId
            // );

            // =================================================
            // UPDATE CONVERSATION
            // =================================================

            await tx.conversation.update({
                where: {
                    id: conversation.id,
                },
                data: {
                    updatedAt: new Date(),
                },
            });

            // =================================================
            // BALANCE
            // =================================================

            const updatedBalance =
                await getOrCreateBalance(
                    senderId,
                    tx as any
                );

            // =================================================
            // RETURN
            // =================================================

            return {
                success: true,

                message:
                    "Engagement sent successfully",

                data: {
                    message: chatMessage,

                    remainingBalance: {
                        totalRoses:
                            updatedBalance.totalRoses,
                        lastResetAt:
                            updatedBalance.lastResetAt,
                    },
                },
            };
        }
    );
};