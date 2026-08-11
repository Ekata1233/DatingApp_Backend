// src/modules/chat/chat.controller.ts

import { Request, Response } from "express";

import {
  createConversationSchema,
  deleteMessageSchema,
  getConversationsSchema,
  getMessagesSchema,
  markConversationReadSchema,
  sendMessageSchema,
} from "./chat.validation";

import { chatService } from "./chat.service";

export const createConversation = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.id;

    const data =
      createConversationSchema.parse(req.body);

    const conversation =
      await chatService.createConversation({
        userId,
        targetUserId: data.targetUserId,
      });

    return res.status(200).json({
      success: true,
      message: "Conversation created successfully",
      data: conversation,
    });
  } catch (error) {
    console.error(
      "createConversation error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create conversation",
    });
  }
};

export const getConversations = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.id;

    const data =
      getConversationsSchema.parse(req.query);

    const result =
      await chatService.getConversations({
        userId,
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
      "getConversations error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch conversations",
    });
  }
};

export const getMessages = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.id;

    const data = getMessagesSchema.parse({
      conversationId:
        req.params.conversationId,

      cursor: req.query.cursor,

      limit: req.query.limit,
    });

    const result =
      await chatService.getMessages({
        userId,
        conversationId: data.conversationId,
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

export const sendMessage = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.id;

    const data =
      sendMessageSchema.parse(req.body);

    const result =
      await chatService.sendMessage({
        userId,
        conversationId: data.conversationId,
        content: data.content,
        messageType: data.messageType,
        mediaUrl: data.mediaUrl,
      });

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: result,
    });
  } catch (error) {
    console.error(
      "sendMessage error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to send message",
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
      markConversationReadSchema.parse(
        req.body
      );

    const result =
      await chatService.markConversationRead({
        userId,
        conversationId:
          data.conversationId,
      });

    return res.status(200).json({
      success: true,
      message: "Conversation marked as read",
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
          : "Failed to mark conversation as read",
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

    const result =
      await chatService.deleteMessage({
        userId,
        messageId: data.messageId,
      });

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully",
      data: result,
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