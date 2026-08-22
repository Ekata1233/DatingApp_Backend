// src/modules/chat/sockets/chat.socket.types.ts

import { Socket } from "socket.io";
import { MessageType, Prisma } from "@prisma/client";

/**
 * Authenticated Socket
 *
 * socketAuth middleware should attach userId
 * to the socket.
 */
export interface AuthenticatedSocket extends Socket {
  userId: string;
}

/**
 * Client -> Server
 *
 * Send message event payload.
 */
export interface SendMessageSocketPayload {
  conversationId: string;
  content?: string | null;
  messageType: MessageType;
  mediaUrl?: string | null;
  metadata?: Prisma.InputJsonValue | null;
}

/**
 * Client -> Server
 *
 * Typing event payload.
 */
export interface TypingSocketPayload {
  conversationId: string;
}

/**
 * Client -> Server
 *
 * Read message payload.
 */
export interface MessageReadSocketPayload {
  messageId: string;
}

/**
 * Client -> Server
 *
 * Delivered message payload.
 */
export interface MessageDeliveredSocketPayload {
  messageId: string;
}

/**
 * Client -> Server
 *
 * Join conversation payload.
 */
export interface JoinConversationSocketPayload {
  conversationId: string;
}

/**
 * Client -> Server
 *
 * Leave conversation payload.
 */
export interface LeaveConversationSocketPayload {
  conversationId: string;
}

/**
 * Socket error response.
 */
export interface SocketErrorPayload {
  message: string;
  code?: string;
}

/**
 * Typing event sent to receiver.
 */
export interface TypingEventPayload {
  conversationId: string;
  userId: string;
}

/**
 * Message delivered event.
 */
export interface MessageDeliveredEventPayload {
  messageId: string;
  conversationId: string;
  deliveredAt: Date;
}

/**
 * Message read event.
 */
export interface MessageReadEventPayload {
  messageId: string;
  conversationId: string;
  readAt: Date;
}

export interface ConversationUpdatePayload {
  conversationId: string;

  lastMessage: {
    id: string;
    content: string | null;
    senderId: string;
    createdAt: Date;
  };

  unreadCount: number;

  senderId: string;
}
