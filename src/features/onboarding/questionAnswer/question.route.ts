import express from "express";
import {
  createQuestionController,
  getQuestionController,
  getQuestionByIdController,
} from "./question.controller";

import authMiddleware from "../../../middleware/auth.middleware";

const router = express.Router();

// CREATE QUESTION (admin use ideally)
router.post("/question", createQuestionController);

// GET ALL QUESTIONS (for onboarding)
router.get("/question", getQuestionController);

// GET SINGLE QUESTION
router.get("/question/:id", getQuestionByIdController);

export default router;