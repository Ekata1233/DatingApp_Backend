import { QuestionCategory,QuestionScreen } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";

// CREATE QUESTION
export const createQuestionService = async (
  key: string,
  title: string,
  category: QuestionCategory,
  screen: QuestionScreen,
  isMulti: boolean,
  options: { value: string; label: string }[]
) => {
  // check duplicate key
  const existing = await prisma.question.findUnique({
    where: { key },
  });

  if (existing) {
    throw new Error("Question key already exists");
  }

  const question = await prisma.question.create({
    data: {
      key,
      title,
      category,
      screen,
      isMulti,
      options: {
        create: options.map((opt) => ({
          value: opt.value,
          label: opt.label,
        })),
      },
    },
    include: {
      options: true,
    },
  });

  return question;
};

// GET QUESTIONS
export const getQuestionService = async (
  category?: QuestionCategory,
  screen?: QuestionScreen
) => {
  const questions = await prisma.question.findMany({
    where: {
      ...(category && { category }),
      ...(screen && { screen }),
    },
    include: {
      options: true,
    },
    orderBy: {
      created_at: "asc",
    },
  });

  return questions;
};

// GET SINGLE QUESTION
export const getQuestionByIdService = async (id: string) => {
  const question = await prisma.question.findUnique({
    where: { id },
    include: {
      options: true,
    },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  return question;
};