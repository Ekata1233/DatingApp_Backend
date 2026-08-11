// src/modules/chat/message/message.controller.ts

import { Request, Response } from "express";

import {
  createMessageSchema,
  deleteMessageSchema,
  getMessageSchema,
  getMessagesSchema,
  markMessageDeliveredSchema,
  markMessageReadSchema,
  markMessagesReadSchema,
} from "./message.validation";

import { messageService } from "./message.service";

export const createMessage = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.id;

    const data =
      createMessageSchema.parse(req.body);

    const message =
      await messageService.createMessage({
        userId,

        conversationId:
          data.conversationId,

        content: data.content,

        messageType: data.messageType,

        mediaUrl: data.mediaUrl,

        replyToMessageId:
          data.replyToMessageId,
      });

    return res.status(201).json({
      success: true,
      message: "Message created successfully",
      data: message,
    });
  } catch (error) {
    console.error(
      "createMessage error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create message",
    });
  }
};

export const getMessages = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.id;

    const data =
      getMessagesSchema.parse({
        conversationId:
          req.params.conversationId,

        cursor: req.query.cursor,

        limit: req.query.limit,
      });

    const result =
      await messageService.getMessages({
        userId,

        conversationId:
          data.conversationId,

        cursor: data.cursor,

        limit: data.limit,
      });

    return res.status(200).json({
      success: true,

      data: result.items,

      pagination: result.pagination,
    });
  } catch (error) {
    console.error(
      "getMessages error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch messages",
    });
  }
};

export const getMessage = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.id;

    const data =
      getMessageSchema.parse({
        messageId: req.params.messageId,
      });

    const message =
      await messageService.getMessage({
        userId,

        messageId: data.messageId,
      });

    return res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error(
      "getMessage error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch message",
    });
  }
};

export const markMessageDelivered = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.id;

    const data =
      markMessageDeliveredSchema.parse({
        messageId: req.params.messageId,
      });

    const message =
      await messageService.markDelivered({
        userId,

        messageId: data.messageId,
      });

    return res.status(200).json({
      success: true,
      message: "Message marked as delivered",
      data: message,
    });
  } catch (error) {
    console.error(
      "markMessageDelivered error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to mark message delivered",
    });
  }
};

export const markMessageRead = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.id;

    const data =
      markMessageReadSchema.parse({
        messageId: req.params.messageId,
      });

    const message =
      await messageService.markRead({
        userId,

        messageId: data.messageId,
      });

    return res.status(200).json({
      success: true,
      message: "Message marked as read",
      data: message,
    });
  } catch (error) {
    console.error(
      "markMessageRead error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to mark message read",
    });
  }
};

export const markConversationRead = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.id;

    const data =
      markMessagesReadSchema.parse(req.body);

    const result =
      await messageService.markConversationRead({
        userId,

        conversationId:
          data.conversationId,
      });

    return res.status(200).json({
      success: true,
      message:
        "Conversation messages marked as read",
      data: result,
    });
  } catch (error) {
    console.error(
      "markConversationRead error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to mark messages as read",
    });
  }
};

export const deleteMessage = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.id;

    const data =
      deleteMessageSchema.parse({
        messageId: req.params.messageId,
      });

    const message =
      await messageService.deleteMessage({
        userId,

        messageId: data.messageId,
      });

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully",
      data: message,
    });
  } catch (error) {
    console.error(
      "deleteMessage error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete message",
    });
  }
};