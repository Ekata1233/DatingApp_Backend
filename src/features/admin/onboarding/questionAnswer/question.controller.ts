import { Request, Response } from "express";
import {
  createQuestionValidation,
  getQuestionValidation,
} from "./question.validation";

import {
  createQuestionService,
  getQuestionService,
  getQuestionByIdService,
  deleteQuestionService,
} from "./question.service";

// CREATE QUESTION
export const createQuestionController = async (
  req: Request,
  res: Response
) => {
  try {
    const { key, title, category, screen, isMulti, options } =
      createQuestionValidation.parse(req.body);

    const question = await createQuestionService(
      key,
      title,
      category,
      screen,
      isMulti ?? false,
      options
    );

    return res.status(201).json({
      success: true,
      message: "Question created successfully",
      data: question,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// GET QUESTIONS
export const getQuestionController = async (
  req: Request,
  res: Response
) => {
  try {
    const { category, screen } = getQuestionValidation.parse(req.query);

    const questions = await getQuestionService(category, screen);

    return res.status(200).json({
      success: true,
      data: questions,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// GET SINGLE QUESTION
export const getQuestionByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const question = await getQuestionByIdService(id);

    return res.status(200).json({
      success: true,
      data: question,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteQuestionController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const result = await deleteQuestionService(id);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};