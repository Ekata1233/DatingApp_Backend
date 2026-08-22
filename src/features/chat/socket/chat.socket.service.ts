// src/modules/chat/sockets/chat.socket.service.ts

import { Server, Socket } from "socket.io";

import { chatService } from "../chat.service";
import { messageService } from "../message/message.service";

import {
  ConversationUpdatePayload,
  JoinConversationSocketPayload,
  LeaveConversationSocketPayload,
  MessageDeliveredSocketPayload,
  MessageReadSocketPayload,
  SendMessageSocketPayload,
  TypingSocketPayload,
} from "./chat.socket.types";
import { MessageType } from "@prisma/client";
import { calculateAge } from "../chat.repository";
import { prisma } from "../../../prisma/prismaClient";

export const chatSocketService = {
  /**
   * Send a message.
   *
   * Flow:
   *
   * Socket
   *   ↓
   * messageService
   *   ↓
   * PostgreSQL
   *   ↓
   * Receiver socket
   */
  async sendMessage(
    io: Server,
    userId: string,
    payload: SendMessageSocketPayload,
  ) {
    /**
     * 1. Verify participant
     */
    await chatService.verifyConversationParticipant(
      payload.conversationId,
      userId,
    );

    /**
     * 2. Check whether this conversation
     *    already has messages.
     */
    const hasPreviousMessages = await chatService.hasPreviousMessages(
      payload.conversationId,
    );

    const isNew = !hasPreviousMessages;
    /**
     * Save message to database.
     */
    const message = await messageService.createMessage({
      userId,

      conversationId: payload.conversationId,
      content: payload.content,
      messageType: payload.messageType,
      mediaUrl: payload.mediaUrl,
      metadata: payload.metadata,
    });

    /**
     * Send message to conversation room.
     *
     * Every participant who joined this room
     * will receive the message.
     *
     * Example:
     *
     * conversation:123
     */
    io.to(`conversation:${payload.conversationId}`).emit(
      "message:receive",
      message,
    );

    /**
     * 4. Find the other participant.
     */
    const receiverId = await chatService.getOtherParticipant(
      payload.conversationId,
      userId,
    );

    const unreadCount = await chatService.getUnreadCount(
      payload.conversationId,
      receiverId,
    );

    // let user;

    // if (isNew) {
    //   user = await chatService.getOtherParticipantDetails(
    //     payload.conversationId,
    //     userId,
    //   );
    // }

    // /**
    //  * 5. Notify receiver's conversation list.
    //  */
    // io.to(`user:${receiverId}`).emit("conversation:update", {
    //   conversationId: payload.conversationId,
    //   isNew,
    //   ...(isNew && {
    //     user,
    //   }),
    //   lastMessage: {
    //     id: message.id,
    //     content: message.content,
    //     senderId: message.senderId,
    //     createdAt: message.createdAt,
    //   },

    //   senderId: userId,
    //   unreadCount,
    // });

    /**
     * 7. Get receiver details.
     *
     * We need this for conversation:update,
     * especially when the conversation is new.
     */
    const receiver = await chatService.getUserDetails(receiverId);

    if (!receiver) {
      throw new Error("Receiver not found");
    }
    /**
     * 8. Get dynamic match score.
     *
     * userId       = current sender
     * receiverId   = other participant
     */
    const compatibility = await prisma.userCompatibility.findFirst({
      where: {
        userId: userId,
        targetUserId: receiverId,
      },

      select: {
        targetUserId: true,
        score: true,
        percentage: true,
      },
    });

    /**
     * 9. Build user object exactly like
     *    findUserConversations()
     */
    const user = {
      id: receiver.id,
      fullName: receiver.full_name,
      age: calculateAge(receiver.birth_date),
      profilePhoto: receiver.photos?.[0]?.media_url ?? null,
      matchScore: compatibility?.percentage ?? 0,
      trustPercentage: 85,
      isOnline: true,
    };

    io.to(`user:${receiverId}`).emit("conversation:update", {
      conversationId: payload.conversationId,
      isNew,
      user,

      lastMessage: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        messageType: message.messageType,
        mediaUrl: message.mediaUrl,
        createdAt: message.createdAt,
        deliveredAt: message.deliveredAt,
        readAt: message.readAt,
      },

      senderId: userId,
      unreadCount,
      updatedAt: message.createdAt,
    });

    const sender = await chatService.getUserDetails(message.senderId);

    // ==========================================
    // SPECIAL INTERACTION EVENT
    // ==========================================

    if (
      payload.messageType === MessageType.ROSE ||
      payload.messageType === MessageType.GIFT ||
      payload.messageType === MessageType.COMPLIMENT
    ) {
      io.to(`user:${receiverId}`).emit("newMatch:receive", {
        id: message.id,

        conversationId: message.conversationId,

        senderId: message.senderId,

        receiverId,

        messageType: message.messageType,

        message: message.content,

        mediaUrl: message.mediaUrl,

        metadata: message.metadata,

        createdAt: message.createdAt,

        sender,
      });
    }

    /**
     * Return saved message to event handler.
     */
    return message;
  },

  /**
   * Join a conversation room.
   */
  async joinConversation(
    socket: any,
    userId: string,
    payload: JoinConversationSocketPayload,
  ) {
    /**
     * Verify that user belongs to conversation.
     */
    console.log("JOIN REQUEST");
    console.log("userId:", userId);
    console.log("conversationId:", payload.conversationId);

    await chatService.getMessages({
      userId,

      conversationId: payload.conversationId,

      limit: 1,
    });

    /**
     * Join room.
     */
    await socket.join(`conversation:${payload.conversationId}`);

    return {
      conversationId: payload.conversationId,

      joined: true,
    };
  },

  /**
   * Leave conversation room.
   */
  async leaveConversation(
    socket: any,
    payload: LeaveConversationSocketPayload,
  ) {
    await socket.leave(`conversation:${payload.conversationId}`);

    return {
      conversationId: payload.conversationId,

      left: true,
    };
  },

  /**
   * Start typing.
   */
  async startTyping(
    io: Server,
    userId: string,
    payload: TypingSocketPayload,
    socket: Socket,
  ) {
    /**
     * Don't need DB query for every keystroke.
     *
     * The socket user is already authenticated.
     */

    io.to(`conversation:${payload.conversationId}`)
      .except(socket.id)
      .emit("typing:start", {
        conversationId: payload.conversationId,

        userId,
      });

    return {
      success: true,
    };
  },

  /**
   * Stop typing.
   */
  async stopTyping(io: Server, userId: string, payload: TypingSocketPayload) {
    io.to(`conversation:${payload.conversationId}`).emit("typing:stop", {
      conversationId: payload.conversationId,

      userId,
    });

    return {
      success: true,
    };
  },

  /**
   * Mark message as delivered.
   */
  async markMessageDelivered(
    io: Server,
    userId: string,
    payload: MessageDeliveredSocketPayload,
  ) {
    const message = await messageService.markDelivered({
      userId,
      messageId: payload.messageId,
    });

    console.log("✅ MESSAGE DELIVERED:", {
      messageId: message.id,
      senderId: message.senderId,
      receiverUserId: userId,
      conversationId: message.conversationId,
      deliveredAt: message.deliveredAt,
    });

    const senderRoom = `user:${message.senderId}`;

    console.log("📡 EMITTING DELIVERY EVENT TO:", senderRoom);

    const socketsInRoom = await io.in(senderRoom).fetchSockets();

    console.log("👥 SOCKETS IN SENDER ROOM:", {
      room: senderRoom,
      count: socketsInRoom.length,
      sockets: socketsInRoom.map((s) => s.id),
    });

    io.to(senderRoom).emit("message:delivered", {
      messageId: message.id,
      conversationId: message.conversationId,
      deliveredAt: message.deliveredAt,
    });

    console.log("📡 DELIVERY EVENT EMITTED");

    return message;
  },

  /**
   * Mark message as read.
   */
  async markMessageRead(
    io: Server,
    userId: string,
    payload: MessageReadSocketPayload,
  ) {
    const message = await messageService.markRead({
      userId,

      messageId: payload.messageId,
    });

    /**
     * Notify participants.
     */
    io.to(`conversation:${message.conversationId}`).emit("message:read", {
      messageId: message.id,

      conversationId: message.conversationId,

      readAt: message.readAt,
    });

    return message;
  },

  /**
   * Mark complete conversation as read.
   */
  async markConversationRead(
    io: Server,
    userId: string,
    conversationId: string,
  ) {
    const result = await messageService.markConversationRead({
      userId,

      conversationId,
    });

    /**
     * Notify the conversation room.
     */
    io.to(`conversation:${conversationId}`).emit("conversation:read", {
      conversationId,
      userId,
      readAt: result.readAt,
      count: result.count,
    });

    return result;
  },
};

export const emitConversationUpdate = (
  io: Server,
  userId: string,
  payload: ConversationUpdatePayload,
) => {
  io.to(`user:${userId}`).emit("conversation:update", payload);
};
