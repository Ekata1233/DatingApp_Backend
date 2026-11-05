import { Request, Response } from "express";
import { ZodError } from "zod";

import { sendEngagementService } from "./engagement.service";
import { sendEngagementSchema } from "./engagement.validation";
import { getIO } from "../../config/socket";
import { prisma } from "../../prisma/prismaClient";
import { emitEngagementProgress } from "../chat/socket/engagement-progress.socket";

export const sendEngagement = async (req: Request, res: Response) => {
  try {
    /* ------------------------------------------------------------------------ */
    /*                              Auth User                                   */
    /* ------------------------------------------------------------------------ */

    const senderId = (req as any).user.id;

    /* ------------------------------------------------------------------------ */
    /*                              Validation                                  */
    /* ------------------------------------------------------------------------ */

    const data = sendEngagementSchema.parse(req.body);

    /* ------------------------------------------------------------------------ */
    /*                              Service                                     */
    /* ------------------------------------------------------------------------ */

    const result = await sendEngagementService(senderId, data);

    /* ------------------------------------------------------------------------ */
    /*                    SOCKET.IO REAL-TIME MESSAGE                           */
    /* ------------------------------------------------------------------------ */

    try {
      const io = getIO();

      const receiverId = data.receiverId;
      const message = result.data?.message;

      if (message) {
        // ========================================
        // SEND MESSAGE TO RECEIVER
        // ========================================

        io.to(`user:${receiverId}`).emit("message:receive", message);
        io.to(`user:${senderId}`).emit("message:receive", message);

        // ==========================================
        // INITIAL ROSE & GIFT PROGRESS
        // ==========================================

        const conversationId = result.data?.conversationId;

        if (conversationId && (result.data?.rose || result.data?.gift)) {
          // ========================================
          // ROSE PROGRESS
          // ========================================

          const rose = result.data.rose
            ? await prisma.userRose.findUnique({
                where: {
                  id: result.data.rose.id,
                },
                select: {
                  id: true,
                  messagesSent: true,
                  requiredMessages: true,
                  isUnlocked: true,
                  expiresAt: true,
                },
              })
            : null;

          // ========================================
          // GIFT PROGRESS
          // ========================================

          const gift = result.data.gift
            ? await prisma.userGift.findUnique({
                where: {
                  id: result.data.gift.id,
                },
                select: {
                  id: true,
                  messagesSent: true,
                  requiredMessages: true,
                  isUnlocked: true,
                  expiresAt: true,
                  giftName: true,
                },
              })
            : null;

          // ========================================
          // EMIT PROGRESS TO CONVERSATION
          // ========================================

          if (rose || gift) {
            await emitEngagementProgress(io, conversationId, {
              rose,
              gift,
              redeemed: [],
            });
          }
        }
      }
    } catch (socketError) {
      // Socket failure should not affect
      // successful engagement transaction

      console.error("Engagement socket emission error:", socketError);
    }

    /* ------------------------------------------------------------------------ */
    /*                              Response                                    */
    /* ------------------------------------------------------------------------ */

    return res.status(201).json(result);
  } catch (error) {
    /* ------------------------------------------------------------------------ */
    /*                              Zod Error                                   */
    /* ------------------------------------------------------------------------ */

    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
        errors: error.flatten(),
      });
    }

    /* ------------------------------------------------------------------------ */
    /*                         Handle Business Logic Errors                     */
    /* ------------------------------------------------------------------------ */

    // Check if it's a known business error (like rose limit)
    if (error instanceof Error) {
      // You can check for specific error messages or use custom error classes
      if (error.message.includes("You can only send 3 roses per day")) {
        return res.status(400).json({
          success: false,
          message: error.message,
          errors: {
            fieldErrors: {
              rose: [error.message],
            },
          },
        });
      }

      // Return other business errors with proper format
      return res.status(400).json({
        success: false,
        message: error.message,
        errors: {
          fieldErrors: {},
        },
      });
    }

    /* ------------------------------------------------------------------------ */
    /*                         Forward Other Errors                             */
    /* ------------------------------------------------------------------------ */

    // Log the error for debugging
    console.error("Unexpected error in sendEngagement:", error);

    // Return a generic error response instead of throwing
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      errors: {
        fieldErrors: {},
      },
    });
  }
};
