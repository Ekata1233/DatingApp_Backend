import { QuestionCategory, QuestionScreen } from "@prisma/client";
import { prisma } from "../../../../prisma/prismaClient";
import { redis } from "../../../../lib/redis";

export const clearQuestionCache = async () => {
  const keys = await redis.keys("questions:*");

  if (keys.length > 0) {
    await redis.del(...keys);
    console.log("🗑️ Question cache cleared");
  }
};
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

  await clearQuestionCache();

  return question;
};

// GET QUESTIONS
export const getQuestionService = async (
  category?: QuestionCategory,
  screen?: QuestionScreen
) => {
  // Generate unique cache key
  const cacheKey = `questions:${category ?? "all"}:${screen ?? "all"}`;

  // 1. Check Redis
  const cachedQuestions = await redis.get(cacheKey);

  if (cachedQuestions) {
    console.log(`✅ Cache Hit: ${cacheKey}`);
    return cachedQuestions;
  }

  console.log(`📦 Cache Miss: ${cacheKey}`);

  // 2. Fetch from Database
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

  // 3. Store in Redis for 10 minutes
  await redis.set(cacheKey, questions);

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

// DELETE QUESTION
export const deleteQuestionService = async (id: string) => {
  // check if exists
  const question = await prisma.question.findUnique({
    where: { id },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  // delete question (options auto deleted because of Cascade)
  await prisma.question.delete({
    where: { id },
  });
  await clearQuestionCache();

  return { message: "Question deleted successfully" };
};

export const updateQuestionService = async (
  id: string,
  title: string,
  isMulti: boolean
) => {
  const existing = await prisma.question.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Question not found");
  }

  const question = await prisma.question.update({
    where: { id },
    data: {
      title,
      isMulti,
    },
    include: {
      options: true,
    },
  });

  await clearQuestionCache();

  return question;
};

export const addQuestionOptionService = async (
  question_id: string,
  value: string,
  label: string
) => {
  const question = await prisma.question.findUnique({
    where: {
      id: question_id,
    },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  const option = await prisma.questionOption.create({
  data: {
    question_id,
    value,
    label,
  },
});

await clearQuestionCache();

return option;
};

export const updateQuestionOptionService = async (
  optionId: string,
  value: string,
  label: string
) => {
  const option = await prisma.questionOption.findUnique({
    where: {
      id: optionId,
    },
  });

  if (!option) {
    throw new Error("Option not found");
  }

  const options = await prisma.questionOption.update({
  where: {
    id: optionId,
  },
  data: {
    value,
    label,
  },
});

await clearQuestionCache();

return options;
};

export const deleteQuestionWithOptionsService = async (
  questionId: string
) => {
  const question = await prisma.question.findUnique({
    where: {
      id: questionId,
    },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  await prisma.$transaction(async (tx) => {
    // Delete all options of this question
    await tx.questionOption.deleteMany({
      where: {
        question_id: questionId,
      },
    });

    // Delete question
    await tx.question.delete({
      where: {
        id: questionId,
      },
    });
  });
  
  await clearQuestionCache();

  return {
    message: "Question and all related options deleted successfully",
  };
};