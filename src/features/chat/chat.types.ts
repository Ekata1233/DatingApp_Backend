// src/modules/chat/chat.types.ts

export type MessageType =
  | "TEXT"
  | "IMAGE"
  | "VIDEO"
  | "AUDIO";

export interface CreateConversationInput {
  userId: string;
  targetUserId: string;
}

export interface SendMessageInput {
  userId: string;
  conversationId: string;
  content?: string;
  messageType: MessageType;
  mediaUrl?: string;
}

export interface GetMessagesInput {
  userId: string;
  conversationId: string;
  cursor?: string;
  limit: number;
}

export interface GetConversationsInput {
  userId: string;
  cursor?: string;
  limit: number;
}

export interface MarkConversationReadInput {
  userId: string;
  conversationId: string;
}

export interface DeleteMessageInput {
  userId: string;
  messageId: string;
}

export interface ChatPagination {
  nextCursor: string | null;
  hasMore: boolean;
}