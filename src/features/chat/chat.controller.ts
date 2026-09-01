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
import { presenceService } from "./presence/presence.service";
import { UserPresenceParams } from "./chat.types";
import { getIO } from "../../config/socket";

export const createConversation = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

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
    const userId = (req as any).user.id;

    const data = getConversationsSchema.parse(req.query);

    const result = await chatService.getConversations({
      userId,
      cursor: data.cursor,
      limit: data.limit,
      type: data.type,
    });

    return res.status(200).json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("getConversations error:", error);

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
    const userId = (req as any).user.id;

    const data = getMessagesSchema.parse({
      conversationId:
        req.params.conversationId,

      cursor: req.query.cursor,

      limit: req.query.limit,
      type: req.query.type,
    });

    const result =
      await chatService.getMessages({
        userId,
        conversationId: data.conversationId,
        cursor: data.cursor,
        limit: data.limit,
        type: data.type
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
    const userId = (req as any).user.id;

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
    const userId = (req as any).user.id;

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
    const userId = (req as any).user.id;

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

export const deleteConversation = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const { conversationId } = req.params;

    if (!conversationId || Array.isArray(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Valid conversation ID is required",
      });
    }

    const result =
      await chatService.deleteConversation(
        conversationId,
        userId
      );

    return res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
      data: result,
    });
  } catch (error: any) {
    console.error(
      "Delete conversation error:",
      error
    );

    if (
      error.message ===
      "Conversation not found or you are not a participant"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete conversation",
    });
  }
};

export const clearChat = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const { conversationId } = req.params;

    if (!conversationId || Array.isArray(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Valid conversation ID is required",
      });
    }

    const result =
      await chatService.clearChat(
        conversationId,
        userId
      );

    return res.status(200).json({
      success: true,
      message: "Chat cleared successfully",
      data: result,
    });
  } catch (error: any) {
    console.error(
      "Clear chat error:",
      error
    );

    if (
      error.message ===
      "Conversation not found or you are not a participant"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to clear chat",
    });
  }
};

export const getUserPresenceController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.params.userId;

    if (!userId || Array.isArray(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid User ID is required",
      });
    }

    const presence =
      await presenceService.getPresence(userId);

    return res.status(200).json({
      success: true,
      data: presence,
    });
  } catch (error) {
    console.error(
      "Get user presence error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get user presence",
    });
  }
};

export const inviteToEvent = async (
  req: Request,
  res: Response,
) => {
  try {
    const senderId = (req as any).user.id;

    const { eventId } = req.params;
    const { receiverId } = req.body;

    if (typeof eventId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
    }

    const result = await chatService.inviteToEvent(
      senderId,
      receiverId,
      eventId,
    );

    // Get initialized Socket.IO instance
    const io = getIO();

    // Send event invite to User B in real time
    io.to(`user:${receiverId}`).emit(
      "message:receive",
      result.message,
    );

    return res.status(201).json({
      success: true,
      message: "Event invitation sent successfully",
      data: result.message,
    });
  } catch (error) {
    console.error("inviteToEvent error:", error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to send event invitation",
    });
  }
};