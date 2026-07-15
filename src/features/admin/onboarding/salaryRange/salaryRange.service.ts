import { redis } from "../../../../lib/redis";
import { prisma } from "../../../../prisma/prismaClient";
import { ISalaryRange } from "./salaryRange.types";


const ALL_CACHE_KEY = "salary_range:all";
const ACTIVE_CACHE_KEY = "salary_range:active";

/**
 * Create Salary Range
 */
export const createSalaryRange = async (payload: ISalaryRange) => {
  const salaryRange = await prisma.salaryRange.create({
    data: {
      title: payload.title,
      minSalary: payload.minSalary,
      maxSalary: payload.maxSalary,
      isActive: payload.isActive,
    },
  });
  // ✅ Clear Redis cache
  await redis.del(ALL_CACHE_KEY);
  await redis.del(ACTIVE_CACHE_KEY);
  console.log("🗑️ Salary Range cache cleared");
  return salaryRange;
};

/**
 * Update Salary Range
 */
export const updateSalaryRange = async (id: number, payload: ISalaryRange) => {
  const salaryRange = await prisma.salaryRange.update({
    where: {
      id,
    },
    data: {
      title: payload.title,
      minSalary: payload.minSalary,
      maxSalary: payload.maxSalary,
      isActive: payload.isActive,
    },
  });
  // ✅ Clear Redis cache
  await redis.del(ALL_CACHE_KEY);
  await redis.del(ACTIVE_CACHE_KEY);
  console.log("🗑️ Salary Range cache cleared");
  return salaryRange;
};

/**
 * Get All Salary Ranges (Admin)
 */
export const getAllSalaryRange = async () => {
  // 1. Check Redis
  const cached = await redis.get(ALL_CACHE_KEY);
  if (cached) {
    console.log("✅ All Salary Ranges from Redis");
    return cached;
  }
  console.log("📦 All Salary Ranges from Database");
  // 2. Fetch from Database
  const salaryRanges = await prisma.salaryRange.findMany({
    orderBy: {
      id: "asc",
    },
  });
  // 3. Save to Redis for 10 minutes
  await redis.set(ALL_CACHE_KEY, salaryRanges);
  return salaryRanges;
};

/**
 * Get Active Salary Ranges (Onboarding)
 */
export const getActiveSalaryRange = async () => {
  // 1. Check Redis
  const cached = await redis.get(ACTIVE_CACHE_KEY);

  if (cached) {
    console.log("✅ Active Salary Ranges from Redis");
    return cached;
  }
  console.log("📦 Active Salary Ranges from Database");
  // 2. Fetch from Database
  const salaryRanges = await prisma.salaryRange.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      id: "asc",
    },
  });
  // 3. Save to Redis for 10 minutes
  await redis.set(ACTIVE_CACHE_KEY, salaryRanges);

  return salaryRanges;
};


/**
 * Get Single Salary Range
 */
export const getSalaryRangeById = async (id: number) => {
  const CACHE_KEY = `salary_range:${id}`;
  // 1. Check Redis
  const cached = await redis.get(CACHE_KEY);
  if (cached) {
    console.log("✅ Salary Range from Redis");
    return cached;
  }
  console.log("📦 Salary Range from Database");
  // 2. Fetch from Database
  const salaryRange = await prisma.salaryRange.findUnique({
    where: {
      id,
    },
  });
  if (!salaryRange) {
    return null;
  }
  // 3. Store in Redis for 10 minutes
  await redis.set(CACHE_KEY, salaryRange);
  return salaryRange;
};

/**
 * Delete Salary Range
 */
export const removeSalaryRange = async (id: number) => {
  const salaryRange = await prisma.salaryRange.delete({
    where: {
      id,
    },
  });

  // ✅ Clear Redis caches
  await redis.del(ALL_CACHE_KEY);
  await redis.del(ACTIVE_CACHE_KEY);
  await redis.del(`salary_range:${id}`);

  console.log("🗑️ Salary Range cache cleared");

  return salaryRange;
};
