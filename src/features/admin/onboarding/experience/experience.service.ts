import { redis } from "../../../../lib/redis";
import { prisma } from "../../../../prisma/prismaClient"
import { IExperiencePayload } from "./experience.types"

const ALL_CACHE_KEY = "experience:all";
const ACTIVE_CACHE_KEY = "experience:active";

const clearExperienceCache = async () => {
  await redis.del(ALL_CACHE_KEY);
  await redis.del(ACTIVE_CACHE_KEY);

  console.log("🗑️ Experience cache cleared");
};

export const createExperience = async (payload: IExperiencePayload) => {
  const experience = await prisma.experience.create({
    data: {
      title: payload.title,
      sortOrder: payload.sortOrder ?? null,
      isActive: payload.isActive ?? true,
    },
  });

  await clearExperienceCache();

  return experience;
}

export const getAllExperience = async () => {
  const cached = await redis.get(ALL_CACHE_KEY);
  if (cached) {
    console.log("✅ Cache Hit: experience:all");
    return cached;
  }
  console.log("📦 Cache Miss: experience:all");

  const experiences = await prisma.experience.findMany({
    orderBy: {
      sortOrder: "asc",
    },
  });
  await redis.set(ALL_CACHE_KEY, experiences);
  return experiences;
}

export const updateExperience = async (
  id: number,
  payload: IExperiencePayload
) => {
  const experience = await prisma.experience.update({
    where: {
      id,
    },
    data: {
      title: payload.title,
      sortOrder: payload.sortOrder,
      isActive: payload.isActive,
    },
  });

  await clearExperienceCache();

  return experience;
}

export const deleteExperience = async (id: number) => {
  const experience = await prisma.experience.delete({
    where: {
      id,
    },
  });

  await clearExperienceCache();

  return experience;
}

export const getActiveExperience = async () => {
  const cached = await redis.get(ACTIVE_CACHE_KEY);
  if (cached) {
    console.log("✅ Cache Hit: experience:active");
    return cached;
  }
  console.log("📦 Cache Miss: experience:active");

  const experiences = await prisma.experience.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });
  await redis.set(ACTIVE_CACHE_KEY, experiences);
  return experiences;
}