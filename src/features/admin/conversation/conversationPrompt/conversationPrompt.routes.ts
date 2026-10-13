
import { Router } from "express";

import {
  createCategoryController,
  getCategoriesController,
  updateCategoryController,
  deleteCategoryController,
  createPromptController,
  updatePromptController,
  deletePromptController,
  
  getAdminPromptsController,
  getUserPromptsController,
} from "./conversationPrompt.controller";

const router = Router();

// ==========================================
// USER ROUTES
// ==========================================

export const userConversationPromptRouter = Router();

userConversationPromptRouter.get(
  "/conversation-prompts",
  getUserPromptsController
);

// ==========================================
// ADMIN ROUTES
// ==========================================

export const adminConversationPromptRouter = router;

router.post(
  "/conversation-prompts/categories",
  createCategoryController
);

router.get(
  "/conversation-prompts/categories",
  getCategoriesController
);

router.patch(
  "/conversation-prompts/categories/:id",
  updateCategoryController
);

router.delete(
  "/conversation-prompts/categories/:id",
  deleteCategoryController
);

router.post(
  "/conversation-prompts",
  createPromptController
);

router.get(
  "/conversation-prompts",
  getAdminPromptsController
);

router.patch(
  "/conversation-prompts/:id",
  updatePromptController
);

router.delete(
  "/conversation-prompts/:id",
  deletePromptController
);


export default router;