
import {
  BillingCycle,
  Prisma,
  ResetPeriod,
  PackageStatus,
  PaymentStatus,
} from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";

// Helper: Calculate end date based on billing cycle
function calculateEndDate(
  billingCycle: BillingCycle,
  startDate: Date = new Date()
): Date | null {
  const endDate = new Date(startDate);

  switch (billingCycle) {
    case "MONTHLY":
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case "QUARTERLY":
      endDate.setMonth(endDate.getMonth() + 3);
      break;
    case "HALF_YEARLY":
      endDate.setMonth(endDate.getMonth() + 6);
      break;
    case "YEARLY":
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    case "LIFETIME":
      endDate.setFullYear(endDate.getFullYear() + 100);
      break;
    default:
      throw new Error(`Invalid billing cycle: ${billingCycle}`);
  }

  return endDate;
}

// Helper: Calculate reset date based on reset period
function calculateResetDate(resetPeriod: ResetPeriod): Date {
  const now = new Date();

  switch (resetPeriod) {
    case "NONE":
      // 100 years later (effectively never resets)
      return new Date(now.getFullYear() + 100, now.getMonth(), now.getDate());
    case "DAILY":
      // Tomorrow at midnight
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    case "WEEKLY":
      // 7 days from now
      const weekly = new Date(now);
      weekly.setDate(weekly.getDate() + 7);
      return weekly;
    case "MONTHLY":
      // 1 month from now
      const monthly = new Date(now);
      monthly.setMonth(monthly.getMonth() + 1);
      return monthly;
    case "YEARLY":
      // 1 year from now
      const yearly = new Date(now);
      yearly.setFullYear(yearly.getFullYear() + 1);
      return yearly;
    default:
      throw new Error(
        `Invalid reset period '${resetPeriod}'. Valid values: NONE, DAILY, WEEKLY, MONTHLY, YEARLY.`
      );
  }
}

// Helper: Expire previous active package
async function expirePreviousPackage(
  userId: string,
  tx: Prisma.TransactionClient
): Promise<void> {
  const activePackage = await tx.userPackage.findFirst({
    where: {
      user_id: userId,
      status: "ACTIVE",
    },
  });

  if (activePackage) {
    await tx.userPackage.update({
      where: { id: activePackage.id },
      data: {
        status: "EXPIRED",
        endDate: new Date(),
      },
    });
  }
}

// Helper: Initialize plan usage records
async function initializePlanUsage(
  userId: string,
  packageId: string,
  tx: Prisma.TransactionClient
): Promise<number> {
  const planLimits = await tx.planLimit.findMany({
    where: {
      packageId,
      enabled: true,
    },
    include: {
      feature: true,
    },
  });

  let featuresInitialized = 0;

  for (const limit of planLimits) {
    if (!limit.enabled) continue;

    const resetAt = calculateResetDate(limit.resetPeriod);

    await tx.userPlanUsage.upsert({
      where: {
        userId_featureId: {
          userId,
          featureId: limit.featureId,
        },
      },
      create: {
        userId,
        featureId: limit.featureId,
        used: 0,
        resetAt,
      },
      update: {
        used: 0,
        resetAt,
      },
    });

    featuresInitialized++;
  }

  return featuresInitialized;
}

// Main service: Activate package after successful payment
export const activatePackageService = async (
  userId: string,
  paymentId: string
) => {
  if (!userId) throw new Error("User ID is required");
  if (!paymentId) throw new Error("Payment ID is required");

  return await prisma.$transaction(async (tx: any) => {
    // 1. Verify Payment
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new Error("Payment is not successful. Cannot activate package.");
    }

    // 2. Get PackagePrice and verify
    const price = await tx.packagePrice.findUnique({
      where: { id: payment.priceId || undefined },
      include: {
        package: true,
      },
    });

    if (!price) {
      throw new Error("Package price not found for this payment");
    }

    if (!price.active) {
      throw new Error("This package price is no longer active");
    }

    const pkg = price.package;

    if (!pkg.active) {
      throw new Error("This package is no longer available");
    }

    // 3. Expire existing active package
    await expirePreviousPackage(userId, tx);

    // 4. Calculate dates
    const startDate = new Date();
    const endDate = calculateEndDate(price.billingCycle, startDate);

    // 5. Create UserPackage
    const userPackage = await tx.userPackage.create({
      data: {
        user_id: userId,
        packageId: pkg.id,
        priceId: price.id,
        purchasePrice: price.price,
        purchaseOriginalPrice: price.originalPrice,
        purchaseDiscount: price.discountPercent,
        startDate,
        endDate,
        status: "ACTIVE",
        paymentId,
        currentPackageId: pkg.id,
        autoRenew: false,
      },
      include: {
        package: {
          include: {
            limits: {
              where: { enabled: true },
              include: {
                feature: true,
              },
            },
          },
        },
        price: true,
      },
    });

    // 6. Initialize UserPlanUsage
    const featuresInitialized = await initializePlanUsage(
      userId,
      pkg.id,
      tx
    );

    return {
      package: {
        id: pkg.id,
        name: pkg.name,
        slug: pkg.slug,
        tagline: pkg.tagline,
        badgeLabel: pkg.badgeLabel,
        discoveryPool: pkg.discoveryPool,
      },
      userPackage: {
        id: userPackage.id,
        startDate: userPackage.startDate,
        endDate: userPackage.endDate,
        status: userPackage.status,
        autoRenew: userPackage.autoRenew,
      },
      billingCycle: price.billingCycle,
      purchasePrice: price.price,
      expiresAt: endDate,
      featuresInitialized,
    };
  });
};

// Helper: Check user feature access
export const checkUserFeatureAccessService = async (
  userId: string,
  featureCode: string
) => {
  // Get user's active package
  const activePackage = await prisma.userPackage.findFirst({
    where: {
      user_id: userId,
      status: "ACTIVE",
      endDate: {
        gte: new Date(),
      },
    },
    include: {
      package: {
        include: {
          limits: {
            where: { enabled: true },
            include: {
              feature: true,
            },
          },
        },
      },
    },
  });

  if (!activePackage) {
    // No active package - check if feature is available for free users
    const feature = await prisma.packageFeature.findUnique({
      where: { code: featureCode },
    });

    if (!feature) {
      throw new Error(`Feature not found: ${featureCode}`);
    }

    return {
      enabled: false,
      unlimited: false,
      remaining: 0,
      resetAt: null,
      message: "No active subscription",
    };
  }

  // Find the feature limit in the package
  const featureLimit = activePackage.package.limits.find(
    (limit) => limit.feature.code === featureCode
  );

  if (!featureLimit || !featureLimit.enabled) {
    return {
      enabled: false,
      unlimited: false,
      remaining: 0,
      resetAt: null,
      message: "Feature not included in your package",
    };
  }

  // Get user's usage for this feature
  const usage = await prisma.userPlanUsage.findUnique({
    where: {
      userId_featureId: {
        userId,
        featureId: featureLimit.featureId,
      },
    },
  });

  if (featureLimit.unlimited) {
    return {
      enabled: true,
      unlimited: true,
      remaining: null,
      resetAt: usage?.resetAt || null,
      message: "Unlimited access",
    };
  }

  const used = usage?.used || 0;
  const remaining = featureLimit.limit ? featureLimit.limit - used : 0;

  // Check if reset is needed
  if (usage && new Date() > usage.resetAt) {
    // Reset the usage
    const newResetAt = calculateResetDate(featureLimit.resetPeriod);

    await prisma.userPlanUsage.update({
      where: { id: usage.id },
      data: {
        used: 0,
        resetAt: newResetAt,
      },
    });

    return {
      enabled: true,
      unlimited: false,
      remaining: featureLimit.limit || 0,
      resetAt: newResetAt,
      message: "Usage reset",
    };
  }

  return {
    enabled: remaining > 0,
    unlimited: false,
    remaining: Math.max(0, remaining),
    resetAt: usage?.resetAt || null,
    message: remaining > 0 ? "Access granted" : "Limit reached",
  };
};

// Helper: Record feature usage
export const recordFeatureUsageService = async (
  userId: string,
  featureCode: string
) => {
  const access = await checkUserFeatureAccessService(userId, featureCode);

  if (!access.enabled) {
    throw new Error(access.message || "Feature not available");
  }

  if (access.unlimited) {
    return { success: true, message: "Usage recorded (unlimited)" };
  }

  // Get feature ID
  const feature = await prisma.packageFeature.findUnique({
    where: { code: featureCode },
  });

  if (!feature) {
    throw new Error(`Feature not found: ${featureCode}`);
  }

  // Increment usage
  await prisma.userPlanUsage.update({
    where: {
      userId_featureId: {
        userId,
        featureId: feature.id,
      },
    },
    data: {
      used: { increment: 1 },
      lastUsedAt: new Date(),
    },
  });

  return {
    success: true,
    remaining: access.remaining! - 1,
    message: "Usage recorded successfully",
  };
};

// Main function to activate package (called from payment.handler.ts)
export async function processPackageActivation(
  tx: any,
  payment: any
) {
  // 1. Get package price with package info from payment
  const price = await tx.packagePrice.findUnique({
    where: { id: payment.priceId },
    include: {
      package: true,
    },
  });

  if (!price) {
    throw new Error("Package price not found");
  }

  if (!price.active) {
    throw new Error("This package price is no longer active");
  }

  const pkg = price.package;

  if (!pkg.active) {
    throw new Error("This package is no longer available");
  }

  // 2. Expire existing active package
  await expirePreviousPackage(payment.userId, tx);

  // 3. Calculate dates
  const startDate = new Date();
  const endDate = calculateEndDate(price.billingCycle, startDate);

  // 4. Create UserPackage
  const userPackage = await tx.userPackage.create({
    data: {
      user_id: payment.userId,
      packageId: pkg.id,
      priceId: price.id,
      purchasePrice: price.price,
      purchaseOriginalPrice: price.originalPrice,
      purchaseDiscount: price.discountPercent,
      startDate,
      endDate,
      status: "ACTIVE",
      paymentId: payment.id,
      currentPackageId: pkg.id,
      autoRenew: false,
    },
  });

  // 5. Initialize feature usage
  const featuresInitialized = await initializePlanUsage(
    payment.userId,
    pkg.id,
    tx
  );

  console.log(`✅ Package activated: ${pkg.name} for user ${payment.userId}`);
  console.log(`📅 Expires: ${endDate}`);
  console.log(`🎯 Features initialized: ${featuresInitialized}`);

  return {
    success: true,
    package: {
      id: pkg.id,
      name: pkg.name,
      slug: pkg.slug,
      billingCycle: price.billingCycle,
    },
    userPackageId: userPackage.id,
    startDate,
    endDate,
    featuresInitialized,
  };
}