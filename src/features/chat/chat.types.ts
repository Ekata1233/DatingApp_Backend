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
  type?: MessageFilterType;
}

export interface GetConversationsInput {
  userId: string;
  cursor?: string;
  limit: number;
  type: ConversationFilter;
}
export type ConversationFilter =
  | "all"
  | "unread"
  | "online"
  | "nearby"
  | "date_invite"
  | "event"
  | "gift";

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

export interface UserPresenceParams {
  userId: string;
}

export type MessageFilterType =
  | "all"
  | "rose"
  | "gift"
  | "compliment"
  | "online"
  | "event"
  | "date";

  export interface ChatUserDetails {
  userId: string;
  name: string | null;
  age: number | null;
  packageType: string | null;
  isOnline: boolean;
  lastSeenAt: Date | null;
  isBlocked: boolean;
  matchScore: number | null;
  profileImage: string | null;
}

export interface ConversationDetailsResponse {
  conversationId: string;
  user: ChatUserDetails;
}