import express from "express";
import {
  createQuestionController,
  getQuestionController,
  getQuestionByIdController,
  deleteQuestionController,
  updateQuestionController,
  deleteQuestionOptionController,
  updateQuestionOptionController,
  addQuestionOptionController,
} from "./question.controller";


const router = express.Router();

// CREATE QUESTION (admin use ideally)
router.post("/create", createQuestionController);

// GET ALL QUESTIONS (for onboarding)
router.get("/fetch", getQuestionController);

// GET SINGLE QUESTION
router.get("/question/:id", getQuestionByIdController);

router.delete("/delete/:id", deleteQuestionController);
router.put("/update/:id", updateQuestionController);
router.post("/:questionId/options", addQuestionOptionController);
router.put("/options/:optionId", updateQuestionOptionController);
router.delete("/options/:optionId", deleteQuestionOptionController);
export default router;