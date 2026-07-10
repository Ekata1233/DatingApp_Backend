import { prisma } from "../../../prisma/prismaClient";
import { ILaunchConfigPayload } from "./waitlist.types";

/**
 * Create or Update Launch Config
 */
export const saveLaunchConfigService = async (
  payload: ILaunchConfigPayload
) => {
  const existing = await prisma.launchConfig.findFirst();

  if (!existing) {
    return prisma.launchConfig.create({
      data: {
        waitlistEnabled: payload.waitlistEnabled ?? true,
        appLaunched: payload.appLaunched ?? false,
        launchDate: payload.launchDate,

        originalPrice: payload.originalPrice ?? 799,
        discountAmount: payload.discountAmount ?? 500,
        finalPrice: payload.finalPrice ?? 299,

        welcomeCoins: payload.welcomeCoins ?? 100,

        perks: payload.perks,

        totalBenefitsValue: payload.totalBenefitsValue,

        description: payload.description,
      },
    });
  }

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
      finalPrice: payload.finalPrice,

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