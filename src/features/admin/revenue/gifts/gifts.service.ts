import { prisma } from "../../../../prisma/prismaClient";
import {
  CreateGiftCategoryDto,
  CreateGiftDto,
  UpdateGiftCategoryDto,
  UpdateGiftDto,
} from "./gifts.types";

import { redis } from "../../../../lib/redis";


/* ===========================
   Redis Cache Keys
=========================== */

const ALL_GIFT_CATEGORY_CACHE_KEY = "gift_category:all";
const ALL_GIFT_CACHE_KEY = "gift:all";

/**
 * Create Gift Category
 */
export const createGiftCategoryService = async (
  payload: CreateGiftCategoryDto
) => {
  const name = payload.name.trim();

  const existingCategory = await prisma.giftCategory.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
  });

  if (existingCategory) {
    throw new Error("Gift category already exists");
  }

  const category = await prisma.giftCategory.create({
    data: {
      name,
    },
  });

  // ✅ Clear Redis cache
  await redis.del(ALL_GIFT_CATEGORY_CACHE_KEY);

  console.log("🗑️ Gift Category cache cleared");

  return category;
};

/**
 * Get All Gift Categories
 */
export const getGiftCategoriesService = async () => {
  // 1. Check Redis
  const cached = await redis.get(ALL_GIFT_CATEGORY_CACHE_KEY);

  if (cached) {
    console.log("✅ Gift Categories from Redis");
    return cached;
  }

  console.log("📦 Gift Categories from Database");

  // 2. Fetch from Database
  const categories = await prisma.giftCategory.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  // 3. Store in Redis for 10 minutes
  await redis.set(ALL_GIFT_CATEGORY_CACHE_KEY, categories, {
    ex: 600,
  });

  return categories;
};

/**
 * Get Gift Category By Id
 */
export const getGiftCategoryByIdService = async (id: number) => {
  const CACHE_KEY = `gift_category:${id}`;

  // 1. Check Redis
  const cached = await redis.get(CACHE_KEY);

  if (cached) {
    console.log("✅ Gift Category from Redis");
    return cached;
  }

  console.log("📦 Gift Category from Database");

  // 2. Fetch from Database
  const category = await prisma.giftCategory.findUnique({
    where: {
      id,
    },
  });

  if (!category) {
    throw new Error("Gift category not found");
  }

  // 3. Store in Redis
  await redis.set(CACHE_KEY, category, {
    ex: 600,
  });

  return category;
};

/**
 * Update Gift Category
 */
export const updateGiftCategoryService = async (
  id: number,
  payload: UpdateGiftCategoryDto
) => {
  const category = await prisma.giftCategory.findUnique({
    where: {
      id,
    },
  });

  if (!category) {
    throw new Error("Gift category not found");
  }

  if (payload.name) {
    const existingCategory = await prisma.giftCategory.findFirst({
      where: {
        id: {
          not: id,
        },
        name: {
          equals: payload.name.trim(),
          mode: "insensitive",
        },
      },
    });

    if (existingCategory) {
      throw new Error("Gift category already exists");
    }
  }

  const updatedCategory = await prisma.giftCategory.update({
    where: {
      id,
    },
    data: {
      ...(payload.name && {
        name: payload.name.trim(),
      }),
    },
  });

  // ✅ Clear Redis cache
  await redis.del(ALL_GIFT_CATEGORY_CACHE_KEY);
  await redis.del(`gift_category:${id}`);

  console.log("🗑️ Gift Category cache cleared");

  return updatedCategory;
};

/**
 * Delete Gift Category
 */
export const deleteGiftCategoryService = async (id: number) => {
  const category = await prisma.giftCategory.findUnique({
    where: {
      id,
    },
  });

  if (!category) {
    throw new Error("Gift category not found");
  }

  await prisma.giftCategory.delete({
    where: {
      id,
    },
  });

  // ✅ Clear Redis cache
  await redis.del(ALL_GIFT_CATEGORY_CACHE_KEY);
  await redis.del(`gift_category:${id}`);

  console.log("🗑️ Gift Category cache cleared");

  return;
};







/**
 * Create Gift
 */
export const createGiftService = async (
  data: CreateGiftDto
) => {
  const category = await prisma.giftCategory.findUnique({
    where: {
      id: data.categoryId,
    },
  });

  if (!category) {
    throw new Error("Gift category not found");
  }

  const alreadyExist = await prisma.gift.findFirst({
    where: {
      name: data.name,
    },
  });

  if (alreadyExist) {
    throw new Error("Gift already exists");
  }

  const gift = await prisma.gift.create({
    data,
    include: {
      category: true,
    },
  });

  // ✅ Clear Redis cache
  await redis.del(ALL_GIFT_CACHE_KEY);

  console.log("🗑️ Gift cache cleared");

  return gift;
};

/**
 * Update Gift
 */
export const updateGiftService = async (
  id: number,
  data: UpdateGiftDto
) => {
  const gift = await prisma.gift.findUnique({
    where: {
      id,
    },
  });

  if (!gift) {
    throw new Error("Gift not found");
  }

  if (data.categoryId) {
    const category = await prisma.giftCategory.findUnique({
      where: {
        id: data.categoryId,
      },
    });

    if (!category) {
      throw new Error("Gift category not found");
    }
  }

  if (data.name) {
    const duplicate = await prisma.gift.findFirst({
      where: {
        name: data.name,
        NOT: {
          id,
        },
      },
    });

    if (duplicate) {
      throw new Error("Gift name already exists");
    }
  }

  const updatedGift = await prisma.gift.update({
    where: {
      id,
    },
    data,
    include: {
      category: true,
    },
  });

  // ✅ Clear Redis cache
  await redis.del(ALL_GIFT_CACHE_KEY);
  await redis.del(`gift:${id}`);

  console.log("🗑️ Gift cache cleared");

  return updatedGift;
};

/**
 * Get All Gifts
 */
/**
 * Get All Gifts
 * Optional category wise filter
 */
export const getAllGiftService = async (
  categoryId?: number
) => {
  // ==========================================
  // CACHE KEY
  // ==========================================

  const CACHE_KEY = categoryId
    ? `gift:category:${categoryId}`
    : ALL_GIFT_CACHE_KEY;

  // ==========================================
  // 1. CHECK REDIS
  // ==========================================

  const cached = await redis.get(CACHE_KEY);

  if (cached) {
    console.log(
      categoryId
        ? `✅ Gifts category ${categoryId} from Redis`
        : "✅ All Gifts from Redis"
    );

    return cached;
  }

  console.log(
    categoryId
      ? `📦 Gifts category ${categoryId} from Database`
      : "📦 All Gifts from Database"
  );

  // ==========================================
  // 2. OPTIONAL CATEGORY VALIDATION
  // ==========================================

  if (categoryId) {
    const category =
      await prisma.giftCategory.findUnique({
        where: {
          id: categoryId,
        },
      });

    if (!category) {
      throw new Error("Gift category not found");
    }
  }

  // ==========================================
  // 3. FETCH GIFTS
  // ==========================================

  const gifts = await prisma.gift.findMany({
    where: {
      ...(categoryId && {
        categoryId,
      }),
    },

    include: {
      category: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  // ==========================================
  // 4. SAVE REDIS
  // ==========================================

  await redis.set(CACHE_KEY, gifts, {
    ex: 600,
  });

  return gifts;
};

/**
 * Get Gift By Id
 */
export const getGiftByIdService = async (
  id: number
) => {
  const CACHE_KEY = `gift:${id}`;

  // 1. Check Redis
  const cached = await redis.get(CACHE_KEY);

  if (cached) {
    console.log("✅ Gift from Redis");
    return cached;
  }

  console.log("📦 Gift from Database");

  // 2. Fetch from Database
  const gift = await prisma.gift.findUnique({
    where: {
      id,
    },
    include: {
      category: true,
    },
  });

  if (!gift) {
    throw new Error("Gift not found");
  }

  // 3. Save to Redis
  await redis.set(CACHE_KEY, gift, {
    ex: 600,
  });

  return gift;
};

/**
 * Delete Gift
 */
export const deleteGiftService = async (
  id: number
) => {
  const gift = await prisma.gift.findUnique({
    where: {
      id,
    },
  });

  if (!gift) {
    throw new Error("Gift not found");
  }

  await prisma.gift.delete({
    where: {
      id,
    },
  });

  // ✅ Clear Redis cache
  await redis.del(ALL_GIFT_CACHE_KEY);
  await redis.del(`gift:${id}`);

  console.log("🗑️ Gift cache cleared");
};

/**
 * Change Gift Status
 */
export const changeGiftStatusService = async (
  id: number
) => {
  const gift = await prisma.gift.findUnique({
    where: {
      id,
    },
  });

  if (!gift) {
    throw new Error("Gift not found");
  }

  const updatedGift = await prisma.gift.update({
    where: {
      id,
    },
    data: {
      isLive: !gift.isLive,
    },
  });

  // ✅ Clear Redis cache
  await redis.del(ALL_GIFT_CACHE_KEY);
  await redis.del(`gift:${id}`);

  console.log("🗑️ Gift cache cleared");

  return updatedGift;
};