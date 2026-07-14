import { redis } from "../../../../lib/redis";
import { prisma } from "../../../../prisma/prismaClient";
import { IIntention } from "./intention.types";

export const createIntention = async (
  payload: IIntention
) => {

  const existing = await prisma.intention.findFirst({
    include: {
      options: true,
    },
  });

  // UPDATE
  if (existing) {
    return prisma.intention.update({
      where: {
        id: existing.id,
      },

      data: {
        title: payload.title,
        description: payload.description,
        sortOrder: payload.sortOrder,
        isActive: payload.isActive,

        options: {
          deleteMany: {},

          create: payload.options,
        },
      },

      include: {
        options: true,
      },
    });
  }

  // CREATE

  return prisma.intention.create({
    data: {
      title: payload.title,
      description: payload.description,
      sortOrder: payload.sortOrder,
      isActive: payload.isActive,

      options: {
        create: payload.options,
      },
    },

    include: {
      options: true,
    },
  });
};

const CACHE_KEY = "intentions:all";
export const getAllIntentions = async () => {
  // 1. Check Redis
  const cached = await redis.get(CACHE_KEY);
  if (cached) {
    console.log("✅ Data from Redis");
    return cached;
  }

  console.log("📦 Data from Database");

  // 2. Get from DB
  const intentions = await prisma.intention.findMany({
    include: {
      options: true,
    },
  });

  // 3. Save in Redis for 10 minutes
  await redis.set(CACHE_KEY, intentions, {
    ex: 600,
  });

  return intentions;
};

export const deleteIntention = async () => {
  const existing = await prisma.intention.findFirst();

  if (!existing) return null;

  return prisma.intention.delete({
    where: {
      id: existing.id,
    },
  });
};