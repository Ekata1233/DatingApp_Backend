import { Router } from "express";
import { createPromptCategoryController, createPromptController, deletePromptCategoryController, deletePromptController, getActivePromptController, getPromptCategoryController, getPromptController, updatePromptCategoryController, updatePromptController } from "./prompt.controller";
const router = Router();

router.post(
  "/prompt-category/create",  createPromptCategoryController
);

router.get(
  "/prompt-category",  getPromptCategoryController
);

router.patch(
  "/prompt-category/:id",  updatePromptCategoryController
);

router.delete(
  "/prompt-category/:id", deletePromptCategoryController
);

router.post(
  "/prompt/create", createPromptController
);

router.get(
  "/prompt/get-all", getPromptController
);

router.get(
  "/prompt/get", getActivePromptController
);

router.patch(
  "/prompt/:id", updatePromptController
);

router.delete(
  "/prompt/:id", deletePromptController
);

export default router;