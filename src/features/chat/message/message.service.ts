// src/modules/chat/message/message.service.ts

import { MessageType } from "@prisma/client";

import { messageRepository } from "./message.repository";

import {
  CreateMessageInput,
  DeleteMessageInput,
  GetMessageInput,
  GetMessagesInput,
  MarkMessageDeliveredInput,
  MarkMessageReadInput,
  MarkMessagesReadInput,
} from "./message.types";

export const messageService = {
  /**
   * Create/send message.
   */
  async createMessage(
    data: CreateMessageInput
  ) {
    /**
     * 1. Check whether sender belongs
     *    to the conversation.
     */
    const participant =
      await messageRepository.findConversationParticipant(
        data.conversationId,
        data.userId
      );

    if (!participant) {
      throw new Error(
        "You are not a participant of this conversation"
      );
    }

    /**
     * 2. Validate message content.
     */
    if (
      data.messageType === MessageType.TEXT &&
      !data.content?.trim()
    ) {
      throw new Error(
        "Text message content is required"
      );
    }

    /**
     * 3. Validate media.
     */
    const mediaMessageTypes: MessageType[] = [
      MessageType.IMAGE,
      MessageType.VIDEO,
      MessageType.AUDIO,
      MessageType.FILE,
    ];

    if (mediaMessageTypes.includes(data.messageType)) {
      if (!data.mediaUrl) {
        throw new Error(
          "Media URL is required"
        );
      }
    }

     /**
   * 4. Validate compliment
   */
  if (
    data.messageType ===
      MessageType.COMPLIMENT &&
    !data.content?.trim()
  ) {
    throw new Error(
      "Compliment content is required"
    );
  }

    /**
     * 4. If this is a reply,
     *    make sure replied message exists
     *    in the same conversation.
     */
    // if (data.replyToMessageId) {
    //   const replyMessage =
    //     await messageRepository.findReplyMessage(
    //       data.replyToMessageId,
    //       data.conversationId
    //     );

    //   if (!replyMessage) {
    //     throw new Error(
    //       "Reply message not found"
    //     );
    //   }
    // }

    /**
     * 5. Save message.
     */
    const message =
      await messageRepository.create({
        conversationId: data.conversationId,
        senderId: data.userId,
        content: data.content,
        messageType: data.messageType,
        mediaUrl: data.mediaUrl,
      });

    return message;
  },

  /**
   * Get messages.
   */
  async getMessages(
    data: GetMessagesInput
  ) {
    /**
     * Check conversation access.
     */
    const participant =
      await messageRepository.findConversationParticipant(
        data.conversationId,
        data.userId
      );

    if (!participant) {
      throw new Error(
        "You are not a participant of this conversation"
      );
    }

    /**
     * Fetch messages.
     */
    const messages =
      await messageRepository.findMany(
        data.conversationId,
        data.cursor,
        data.limit
      );

    /**
     * limit + 1 tells us whether
     * another page exists.
     */
    const hasMore =
      messages.length > data.limit;

    const items = hasMore
      ? messages.slice(0, data.limit)
      : messages;

    const nextCursor = hasMore
      ? items[items.length - 1]?.id ?? null
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
   * Get a single message.
   */
  async getMessage(
    data: GetMessageInput
  ) {
    const message =
      await messageRepository.findById(
        data.messageId
      );

    if (!message) {
      throw new Error("Message not found");
    }

    /**
     * Check access through conversation.
     */
    const participant =
      await messageRepository.findConversationParticipant(
        message.conversationId,
        data.userId
      );

    if (!participant) {
      throw new Error(
        "You are not allowed to access this message"
      );
    }

    return message;
  },

  /**
   * Mark one message as delivered.
   */
  async markDelivered(
    data: MarkMessageDeliveredInput
  ) {
    const message =
      await messageRepository.findById(
        data.messageId
      );

    if (!message) {
      throw new Error("Message not found");
    }

    /**
     * User must belong to the conversation.
     */
    const participant =
      await messageRepository.findConversationParticipant(
        message.conversationId,
        data.userId
      );

    if (!participant) {
      throw new Error(
        "You are not a participant of this conversation"
      );
    }

    /**
     * Don't mark your own message as delivered.
     */
    if (message.senderId === data.userId) {
      return message;
    }

    /**
     * Don't update if already delivered.
     */
    if (message.deliveredAt) {
      return message;
    }

    return messageRepository.markDelivered(
      data.messageId
    );
  },

  /**
   * Mark one message as read.
   */
  async markRead(
    data: MarkMessageReadInput
  ) {
    const message =
      await messageRepository.findById(
        data.messageId
      );

    if (!message) {
      throw new Error("Message not found");
    }

    /**
     * Verify receiver belongs to conversation.
     */
    const participant =
      await messageRepository.findConversationParticipant(
        message.conversationId,
        data.userId
      );

    if (!participant) {
      throw new Error(
        "You are not a participant of this conversation"
      );
    }

    /**
     * Sender cannot read their own message
     * from the receiver's perspective.
     */
    if (message.senderId === data.userId) {
      return message;
    }

    /**
     * Already read.
     */
    if (message.readAt) {
      return message;
    }

    return messageRepository.markRead(
      data.messageId
    );
  },

  /**
   * Mark all messages in conversation as read.
   */
  async markConversationRead(
    data: MarkMessagesReadInput
  ) {
    const participant =
      await messageRepository.findConversationParticipant(
        data.conversationId,
        data.userId
      );

    if (!participant) {
      throw new Error(
        "You are not a participant of this conversation"
      );
    }

    return messageRepository.markConversationMessagesRead(
      data.conversationId,
      data.userId
    );
  },

  /**
   * Delete message.
   */
  async deleteMessage(
    data: DeleteMessageInput
  ) {
    const message =
      await messageRepository.findById(
        data.messageId
      );

    if (!message) {
      throw new Error("Message not found");
    }

    /**
     * Only sender can delete own message.
     */
    if (message.senderId !== data.userId) {
      throw new Error(
        "You can only delete your own message"
      );
    }

    /**
     * Already deleted.
     */
    if (message.deletedAt) {
      throw new Error(
        "Message is already deleted"
      );
    }

    return messageRepository.softDelete(
      data.messageId
    );
  },
};