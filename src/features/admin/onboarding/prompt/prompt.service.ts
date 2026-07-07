import { prisma } from "../../../../prisma/prismaClient";
import { CreatePromptCategoryDto, CreatePromptDto, UpdatePromptCategoryDto, UpdatePromptDto } from "./prompt.types";

export const createPromptCategoryService = async (data: CreatePromptCategoryDto) => {
  return prisma.promptCategory.create({
    data,
  });
};

export const updatePromptCategoryService = async (
  id: string,
  data: UpdatePromptCategoryDto
) => {
  return prisma.promptCategory.update({
    where: {
      id,
    },
    data,
  });
};

export const deletePromptCategoryService = async (id: string) => {
  const count = await prisma.prompt.count({
    where: {
      categoryId: id,
    },
  });
  if (count) {
    throw new Error("Category contains prompts.");
  }
  await prisma.promptCategory.delete({
    where: {
      id,
    },
  });
};

export const getPromptCategoryService = async () => {
  return prisma.promptCategory.findMany({
    include: {
      _count: {
        select: {
          prompts: true,
        },
      },
    },
    orderBy: {
      priority: "asc",
    },
  });
};

export const createPromptService = async (
  data: CreatePromptDto
) => {
  return prisma.prompt.create({
    data,
    include: {
      category: true,
    },
  });
};

export const updatePromptService = async (
  id: string,
  data: UpdatePromptDto
) => {
  return prisma.prompt.update({
    where: {
      id,
    },
    data,
    include: {
      category: true,
    },
  });
};

export const deletePromptService = async (
  id: string
) => {
  const count = await prisma.userPrompt.count({
    where: {
      promptId: id,
    },
  });
  if (count) {
    throw new Error("Prompt is already used by users.");
  }
  await prisma.prompt.delete({
    where: {
      id,
    },
  });
};

export const getPromptService = async () => {
  return prisma.prompt.findMany({
    include: {
      category: true,
      _count: {
        select: {
          userPrompts: true,
        },
      },
    },
    orderBy: [
      {
        category: {
          priority: "asc",
        },
      },
      {
        priority: "asc",
      },
    ],
  });
};

export const getActivePromptsService = async () => {
  return prisma.promptCategory.findMany({
    where: {
      active: true,
    },
    include: {
      prompts: {
        where: {
          active: true,
        },
        orderBy: {
          priority: "asc",
        },
      },
    },
    orderBy: {
      priority: "asc",
    },
  });
};