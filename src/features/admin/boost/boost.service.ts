import { prisma } from "../../../prisma/prismaClient";
import { BoostType, Prisma } from "@prisma/client";
import { BoostFeaturesInput, BoostInfoInput, CreateBoostInput } from "./boost.validation";


export const createBoostService = async (data: CreateBoostInput) => {
  const { options, ...boostData } = data;

  if (!Object.values(BoostType).includes(boostData.name as BoostType)) {
    throw new Error("Invalid boost type");
  }

  const boostName = boostData.name as BoostType;

  const existingBoost = await prisma.boost.findFirst({
    where: { name: boostName },
    include: { options: true },
  });

  if (existingBoost) {
    const existingOptionIds = existingBoost.options.map((o) => o.id);

    const incomingOptionIds = options
      .filter((o) => o.id)
      .map((o) => o.id);

    // deactivate removed options
    const removedOptionIds = existingOptionIds.filter(
      (id) => !incomingOptionIds.includes(id)
    );

    await prisma.boostOption.updateMany({
      where: {
        id: {
          in: removedOptionIds,
        },
      },
      data: {
        is_active: false,
      },
    });

    // update/create options
    for (const opt of options) {
      /*
       * NEW LOGIC:
       *
       * If ID is provided -> update by ID.
       *
       * If ID is NOT provided but the same boostCount already exists
       * -> update that existing option instead of creating a new one.
       *
       * Otherwise -> create a new option.
       */

      if (opt.id) {
        await prisma.boostOption.update({
          where: { id: opt.id },
          data: {
            label: opt.label,
            boostCount: opt.boostCount,
            timePerBoost: opt.timePerBoost,
            pricePerBoost: opt.pricePerBoost,
            discounted_price: opt.discounted_price ?? 0,
            discount_percent: opt.discount_percent ?? null,
            totalPrice: opt.totalPrice,
            is_best_value: opt.is_best_value ?? false,
            is_popular: opt.is_popular ?? false,
            is_active: true,
          },
        });
      } else {
        // NEW: find existing option by boostCount
        const existingOption = existingBoost.options.find(
          (existing) =>
            existing.boostCount === opt.boostCount
        );

        if (existingOption) {
          // Same boostCount -> UPDATE existing option
          await prisma.boostOption.update({
            where: {
              id: existingOption.id,
            },
            data: {
              label: opt.label,
              boostCount: opt.boostCount,
              timePerBoost: opt.timePerBoost,
              pricePerBoost: opt.pricePerBoost,
              discounted_price: opt.discounted_price ?? 0,
              discount_percent: opt.discount_percent ?? null,
              totalPrice: opt.totalPrice,
              is_best_value: opt.is_best_value ?? false,
              is_popular: opt.is_popular ?? false,
              is_active: true,
            },
          });
        } else {
          // Different boostCount -> CREATE new option
          await prisma.boostOption.create({
            data: {
              boost_id: existingBoost.id,
              label: opt.label,
              boostCount: opt.boostCount,
              timePerBoost: opt.timePerBoost,
              pricePerBoost: opt.pricePerBoost,
              discounted_price: opt.discounted_price ?? 0,
              discount_percent: opt.discount_percent ?? null,
              totalPrice: opt.totalPrice,
              is_best_value: opt.is_best_value ?? false,
              is_popular: opt.is_popular ?? false,
            },
          });
        }
      }
    }

    return prisma.boost.findUnique({
      where: {
        id: existingBoost.id,
      },
      include: {
        options: {
          where: {
            is_active: true,
          },
        },
      },
    });
  }

  // CREATE FLOW
  return prisma.boost.create({
    data: {
      name: boostName,
      title: boostData.title,
      description: boostData.description,

      options: {
        create: options.map((opt) => ({
          label: opt.label,
          boostCount: opt.boostCount,
          timePerBoost: opt.timePerBoost,
          pricePerBoost: opt.pricePerBoost,
          discounted_price: opt.discounted_price ?? 0,
          discount_percent: opt.discount_percent ?? null,
          totalPrice: opt.totalPrice,
          is_best_value: opt.is_best_value ?? false,
          is_popular: opt.is_popular ?? false,
        })),
      },
    },

    include: {
      options: true,
    },
  });
};

// ✅ GET API
export const getAllBoostsService = async () => {
  const boosts = await prisma.boost.findMany({
    include: {
      options: {
        where: {
          is_active: true,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return boosts.map((boost) => ({
    // Basic Boost Data
    id: boost.id,
    name: boost.name,
    title: boost.title,
    description: boost.description,
    is_active: boost.is_active,

    // 1. FEATURES
    boostDuration: boost.boostDuration,
    singleBoostWalletPrice: boost.singleBoostWalletPrice,
    visibilityMultiplier: boost.visibilityMultiplier,

    // 2. OPTIONS
    options: boost.options,

    // 3. INFO
    whyBoostWorks: boost.whyBoostWorks,
    boostVsSuperBoost: boost.boostVsSuperBoost,

    created_at: boost.created_at,
    updated_at: boost.updated_at,
  }));
};

// ✅ GET API for mob
export const getBoostsService = async (userId: string) => {
  const [boosts, userBoosts] = await Promise.all([
    prisma.boost.findMany({
      include: {
        options: {
          where: {
            is_active: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    }),

    prisma.userBoost.findMany({
      where: {
        user_id: userId,
        is_active: true,
      },
      select: {
        total_boosts: true,
      },
    }),
  ]);

  const availableBoost = userBoosts.reduce(
    (total, boost) => total + boost.total_boosts,
    0
  );

  return {
    availableBoost,

    boosts: boosts.map((boost) => ({
      // Basic Boost Data
      id: boost.id,
      name: boost.name,
      title: boost.title,
      description: boost.description,
      is_active: boost.is_active,

      // 1. FEATURES
      boostDuration: boost.boostDuration,
      singleBoostWalletPrice: boost.singleBoostWalletPrice,
      visibilityMultiplier: boost.visibilityMultiplier,

      // 2. OPTIONS
      options: boost.options,

      // 3. INFO
      whyBoostWorks: boost.whyBoostWorks,
      boostVsSuperBoost: boost.boostVsSuperBoost,

      created_at: boost.created_at,
      updated_at: boost.updated_at,
    })),
  };
};
// ============================================================
// BOOST INFO CREATE / UPDATE
// ============================================================

export const createOrUpdateBoostInfoService = async (
  data: BoostInfoInput
) => {
  const boostName = data.name as BoostType;

  // Existing Boost pack must already exist
  const existingBoost = await prisma.boost.findUnique({
    where: {
      name: boostName,
    },
  });

  if (!existingBoost) {
    throw new Error(
      `Boost with name ${data.name} does not exist. Create the boost pack first.`
    );
  }

  /*
   * IMPORTANT:
   *
   * If info already exists:
   * old whyBoostWorks is completely replaced
   * old boostVsSuperBoost is completely replaced
   *
   * If info does not exist:
   * it is simply added.
   *
   * Existing pack/options/prices are NOT touched.
   */

  return prisma.boost.update({
    where: {
      id: existingBoost.id,
    },

    data: {
      whyBoostWorks: data.whyBoostWorks,
      boostVsSuperBoost: data.boostVsSuperBoost,
    },

    include: {
      options: {
        where: {
          is_active: true,
        },
      },
    },
  });
};

// ============================================================
// BOOST INFO GET
// ============================================================

export const getBoostInfoService = async (name: BoostType) => {
  const boost = await prisma.boost.findUnique({
    where: {
      name,
    },
    select: {
      id: true,
      name: true,
      whyBoostWorks: true,
      boostVsSuperBoost: true,
    },
  });

  if (!boost) {
    throw new Error("Boost not found");
  }

  return boost;
};

// ============================================================
// BOOST INFO DELETE
// ============================================================

export const deleteBoostInfoService = async (name: BoostType) => {
  const existingBoost = await prisma.boost.findUnique({
    where: {
      name,
    },
  });

  if (!existingBoost) {
    throw new Error("Boost not found");
  }

  /*
   * ONLY delete Boost Info.
   *
   * The actual Boost pack remains.
   * BoostOption remains.
   * UserBoost remains.
   * BoostPurchase remains.
   */

  return prisma.boost.update({
    where: {
      id: existingBoost.id,
    },

    data: {
      whyBoostWorks: Prisma.JsonNull,
      boostVsSuperBoost: Prisma.JsonNull,
    },

    select: {
      id: true,
      name: true,
      whyBoostWorks: true,
      boostVsSuperBoost: true,
    },
  });
};

// ============================================================
// CREATE / UPDATE BOOST FEATURES
// ============================================================

export const createOrUpdateBoostFeaturesService = async (
  data: BoostFeaturesInput
) => {
  const boostName = data.name as BoostType;

  // Find existing Boost pack
  const existingBoost = await prisma.boost.findUnique({
    where: {
      name: boostName,
    },
  });

  if (!existingBoost) {
    throw new Error(
      `Boost with name ${data.name} does not exist. Create the boost pack first.`
    );
  }

  /*
   * Same name:
   * OLD FEATURES are replaced with NEW FEATURES.
   *
   * Existing:
   * - Boost options
   * - Prices
   * - UserBoost
   * - BoostPurchase
   * - Why Boost Works
   * - Boost vs Super Boost
   *
   * are NOT changed.
   */

  return prisma.boost.update({
    where: {
      id: existingBoost.id,
    },

    data: {
      boostDuration: data.boostDuration,
      singleBoostWalletPrice: data.singleBoostWalletPrice,
      visibilityMultiplier: data.visibilityMultiplier,
    },

    select: {
      id: true,
      name: true,
      boostDuration: true,
      singleBoostWalletPrice: true,
      visibilityMultiplier: true,
    },
  });
};

// ============================================================
// GET BOOST FEATURES
// ============================================================

export const getBoostFeaturesService = async (
  name: BoostType
) => {
  const boost = await prisma.boost.findUnique({
    where: {
      name,
    },

    select: {
      id: true,
      name: true,
      boostDuration: true,
      singleBoostWalletPrice: true,
      visibilityMultiplier: true,
    },
  });

  if (!boost) {
    throw new Error("Boost not found");
  }

  return boost;
};

// ============================================================
// RESET BOOST FEATURES
// ============================================================

export const resetBoostFeaturesService = async (
  name: BoostType
) => {
  const existingBoost = await prisma.boost.findUnique({
    where: {
      name,
    },
  });

  if (!existingBoost) {
    throw new Error("Boost not found");
  }

  /*
   * These fields are NOT nullable.
   *
   * Therefore DELETE means RESET TO DEFAULT.
   */

  return prisma.boost.update({
    where: {
      id: existingBoost.id,
    },

    data: {
      boostDuration: 30,
      singleBoostWalletPrice: 60,
      visibilityMultiplier: 10,
    },

    select: {
      id: true,
      name: true,
      boostDuration: true,
      singleBoostWalletPrice: true,
      visibilityMultiplier: true,
    },
  });
};