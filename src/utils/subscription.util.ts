import { SUBSCRIPTION_LIMITS, SubscriptionType } from "../config/subscription";
import { prisma } from "../prisma/prismaClient";

type Subscription = {
  type: SubscriptionType;
  expires_at: Date;
  status: string;
};

// ✅ Reset daily counts
export const resetDailyCountsIfNeeded = async (subscription: any) => {
  const now = new Date();
  const lastReset = new Date(subscription.last_reset_at);

  const isNewDay =
    now.getDate() !== lastReset.getDate() ||
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear();

  if (isNewDay) {
    const updated = await prisma.userSubscription.update({
      where: { id: subscription.id },
      data: {
        daily_swipe_count: 0,
        daily_like_count: 0,
        last_reset_at: now,
      },
    });

    return updated;
  }

  return subscription;
};

export const getUserLimits = (subscription: Subscription | null) => {
  const now = new Date();

  // ❌ No subscription → FREE
  if (!subscription) {
    return SUBSCRIPTION_LIMITS.FREE;
  }

  // ❌ Expired → FREE
  if (subscription.expires_at < now || subscription.status !== "ACTIVE") {
    return SUBSCRIPTION_LIMITS.FREE;
  }

  // ✅ Active subscription
  return SUBSCRIPTION_LIMITS[subscription.type];
};
