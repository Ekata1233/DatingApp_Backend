// src/modules/chat/chat.service.ts

import {
  CreateConversationInput,
  DeleteMessageInput,
  GetConversationsInput,
  GetMessagesInput,
  MarkConversationReadInput,
  SendMessageInput,
} from "./chat.types";

import { chatRepository } from "./chat.repository";
import { buildMessageProgress } from "./chat.helper";

export const chatService = {
  /**
   * Create or return existing conversation.
   */
  async createConversation(data: CreateConversationInput) {
    const { userId, targetUserId } = data;

    /**
     * User cannot create conversation with himself.
     */
    if (userId === targetUserId) {
      throw new Error("You cannot create a conversation with yourself");
    }

    /**
     * Check whether conversation already exists.
     */
    const existingConversation =
      await chatRepository.findConversationBetweenUsers(userId, targetUserId);

    if (existingConversation) {
      return existingConversation;
    }

    /**
     * Create new conversation.
     */
    return chatRepository.createConversation(userId, targetUserId);
  },

  /**
   * Get user's conversations.
   */
  async getConversations(data: GetConversationsInput) {
    const conversations = await chatRepository.findUserConversations(
      data.userId,
      data.cursor,
      data.limit,
      data.type,
    );

    const hasMore = conversations.length > data.limit;

    const items = hasMore ? conversations.slice(0, data.limit) : conversations;

    const nextCursor = hasMore
      ? (items[items.length - 1]?.conversationId ?? null)
      : null;

    return {
      items,
      pagination: {
        hasMore,
        nextCursor,
      },
    };
  },

  /**
   * Get messages from conversation.
   */
  async getMessages(data: GetMessagesInput) {
    /**
     * Verify user is participant.
     */
    const participant = await chatRepository.findParticipant(
      data.conversationId,
      data.userId,
    );

    if (!participant) {
      throw new Error("You are not a participant of this conversation");
    }

    const messages = await chatRepository.findMessages(
      data.conversationId,
      data.userId,
      data.cursor,
      data.limit,
      data.type ?? "all",
    );

    const hasMore = messages.length > data.limit;

    const items = hasMore ? messages.slice(0, data.limit) : messages;

    /** * Add progress information for Gift/Rose/Engagement messages. */ const itemsWithProgress = items.map((message) => { const progress = buildMessageProgress(message); return { ...message, progress, }; });

    const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

    return {
      items: itemsWithProgress,
      pagination: {
        hasMore,
        nextCursor,
      },
    };
  },

  async verifyConversationParticipant(conversationId: string, userId: string) {
    const participant = await chatRepository.findParticipant(
      conversationId,
      userId,
    );

    if (!participant) {
      throw new Error("You are not a participant of this conversation");
    }

    return participant;
  },
  /**
   * Send message.
   */
  async sendMessage(data: SendMessageInput) {
    /**
     * Verify user belongs to conversation.
     */
    const participant = await chatRepository.findParticipant(
      data.conversationId,
      data.userId,
    );

    if (!participant) {
      throw new Error(
        "You are not allowed to send messages in this conversation",
      );
    }

    /**
     * Validate message content.
     */
    if (data.messageType === "TEXT" && !data.content?.trim()) {
      throw new Error("Message content is required");
    }

    /**
     * Validate media URL.
     */
    if (
      ["IMAGE", "VIDEO", "AUDIO"].includes(data.messageType) &&
      !data.mediaUrl
    ) {
      throw new Error("Media URL is required");
    }

    /**
     * Create message.
     */
    const message = await chatRepository.createMessage({
      conversationId: data.conversationId,
      senderId: data.userId,
      content: data.content,
      messageType: data.messageType,
      mediaUrl: data.mediaUrl,
    });

    /**
     * Get the other participant.
     *
     * We already know the sender is a participant.
     * Fetching the conversation through the participant
     * relationships would be another repository method
     * in a larger implementation.
     */
    return message;
  },

  /**
   * Mark conversation as read.
   */
  async markConversationRead(data: MarkConversationReadInput) {
    const participant = await chatRepository.findParticipant(
      data.conversationId,
      data.userId,
    );

    if (!participant) {
      throw new Error("You are not a participant of this conversation");
    }

    await chatRepository.markMessagesRead(data.conversationId, data.userId);

    return chatRepository.markConversationRead(
      data.conversationId,
      data.userId,
    );
  },

  /**
   * Mark messages delivered.
   */
  async markMessagesDelivered(userId: string, conversationId: string) {
    const participant = await chatRepository.findParticipant(
      conversationId,
      userId,
    );

    if (!participant) {
      throw new Error("You are not a participant of this conversation");
    }

    return chatRepository.markMessagesDelivered(conversationId, userId);
  },

  /**
   * Delete own message.
   */
  async deleteMessage(data: DeleteMessageInput) {
    const message = await chatRepository.findMessageById(data.messageId);

    if (!message) {
      throw new Error("Message not found");
    }

    /**
     * Only sender can delete message.
     */
    if (message.senderId !== data.userId) {
      throw new Error("You can only delete your own messages");
    }

    if (message.deletedAt) {
      throw new Error("Message is already deleted");
    }

    return chatRepository.deleteMessage(data.messageId);
  },

  async getOtherParticipant(conversationId: string, userId: string) {
    return chatRepository.findOtherParticipant(conversationId, userId);
  },

  async hasPreviousMessages(conversationId: string) {
    return chatRepository.hasPreviousMessages(conversationId);
  },

  async getOtherParticipantDetails(conversationId: string, userId: string) {
    return chatRepository.findOtherParticipantDetails(conversationId, userId);
  },

  async getUnreadCount(conversationId: string, userId: string) {
    return chatRepository.getUnreadCount(conversationId, userId);
  },

  async getConversationReceivers(conversationId: string, userId: string) {
    return chatRepository.findConversationParticipants(conversationId, userId);
  },

  async getParticipants(userId: string, conversationId: string) {
    const participants = await chatRepository.findParticipants(conversationId);

    // Verify that the sender belongs to this conversation
    const isParticipant = participants.some(
      (participant) => participant.userId === userId,
    );

    if (!isParticipant) {
      throw new Error("User is not a participant of this conversation");
    }

    // Return only the other participants
    return participants.filter((participant) => participant.userId !== userId);
  },

  async getUserDetails(userId: string) {
    return chatRepository.getUserDetails(userId);
  },

  //DELETE CONVERSATION
  async deleteConversation(
    conversationId: string,
    userId: string
  ) {
    // Check whether user belongs to conversation
    const participant =
      await chatRepository.findParticipant(
        conversationId,
        userId
      );

    if (!participant) {
      throw new Error(
        "Conversation not found or you are not a participant"
      );
    }

    // Already deleted
    if (participant.deletedAt) {
      return {
        conversationId,
        deletedAt: participant.deletedAt,
      };
    }

    const deletedParticipant =
      await chatRepository.deleteConversationForUser(
        conversationId,
        userId
      );

    return {
      conversationId: deletedParticipant.conversationId,
      deletedAt: deletedParticipant.deletedAt,
    };
  },

  //CLEAR ALL CHAT
  async clearChat(
    conversationId: string,
    userId: string
  ) {
    const participant =
      await chatRepository.findParticipant(
        conversationId,
        userId
      );

    if (!participant) {
      throw new Error(
        "Conversation not found or you are not a participant"
      );
    }

    const deletedCount =
      await chatRepository.clearChat(
        conversationId,
        userId
      );

    return {
      conversationId,
      deletedMessages: deletedCount,
    };
  },

  // async inviteToEvent(
  //   senderId: string,
  //   receiverId: string,
  //   eventId: string,
  // ) {
  //   // 1. Cannot invite yourself
  //   if (senderId === receiverId) {
  //     throw new Error("You cannot invite yourself to an event");
  //   }

  //   // 2. Check event
  //   const event = await chatRepository.findEventById(eventId);

  //   if (!event) {
  //     throw new Error("Event not found");
  //   }

  //   // 3. Find existing conversation
  //   let conversation =
  //     await chatRepository.findConversationBetweenUsers(
  //       senderId,
  //       receiverId,
  //     );

  //   // 4. Create conversation if it doesn't exist
  //   if (!conversation) {
  //     conversation = await chatRepository.createConversation(
  //       senderId,
  //       receiverId,
  //     );
  //   }

  //   // 5. Create EVENT_INVITE message
  //   const message =
  //     await chatRepository.createEventInviteMessage(
  //       conversation.id,
  //       senderId,
  //       eventId,
  //     );

  //   return {
  //     conversation,
  //     message,
  //   };
  // },
};
