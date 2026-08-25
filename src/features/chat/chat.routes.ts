// src/modules/chat/chat.routes.ts

import { Router } from "express";

import {
  clearChat,
  createConversation,
  deleteConversation,
  deleteMessage,
  getConversations,
  getMessages,
  getUserPresenceController,
  markConversationRead,
  sendMessage,
} from "./chat.controller";
import authMiddleware from "../../middleware/auth.middleware";


const router = Router();

/**
 * All chat routes require authentication.
 */
router.use(authMiddleware);

/**
 * Conversations
 */
router.post(
  "/conversations",
  createConversation
);

router.get(
  "/conversations",
  getConversations
);

/**
 * Messages
 */
router.get(
  "/conversations/:conversationId/messages",
  getMessages
);

router.post(
  "/messages",
  sendMessage
);

router.patch(
  "/conversations/read",
  markConversationRead
);

router.delete(
  "/messages/:messageId",
  deleteMessage
);

router.delete(
  "/conversations/:conversationId",
  authMiddleware,
  deleteConversation
);

router.delete(
  "/conversations/:conversationId/clear",
  authMiddleware,
  clearChat
);

router.get(
  "/presence/:userId",
  authMiddleware,
  getUserPresenceController
);

export default router;