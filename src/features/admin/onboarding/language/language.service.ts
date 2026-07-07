import { prisma } from "../../../../prisma/prismaClient";
import {
  CreateLanguageInput,
  UpdateLanguageInput,
} from "./language.types";

export const createLanguageService = async (
  data: CreateLanguageInput
) => {
  const existing = await prisma.language.findUnique({
    where: {
      name: data.name,
    },
  });

  if (existing) {
    throw new Error("Language already exists");
  }

  return prisma.language.create({
    data: {
      name: data.name,
      priority: data.priority ?? 0,
      active: data.active ?? true,
    },
  });
};

export const getLanguagesService = async () => {
  return prisma.language.findMany({
    orderBy: [
      {
        priority: "asc",
      },
      {
        name: "asc",
      },
    ],
  });
};

export const getActiveLanguagesService = async () => {
  return prisma.language.findMany({
    where: {
      active: true,
    },
    orderBy: [
      {
        priority: "asc",
      },
      {
        name: "asc",
      },
    ],
  });
};

export const getLanguageByIdService = async (
  id: number
) => {
  const language = await prisma.language.findUnique({
    where: {
      id,
    },
  });

  if (!language) {
    throw new Error("Language not found");
  }

  return language;
};

export const updateLanguageService = async (
  id: number,
  data: UpdateLanguageInput
) => {
  const language = await prisma.language.findUnique({
    where: {
      id,
    },
  });

  if (!language) {
    throw new Error("Language not found");
  }

  if (data.name) {
    const existing = await prisma.language.findFirst({
      where: {
        name: data.name,
        NOT: {
          id,
        },
      },
    });

    if (existing) {
      throw new Error("Language already exists");
    }
  }

  return prisma.language.update({
    where: {
      id,
    },
    data,
  });
};

export const deleteLanguageService = async (
  id: number
) => {
  const language = await prisma.language.findUnique({
    where: {
      id,
    },
    include: {
      users: true,
    },
  });

  if (!language) {
    throw new Error("Language not found");
  }

  if (language.users.length > 0) {
    throw new Error(
      "Language is assigned to users and cannot be deleted."
    );
  }

  return prisma.language.delete({
    where: {
      id,
    },
  });
};