import { redis } from "../../../../lib/redis";
import { prisma } from "../../../../prisma/prismaClient";
import { IAmbition } from "./ambition.types";

const ALL_CACHE_KEY = "ambition:all";
const ACTIVE_CACHE_KEY = "ambition:active";
/**
 * Create Ambition
 */
export const createAmbition = async (
  payload: IAmbition
) => {
  const ambition = await prisma.ambition.create({
    data: {
      title: payload.title,
      isActive: payload.isActive,
    },
  });
  // ✅ Clear Redis cache
  await redis.del(ALL_CACHE_KEY);
  await redis.del(ACTIVE_CACHE_KEY);
  console.log("🗑️ Ambition cache cleared");
  return ambition;
};

/**
 * Update Ambition
 */
export const updateAmbition = async (
  id: number,
  payload: IAmbition
) => {
  const ambition = await prisma.ambition.update({
    where: {
      id,
    },
    data: {
      title: payload.title,
      isActive: payload.isActive,
    },
  });
  // ✅ Clear Redis cache
  await redis.del(ALL_CACHE_KEY);
  await redis.del(ACTIVE_CACHE_KEY);
  console.log("🗑️ Ambition cache cleared");
  return ambition;
};

/**
 * Get All Ambitions (Admin)
 */
export const getAllAmbition = async () => {
  // 1. Check Redis
  const cached = await redis.get(ALL_CACHE_KEY);
  if (cached) {
    console.log("✅ All Ambitions from Redis");
    return cached;
  }
  console.log("📦 All Ambitions from Database");

  // 2. Get from DB
  const ambitions = await prisma.ambition.findMany({
    orderBy: {
      id: "asc",
    },
  });
  // 3. Save to Redis
  await redis.set(ALL_CACHE_KEY, ambitions);
  return ambitions;
};

/**
 * Get Active Ambitions (Onboarding)
 */
export const getActiveAmbition = async () => {
  // 1. Check Redis
  const cached = await redis.get(ACTIVE_CACHE_KEY);
  if (cached) {
    console.log("✅ Active Ambitions from Redis");
    return cached;
  }
  console.log("📦 Active Ambitions from Database");
  // 2. Get from DB
  const ambitions = await prisma.ambition.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      id: "asc",
    },
  });
  // 3. Save to Redis
  await redis.set(ACTIVE_CACHE_KEY, ambitions);
  return ambitions;
};

/**
 * Get Single Ambition
 */
export const getAmbitionById = async (
  id: number
) => {
  const CACHE_KEY = `ambition:${id}`;
  // 1. Check Redis
  const cached = await redis.get(CACHE_KEY);
  if (cached) {
    console.log("✅ Ambition from Redis");
    return cached;
  }
  console.log("📦 Ambition from Database");
  const ambition = await prisma.ambition.findUnique({
    where: {
      id,
    },
  });
  if (!ambition) {
    return null;
  }
  // 2. Save to Redis
  await redis.set(CACHE_KEY, ambition);
  return ambition;
};

/**
 * Delete Ambition
 */
export const removeAmbition = async (
  id: number
) => {
  const ambition = await prisma.ambition.delete({
    where: {
      id,
    },
  });
  // ✅ Clear Redis caches
  await redis.del(ALL_CACHE_KEY);
  await redis.del(ACTIVE_CACHE_KEY);
  await redis.del(`ambition:${id}`);
  console.log("🗑️ Ambition cache cleared");
  return ambition;
};