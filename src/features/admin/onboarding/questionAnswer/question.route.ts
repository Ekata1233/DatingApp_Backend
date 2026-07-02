import express from "express";
import {
  createQuestionController,
  getQuestionController,
  getQuestionByIdController,
  deleteQuestionController,
} from "./question.controller";


const router = express.Router();

// CREATE QUESTION (admin use ideally)
router.post("/create", createQuestionController);

// GET ALL QUESTIONS (for onboarding)
router.get("/fetch", getQuestionController);

// GET SINGLE QUESTION
router.get("/question/:id", getQuestionByIdController);

router.delete("/delete/:id", deleteQuestionController);

export default router;