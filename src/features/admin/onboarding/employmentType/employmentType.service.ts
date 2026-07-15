import { redis } from "../../../../lib/redis";
import { prisma } from "../../../../prisma/prismaClient";
import { IEmploymentType } from "./employmentType.types";

const ALL_CACHE_KEY = "employmentType:all";
const ACTIVE_CACHE_KEY = "employmentType:active";
const SINGLE_CACHE_PREFIX = "employmentType";

const clearEmploymentTypeCache = async () => {
  await redis.del(ALL_CACHE_KEY);
  await redis.del(ACTIVE_CACHE_KEY);

  // Remove all single record caches
  const keys = await redis.keys(`${SINGLE_CACHE_PREFIX}:*`);

  if (keys.length > 0) {
    await redis.del(...keys);
  }

  console.log("🗑️ Employment Type cache cleared");
};

/**
 * Create Employment Type
 */
export const createEmploymentType = async (
  payload: IEmploymentType
) => {
  const employmentType = await prisma.employmentType.create({
    data: {
      name: payload.name,
      isActive: payload.isActive,
    },
  });

  await clearEmploymentTypeCache();

  return employmentType;
};

/**
 * Update Employment Type
 */
export const updateEmploymentType = async (
  id: number,
  payload: IEmploymentType
) => {
  const employmentType = await prisma.employmentType.update({
    where: {
      id,
    },
    data: {
      name: payload.name,
      isActive: payload.isActive,
    },
  });

  await clearEmploymentTypeCache();

  return employmentType;
};

/**
 * Get All Employment Types
 */
export const getAllEmploymentType = async () => {
  const cached = await redis.get(ALL_CACHE_KEY);
  if (cached) {
    console.log("✅ Cache Hit: employmentType:all");
    return cached;
  }
  console.log("📦 Cache Miss: employmentType:all");

  const employmentTypes = await prisma.employmentType.findMany({
    orderBy: {
      id: "asc",
    },
  });
  await redis.set(ALL_CACHE_KEY, employmentTypes);
  return employmentTypes;
};

/**
 * Get Single Employment Type
 */
export const getEmploymentTypeById = async (
  id: number
) => {
  const cacheKey = `${SINGLE_CACHE_PREFIX}:${id}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log(`✅ Cache Hit: ${cacheKey}`);
    return cached;
  }
  console.log(`📦 Cache Miss: ${cacheKey}`);

  const employmentType = await prisma.employmentType.findUnique({
    where: {
      id,
    },
  });
  if (employmentType) {
    await redis.set(cacheKey, employmentType);
  }
  return employmentType;
};

/**
 * Delete Employment Type
 */
export const removeEmploymentType = async (
  id: number
) => {
  const employmentType = await prisma.employmentType.delete({
    where: {
      id,
    },
  });

  await clearEmploymentTypeCache();

  return employmentType;
};

/**
 * Active Employment Type
 */
export const getActiveEmploymentType = async () => {
  const cached = await redis.get(ACTIVE_CACHE_KEY);
  if (cached) {
    console.log("✅ Cache Hit: employmentType:active");
    return cached;
  }
  console.log("📦 Cache Miss: employmentType:active");

  const employmentTypes = await prisma.employmentType.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      id: "asc",
    },
  });
  await redis.set(ACTIVE_CACHE_KEY, employmentTypes);
  return employmentTypes;
};