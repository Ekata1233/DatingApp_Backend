import { redis } from "../../../../lib/redis";
import { prisma } from "../../../../prisma/prismaClient";
import { IProfession } from "./profession.types";

export const clearProfessionCache = async () => {
  const keys = await redis.keys("profession:*");

  if (keys.length > 0) {
    await redis.del(...keys);
    console.log("🗑️ Profession cache cleared");
  }
};
/**
 * Create Profession
 */
export const createProfession = async (payload: IProfession) => {
  const profession = await prisma.profession.create({
    data: {
      name: payload.name,
      isActive: payload.isActive,
    },
  });

  await clearProfessionCache();

  return profession;
};

/**
 * Update Profession
 */
export const updateProfession = async (
  id: number,
  payload: IProfession
) => {
  const profession = await prisma.profession.update({
    where: {
      id,
    },
    data: {
      name: payload.name,
      isActive: payload.isActive,
    },
  });

  await clearProfessionCache();

  return profession;
};

/**
 * Get All Profession
 */
export const getAllProfession = async () => {
  const cacheKey = "profession:all";
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log("✅ Cache Hit: profession:all");
    return cached;
  }

  console.log("📦 Cache Miss: profession:all");
  const professions = await prisma.profession.findMany({
    orderBy: {
      id: "asc",
    },
  });

  await redis.set(cacheKey, professions, {
    ex: 600,
  });
  return professions;
};

/**
 * Get Single Profession
 */
export const getProfessionById = async (id: number) => {
  const cacheKey = `profession:${id}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log(`✅ Cache Hit: ${cacheKey}`);
    return cached;
  }
  console.log(`📦 Cache Miss: ${cacheKey}`);

  const profession = await prisma.profession.findUnique({
    where: {
      id,
    },
  });
  if (profession) {
    await redis.set(cacheKey, profession, {
      ex: 600,
    });
  }
  return profession;
};

/**
 * Delete Profession
 */
export const removeProfession = async (id: number) => {
  const profession = await prisma.profession.delete({
    where: {
      id,
    },
  });

  await clearProfessionCache();

  return profession;
};

export const getActiveProfession = async () => {
  const cacheKey = "profession:active";
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log("✅ Cache Hit: profession:active");
    return cached;
  }
  console.log("📦 Cache Miss: profession:active");

  const professions = await prisma.profession.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      id: "asc",
    },
  });
  await redis.set(cacheKey, professions, {
    ex: 600,
  });

  return professions;
};