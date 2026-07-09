import { prisma } from "../../../prisma/prismaClient";
import { ILaunchConfigPayload } from "./waitlist.types";

/**
 * Create or Update Launch Config
 */
export const saveLaunchConfigService = async (
  payload: ILaunchConfigPayload
) => {
  // Check if config already exists
  const existing = await prisma.launchConfig.findFirst();

  // First time -> Create
  if (!existing) {
    return prisma.launchConfig.create({
      data: {
        waitlistEnabled: payload.waitlistEnabled ?? true,
        appLaunched: payload.appLaunched ?? false,
        launchDate: payload.launchDate,
        waitlistPrice: payload.waitlistPrice ?? 300,
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
      waitlistPrice: payload.waitlistPrice,
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