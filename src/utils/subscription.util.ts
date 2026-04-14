import { SUBSCRIPTION_LIMITS } from "../config/subscription";
import { prisma } from "../prisma/prismaClient";

const resetDailyCountsIfNeeded = async (user: any) => {
  const now = new Date();
  const lastReset = new Date(user.last_reset_at);

  const isNewDay =
    now.getDate() !== lastReset.getDate() ||
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear();

  if (isNewDay) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        daily_swipe_count: 0,
        daily_like_count: 0,
        last_reset_at: now,
      },
    });

    user.daily_swipe_count = 0;
    user.daily_like_count = 0;
  }

  return user;
};


const getUserLimits = (user: any) => {
  const now = new Date();

  // If expired → fallback to FREE
  if (
    user.subscription_expires_at &&
    user.subscription_expires_at < now
  ) {
    return SUBSCRIPTION_LIMITS.FREE;
  }

  return SUBSCRIPTION_LIMITS[userSubscription.type];
};

export const checkSwipeLimit = async (req, res, next) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  await resetDailyCountsIfNeeded(user);

  const limits = getUserLimits(user);

  if (user.daily_swipe_count >= limits.swipeLimit) {
    return res.status(403).json({
      message: "Swipe limit reached",
    });
  }

  next();
};
