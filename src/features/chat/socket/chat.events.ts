// src/modules/chat/sockets/chat.events.ts

import { Server } from "socket.io";

import { AuthenticatedSocket } from "./chat.socket.types";

import {
  JoinConversationSocketPayload,
  LeaveConversationSocketPayload,
  MessageDeliveredSocketPayload,
  MessageReadSocketPayload,
  SendMessageSocketPayload,
  TypingSocketPayload,
} from "./chat.socket.types";

import { chatSocketService } from "./chat.socket.service";
import {
  conversationJoinRateLimit,
  messageReadRateLimit,
  messageSendRateLimit,
  typingRateLimit,
} from "../../../middleware/rateLimit/socket.rateLimit";
import { chatService } from "../chat.service";

/**
 * Register all chat socket events.
 */
export const registerChatEvents = (
  io: Server,
  socket: AuthenticatedSocket,
  userId: string,
) => {
  /**
   * User ID comes from socket authentication.
   *
   * NEVER trust senderId from client.
   */

  console.log(`Registering chat events for user: ${userId}`);

  /**
   * ==========================================
   * JOIN CONVERSATION
   * ==========================================
   */
  socket.on(
    "conversation:join",
    async (payload: JoinConversationSocketPayload, callback?: Function) => {
      try {
        if (!payload?.conversationId) {
          throw new Error("Conversation ID is required");
        }

        const result = await chatSocketService.joinConversation(
          socket,
          userId,
          payload,
        );

        const rateLimit = await conversationJoinRateLimit(userId);

        if (!rateLimit.allowed) {
          socket.emit("rate_limit:exceeded", {
            success: false,
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many conversation join requests.",
            action: "conversation-join",
            limit: rateLimit.limit,
            remaining: rateLimit.remaining,
            retryAfter: rateLimit.retryAfter,
          });

          return;
        }
        /**
         * Send confirmation to current user.
         */
        socket.emit("conversation:joined", result);

        console.log(
          `User ${userId} joined conversation ${payload.conversationId}`,
        );
        /**
         * Optional acknowledgement callback.
         */
        if (callback) {
          callback({
            success: true,
            data: result,
          });
        }
      } catch (error) {
        handleSocketError(socket, error, callback);
      }
    },
  );

  /**
   * ==========================================
   * LEAVE CONVERSATION
   * ==========================================
   */
  socket.on(
    "conversation:leave",
    async (payload: LeaveConversationSocketPayload, callback?: Function) => {
      try {
        if (!payload?.conversationId) {
          throw new Error("Conversation ID is required");
        }

        const result = await chatSocketService.leaveConversation(
          socket,
          payload,
        );

        socket.emit("conversation:left", result);

        if (callback) {
          callback({
            success: true,
            data: result,
          });
        }
      } catch (error) {
        handleSocketError(socket, error, callback);
      }
    },
  );

  /**
   * ==========================================
   * SEND MESSAGE
   * ==========================================
   */
  socket.on(
    "message:send",
    async (payload: SendMessageSocketPayload, callback?: Function) => {
      try {
        if (!payload?.conversationId) {
          throw new Error("Conversation ID is required");
        }

        if (!payload?.messageType) {
          throw new Error("Message type is required");
        }

        const rateLimit = await messageSendRateLimit(userId);

        console.log("MESSAGE RATE LIMIT:", {
          userId,
          allowed: rateLimit.allowed,
          remaining: rateLimit.remaining,
          limit: rateLimit.limit,
          retryAfter: rateLimit.retryAfter,
        });

        if (!rateLimit.allowed) {
          socket.emit("rate_limit:exceeded", {
            success: false,
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many messages. Please try again later.",
            action: "message-send",
            limit: rateLimit.limit,
            remaining: rateLimit.remaining,
            retryAfter: rateLimit.retryAfter,
          });

          return;
        }
        /**
         * IMPORTANT:
         *
         * senderId is NOT received from client.
         *
         * We use:
         *
         * socket.userId
         */
        const message = await chatSocketService.sendMessage(
          io,
          userId,
          payload,
        );

        /**
         * Acknowledge sender.
         */
        if (callback) {
          callback({
            success: true,
            data: message,
          });
        }
      } catch (error) {
        handleSocketError(socket, error, callback);
      }
    },
  );

  /**
   * ==========================================
   * TYPING START
   * ==========================================
   */
  // socket.on(
  //   "typing:start",
  //   async (
  //     payload: TypingSocketPayload
  //   ) => {
  //     try {
  //       if (!payload?.conversationId) {
  //         return;
  //       }

  //       const rateLimit =
  //         await typingRateLimit(userId);

  //       if (!rateLimit.allowed) {
  //         return;
  //       }
  //       /**
  //        * Verify user is actually part of
  //        * the conversation.
  //        */
  //       await chatSocketService.joinConversation(
  //         socket,
  //         userId,
  //         payload
  //       );

  //       /**
  //        * Broadcast typing event.
  //        */
  //       socket
  //         .to(
  //           `conversation:${payload.conversationId}`
  //         )
  //         .emit("typing:start", {
  //           conversationId:
  //             payload.conversationId,

  //           userId,
  //         });
  //     } catch (error) {
  //       handleSocketError(socket, error);
  //     }
  //   }
  // );

  socket.on("typing:start", async (payload: TypingSocketPayload) => {
    try {
      if (!payload?.conversationId) {
        return;
      }

      const rateLimit = await typingRateLimit(userId);

      if (!rateLimit.allowed) {
        return;
      }

      // Find other participants
      const participants = await chatService.getConversationReceivers(
        payload.conversationId,
        userId,
      );

      // Send typing event to their personal rooms
      for (const participant of participants) {
        io.to(`user:${participant.userId}`).emit("typing:start", {
          conversationId: payload.conversationId,
          userId,
        });
      }
    } catch (error) {
      handleSocketError(socket, error);
    }
  });

  /**
   * ==========================================
   * TYPING STOP
   * ==========================================
   */
  socket.on("typing:stop", async (payload: TypingSocketPayload) => {
    try {
      if (!payload?.conversationId) {
        return;
      }

      const participants = await chatService.getParticipants(
        userId,
        payload.conversationId,
      );

      for (const participant of participants) {
        io.to(`user:${participant.userId}`).emit("typing:stop", {
          conversationId: payload.conversationId,
          userId,
        });
      }
    } catch (error) {
      handleSocketError(socket, error);
    }
  });

  /**
   * ==========================================
   * MESSAGE DELIVERED
   * ==========================================
   */
  socket.on(
    "message:delivered",
    async (payload: MessageDeliveredSocketPayload, callback?: Function) => {
      try {
        if (!payload?.messageId) {
          throw new Error("Message ID is required");
        }

        const message = await chatSocketService.markMessageDelivered(
          io,
          userId,
          payload,
        );

        if (callback) {
          callback({
            success: true,
            data: message,
          });
        }
      } catch (error) {
        handleSocketError(socket, error, callback);
      }
    },
  );

  /**
   * ==========================================
   * MESSAGE READ
   * ==========================================
   */
  socket.on(
    "message:read",
    async (payload: MessageReadSocketPayload, callback?: Function) => {
      try {
        if (!payload?.messageId) {
          throw new Error("Message ID is required");
        }

        const rateLimit = await messageReadRateLimit(userId);

        if (!rateLimit.allowed) {
          socket.emit("rate_limit:exceeded", {
            success: false,
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many message read requests.",
            action: "message-read",
            limit: rateLimit.limit,
            remaining: rateLimit.remaining,
            retryAfter: rateLimit.retryAfter,
          });

          return;
        }

        const message = await chatSocketService.markMessageRead(
          io,
          userId,
          payload,
        );

        if (callback) {
          callback({
            success: true,
            data: message,
          });
        }
      } catch (error) {
        handleSocketError(socket, error, callback);
      }
    },
  );

  /**
   * ==========================================
   * CONVERSATION READ
   * ==========================================
   */
  socket.on(
    "conversation:read",
    async (
      payload: {
        conversationId: string;
      },
      callback?: Function,
    ) => {
      try {
        if (!payload?.conversationId) {
          throw new Error("Conversation ID is required");
        }

        const result = await chatSocketService.markConversationRead(
          io,
          userId,
          payload.conversationId,
        );

        if (callback) {
          callback({
            success: true,
            data: result,
          });
        }
      } catch (error) {
        handleSocketError(socket, error, callback);
      }
    },
  );

  /**
   * ==========================================
   * DISCONNECT
   * ==========================================
   */
  socket.on("disconnect", (reason) => {
    console.log(`Chat socket disconnected`, {
      userId,
      socketId: socket.id,
      reason,
    });
  });
};

/**
 * Common socket error handler.
 */
const handleSocketError = (
  socket: AuthenticatedSocket,
  error: unknown,
  callback?: Function,
) => {
  const message =
    error instanceof Error ? error.message : "Socket operation failed";

  console.error(`Socket error [${socket.userId}]:`, error);

  /**
   * Send error event.
   */
  socket.emit("socket:error", {
    message,
  });

  /**
   * Socket acknowledgement.
   */
  if (callback) {
    callback({
      success: false,
      message,
    });
  }
};
