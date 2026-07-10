import { prisma } from "../../../prisma/prismaClient";
import { ILaunchConfigPayload } from "./waitlist.types";

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
  if (!existing) {
    return prisma.launchConfig.create({
      data: {
        waitlistEnabled: payload.waitlistEnabled ?? true,
        appLaunched: payload.appLaunched ?? false,
        launchDate: payload.launchDate,

        originalPrice: payload.originalPrice ?? 799,
        discountAmount: payload.discountAmount ?? 50, // percentage
        finalPrice,

        welcomeCoins: payload.welcomeCoins ?? 100,

        perks: payload.perks,

        totalBenefitsValue: payload.totalBenefitsValue,

        description: payload.description,
      },
    });
  }

  // Already exists -> Update same record
  return prisma.launchConfig.update({
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
};

/**
 * Get Launch Config
 */
export const getLaunchConfigService = async () => {
  return prisma.launchConfig.findFirst();
};