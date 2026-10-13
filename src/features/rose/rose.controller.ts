import { Request, Response } from "express";
import {
  sendRoseService,
  getRoseBalanceService,
  getRoseHistoryService,
  addPurchasedRosesService,
} from "./rose.service";

import {
  sendRoseSchema,
  getHistoryQuerySchema,
  addPurchasedRosesSchema,
  validate,
} from "./rose.validation";
import { getIO } from "../../config/socket";
import { prisma } from "../../prisma/prismaClient";

export const sendRoseController = async (req: Request, res: Response) => {
  try {
    const senderId = (req as any).user.id;
    const validatedData = validate(sendRoseSchema, req.body);

    const data = await sendRoseService(senderId, {
      ...validatedData,
    });

    // ========================================
    // MATCH POPUP DATA
    // ========================================

    let matchPopup = null;

    if (data.data.matched && data.data.matchId) {
      const [senderPhoto, receiverPhoto] = await Promise.all([
        prisma.userPhoto.findFirst({
          where: {
            user_id: senderId,
            is_primary: true,
            media_type: "IMAGE",
          },
          select: {
            media_url: true,
          },
        }),

        prisma.userPhoto.findFirst({
          where: {
            user_id: validatedData.receiverId,
            is_primary: true,
            media_type: "IMAGE",
          },
          select: {
            media_url: true,
          },
        }),
      ]);

      matchPopup = {
        title: "It's a Match! ❤️",

        message:
          "Two hearts beating to the same rhythm. Your connection is already written in the stars. ✨",

        users: {
          me: {
            userId: senderId,
            profilePhoto: senderPhoto?.media_url ?? null,
          },

          matchedUser: {
            userId: validatedData.receiverId,
            profilePhoto: receiverPhoto?.media_url ?? null,
          },
        },
      };
    }

    const receiverId = validatedData.receiverId;
    console.log("receiverId in sendRoseController : ", receiverId);
    // ========================================
    // SOCKET.IO
    // ========================================

    const io = getIO();

    const room = `user:${receiverId}`;

    const sockets = await io.in(room).fetchSockets();

    console.log("🔥 ROSE RECEIVER ROOM:", room);

    console.log(
      "🔥 SOCKETS IN RECEIVER ROOM:",
      sockets.map((socket) => ({
        socketId: socket.id,
        userId: (socket as any).user?.id,
      })),
    );

    io.to(`user:${receiverId}`).emit("message:receive", data.message);

    return res.status(201).json({
      success: true,
      message: data.message,

      data: {
        ...data.data,
        matchPopup,
      },
    });
  } catch (error: any) {
    console.error("Send Rose Error:", error.message);

    const errorMap: Record<string, string> = {
      USER_NOT_FOUND: "User not found",
      RECEIVER_NOT_FOUND: "Receiver not found",
      CANNOT_SEND_TO_SELF: "You cannot send a rose to yourself",
      INSUFFICIENT_ROSES: "You don't have enough roses",
      ALREADY_SENT: "Rose already sent",
      MATCH_NOT_FOUND: "You can only send roses to matched users",

      // Rose restrictions
      COOLDOWN_ACTIVE: "Please wait before sending another rose to this user",

      RATE_LIMIT_EXCEEDED: "You have reached your daily rose limit",

      SAME_USER_LIMIT: "You have reached the rose limit for this user",

      BLOCKED_USER: "You cannot send a rose to this user",

      ALREADY_MATCHED: "You are already matched with this user",

      // Wallet
      INSUFFICIENT_WALLET_BALANCE: "Insufficient wallet balance",
    };

    const statusCode = error.statusCode ?? error.status ?? 500;

    const isKnownError = statusCode >= 400 && statusCode < 500;

    return res.status(statusCode).json({
      success: false,
      message:
        errorMap[error.message] ||
        (isKnownError ? error.message : "Something went wrong"),
    });
  }
};

export const getRoseBalanceController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const data = await getRoseBalanceService(userId);

    return res.status(200).json({
      success: true,
      message: "Rose balance fetched successfully",
      data,
    });
  } catch (error: any) {
    console.error("Get Rose Balance Error:", error.message);

    return res.status(400).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getRoseHistoryController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const validatedQuery = validate(getHistoryQuerySchema, req.query);

    const data = await getRoseHistoryService(userId, validatedQuery);

    return res.status(200).json({
      success: true,
      message: "Rose history fetched successfully",
      data,
    });
  } catch (error: any) {
    console.error("Get Rose History Error:", error.message);

    const errorMap: Record<string, string> = {
      INVALID_PAGINATION: "Invalid pagination parameters",
    };

    return res.status(400).json({
      success: false,
      message: errorMap[error.message] || "Something went wrong",
    });
  }
};

export const addPurchasedRosesController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user.id;
    const validatedData = validate(addPurchasedRosesSchema, req.body);

    const data = await addPurchasedRosesService(userId, validatedData.amount);

    return res.status(200).json({
      success: true,
      message: "Purchased roses added successfully",
      data,
    });
  } catch (error: any) {
    console.error("Add Purchased Roses Error:", error.message);

    const errorMap: Record<string, string> = {
      INVALID_AMOUNT: "Invalid amount",
      USER_NOT_FOUND: "User not found",
    };

    return res.status(400).json({
      success: false,
      message: errorMap[error.message] || "Something went wrong",
    });
  }
};
