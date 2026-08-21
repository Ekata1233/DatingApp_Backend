// src/modules/chat/message/message.types.ts

import { MessageType, Prisma } from "@prisma/client";

export interface CreateMessageInput {
  userId: string;
  conversationId: string;
  content?: string | null;
  messageType: MessageType;
  mediaUrl?: string | null;
  metadata?: Prisma.InputJsonValue | null;
}

export interface GetMessagesInput {
  userId: string;
  conversationId: string;
  cursor?: string;
  limit: number;
}

export interface GetMessageInput {
  userId: string;
  messageId: string;
}

export interface DeleteMessageInput {
  userId: string;
  messageId: string;
}

export interface MarkMessageReadInput {
  userId: string;
  messageId: string;
}

export interface MarkMessagesReadInput {
  userId: string;
  conversationId: string;
}

export interface MarkMessageDeliveredInput {
  userId: string;
  messageId: string;
}

export interface MessagePagination {
  hasMore: boolean;
  nextCursor: string | null;
}