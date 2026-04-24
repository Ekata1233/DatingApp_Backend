import { prisma } from "../../prisma/prismaClient";

export const upgradeBoostService = async (userId: string, boost_option_id: string) => {
  // 1. Validate BoostOption
  const boostOption = await prisma.boostOption.findUnique({
    where: { id: boost_option_id },
    include: {
      boost: true,
    },
  });

  if (!boostOption) {
    throw new Error("BOOST_OPTION_NOT_FOUND");
  }

  // 2. Create UserBoost (simulate purchase)
  const userBoost = await prisma.userBoost.create({
    data: {
      user_id: userId,
      boost_id: boostOption.boost_id,
      boost_option_id: boostOption.id,
      total_boosts: boostOption.boostCount,
      remaining_boosts: boostOption.boostCount,
      is_active: true,
      start_at: new Date(),
      // optional expiry (example: 7 days)
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return userBoost;
};

export const activateBoostService = async (userId: string, user_boost_id: string) => {
  // 1. Fetch user boost
  const userBoost = await prisma.userBoost.findUnique({
    where: { id: user_boost_id },
  });

  if (!userBoost) {
    throw new Error("BOOST_NOT_FOUND");
  }

  // 2. Ownership check
  if (userBoost.user_id !== userId) {
    throw new Error("UNAUTHORIZED");
  }

  // 3. Remaining check
  if (userBoost.remaining_boosts <= 0) {
    throw new Error("NO_BOOST_LEFT");
  }

  // 4. Expiry check
  if (userBoost.expires_at && userBoost.expires_at < new Date()) {
    throw new Error("BOOST_EXPIRED");
  }

  // 5. Check active boost
  const activeBoost = await prisma.boostUsage.findFirst({
    where: {
      user_id: userId,
      is_active: true,
    },
  });

  if (activeBoost) {
    throw new Error("BOOST_ALREADY_ACTIVE");
  }

  // 6. Get duration
  const boostOption = await prisma.boostOption.findUnique({
    where: { id: userBoost.boost_option_id },
  });

  const duration = boostOption?.timePerBoost || 30;

  const now = new Date();
  const endTime = new Date(now.getTime() + duration * 60 * 1000);

  // 7. Transaction
  const result = await prisma.$transaction(async (tx) => {
    const usage = await tx.boostUsage.create({
      data: {
        user_boost_id,
        user_id: userId,
        duration,
        started_at: now,
        ended_at: endTime,
        is_active: true,
      },
    });

    await tx.userBoost.update({
      where: { id: user_boost_id },
      data: {
        remaining_boosts: {
          decrement: 1,
        },
      },
    });

    return usage;
  });

  return result;
};
