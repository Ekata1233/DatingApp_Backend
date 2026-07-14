import { redis } from "../../../lib/redis";
import { prisma } from "../../../prisma/prismaClient";
import { ILaunchConfigPayload } from "./waitlist.types";

const CACHE_KEY = "launchConfig";

/**
 * Clear Launch Config Cache
 */
const clearLaunchConfigCache = async () => {
  await redis.del(CACHE_KEY);
  console.log("🗑️ Launch Config cache cleared");
};
/**
 * discountAmount is a PERCENTAGE (e.g. 50 = 50% off), NOT a rupee amount.
 * finalPrice = originalPrice - (originalPrice * discountPercent / 100)
 * Always computed on the server so it can't be faked or sent stale by any client.
 */
const calcFinalPrice = (originalPrice: unknown, discountPercent: unknown) => {
  const original = Number(originalPrice) || 0;
  const percent = Number(discountPercent) || 0;
  return Math.max(0, Math.round(original - (original * percent) / 100));
};

/**
 * Create or Update Launch Config
 */
export const saveLaunchConfigService = async (
  payload: ILaunchConfigPayload
) => {
  const existing = await prisma.launchConfig.findFirst();

  // Server-computed final price — ignore payload.finalPrice entirely.
  const finalPrice = calcFinalPrice(payload.originalPrice, payload.discountAmount);

  // First time -> Create
   let launchConfig;

  if (!existing) {
    // CREATE
    launchConfig = await prisma.launchConfig.create({
      data: {
        waitlistEnabled: payload.waitlistEnabled ?? true,
        appLaunched: payload.appLaunched ?? false,
        launchDate: payload.launchDate,
        originalPrice: payload.originalPrice ?? 799,
        discountAmount: payload.discountAmount ?? 50,
        finalPrice,
        welcomeCoins: payload.welcomeCoins ?? 100,
        perks: payload.perks,
        totalBenefitsValue: payload.totalBenefitsValue,
        description: payload.description,
      },
    });
  } else {
    // UPDATE
    launchConfig = await prisma.launchConfig.update({
      where: {
        id: existing.id,
      },
      data: {
        waitlistEnabled: payload.waitlistEnabled,
        appLaunched: payload.appLaunched,
        launchDate: payload.launchDate,
        originalPrice: payload.originalPrice,
        discountAmount: payload.discountAmount,
        finalPrice,
        welcomeCoins: payload.welcomeCoins,
        perks: payload.perks,
        totalBenefitsValue: payload.totalBenefitsValue,
        description: payload.description,
      },
    });
  }

  // Clear cache after successful DB operation
  await clearLaunchConfigCache();

  return launchConfig;
};

/**
 * Get Launch Config
 */
export const getLaunchConfigService = async () => {
  const cached = await redis.get(CACHE_KEY);
  if (cached) {
    console.log("✅ Cache Hit: launchConfig");
    return cached;
  }
  console.log("📦 Cache Miss: launchConfig");

  // Fetch from DB
  const launchConfig = await prisma.launchConfig.findFirst();
  // Save to Redis
  if (launchConfig) {
    await redis.set(CACHE_KEY, launchConfig, {
      ex: 600, // 10 minutes
    });
  }
  return launchConfig;
};