import { redis } from "../../../../lib/redis";
import { prisma } from "../../../../prisma/prismaClient";
import {
  CreateLanguageInput,
  UpdateLanguageInput,
} from "./language.types";

const ALL_CACHE_KEY = "language:all";
const ACTIVE_CACHE_KEY = "language:active";

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
  const language = await prisma.language.create({
    data: {
      name: data.name,
      priority: data.priority ?? 0,
      active: data.active ?? true,
    },
  });
  // ✅ Clear Redis cache
  await redis.del(ALL_CACHE_KEY);
  await redis.del(ACTIVE_CACHE_KEY);
  console.log("🗑️ Language cache cleared");
  return language;
};

export const getLanguagesService = async () => {
  // 1. Check Redis
  const cached = await redis.get(ALL_CACHE_KEY);
  if (cached) {
    console.log("✅ Languages from Redis");
    return cached;
  }
  console.log("📦 Languages from Database");
  const languages = await prisma.language.findMany({
    orderBy: [
      {
        priority: "asc",
      },
      {
        name: "asc",
      },
    ],
  });
  // 2. Save to Redis
  await redis.set(ALL_CACHE_KEY, languages, {
    ex: 600,
  });
  return languages;
};

export const getActiveLanguagesService = async () => {
  // 1. Check Redis
  const cached = await redis.get(ACTIVE_CACHE_KEY);
  if (cached) {
    console.log("✅ Active Languages from Redis");
    return cached;
  }
  console.log("📦 Active Languages from Database")
  const languages = await prisma.language.findMany({
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
  // 2. Save to Redis
  await redis.set(ACTIVE_CACHE_KEY, languages, {
    ex: 600,
  });
  return languages;
};

export const getLanguageByIdService = async (
  id: number
) => {
  const CACHE_KEY = `language:${id}`;
  // Check Redis
  const cached = await redis.get(CACHE_KEY);
  if (cached) {
    console.log("✅ Language from Redis");
    return cached;
  }
  const language = await prisma.language.findUnique({
    where: {
      id,
    },
  });
  if (!language) {
    throw new Error("Language not found");
  }
  // Save to Redis
  await redis.set(CACHE_KEY, language, {
    ex: 600,
  });
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
  const updatedLanguage = await prisma.language.update({
    where: {
      id,
    },
    data,
  });
  // ✅ Clear Redis cache
  await redis.del(ALL_CACHE_KEY);
  await redis.del(ACTIVE_CACHE_KEY);
  await redis.del(`language:${id}`);
  console.log("🗑️ Language cache cleared");
  return updatedLanguage;
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
  const deletedLanguage = await prisma.language.delete({
    where: {
      id,
    },
  });
  // ✅ Clear Redis cache
  await redis.del(ALL_CACHE_KEY);
  await redis.del(ACTIVE_CACHE_KEY);
  await redis.del(`language:${id}`);
  console.log("🗑️ Language cache cleared");
  return deletedLanguage;
};