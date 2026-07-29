
import {
  BillingCycle,
  Prisma,
} from "@prisma/client";
import { initializePlanUsage } from "./package.handler";

type PackageAction =
  | 'NEW_PURCHASE'
  | 'RENEW'
  | 'UPGRADE'
  | 'DOWNGRADE'
  | 'ACTIVATE_PENDING'
  | 'LIFETIME_OWNED'
  | 'DUPLICATE_PENDING';

interface PackagePriority {
  [key: string]: number;
}

interface SubscriptionAction {
  type: PackageAction;
  currentPackage?: any;
  reason?: string;
}

// constants.ts - Package priorities configuration
const PACKAGE_PRIORITY: PackagePriority = {
  'VIP_ELITE': 3,
  'VIP': 2,
  'PREMIUM': 1,
};

// helpers.ts - All helper functions

/**
 * Get the priority of a package by its slug or ID
 */
function getPackagePriority(packageSlug: string): number {
  return PACKAGE_PRIORITY[packageSlug] || 0;
}

// Main function to activate package (called from payment.handler.ts)
export async function processPackageActivation(
  tx: any,
  payment: any
) {
  // 1. Get package price with package info from payment
  if (!payment.packagePriceId) {
    throw new Error("Package price not found in payment");
  }

  const price = await tx.packagePrice.findUnique({
    where: {
      id: payment.packagePriceId,
    },
    include: {
      package: true,
    },
  });

  console.log("price", price)

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

  // 2. Determine what action to take based on current subscription state
  const action = await determineSubscriptionAction(
    payment.userId,
    pkg,
    { ...price, paymentId: payment.id },
    tx
  );

  console.log(`📋 Subscription action determined: ${action.type}`);

  let result;

  switch (action.type) {
    case 'DUPLICATE_PENDING':
      // CASE 7 & 8: Return existing package for idempotency
      console.log(`⚠️ Duplicate request detected: ${action.reason}`);
      return {
        success: true,
        package: {
          id: action.currentPackage.package.id,
          name: action.currentPackage.package.name,
          slug: action.currentPackage.package.slug,
          billingCycle: price.billingCycle,
        },
        userPackageId: action.currentPackage.id,
        startDate: action.currentPackage.startDate,
        endDate: action.currentPackage.endDate,
        featuresInitialized: 0,
        message: action.reason,
      };

    case 'LIFETIME_OWNED':
      // CASE 6: User already owns lifetime package
      console.log(`🚫 Lifetime package already owned`);
      throw new Error("You already own this package.");

    case 'NEW_PURCHASE':
      // CASE 1 & 5: New purchase or expired package
      console.log(`🆕 Processing new purchase`);
      result = await activateNewSubscription(
        payment.userId,
        pkg,
        price,
        payment,
        tx
      );
      break;

    case 'RENEW':
      // CASE 2: Renew existing package
      console.log(`🔄 Renewing existing package`);
      result = await renewSubscription(
        action.currentPackage,
        price,
        tx
      );
      break;

    case 'UPGRADE':
      // CASE 3: Upgrade to higher tier
      console.log(`⬆️ Upgrading from ${action.currentPackage.package.slug} to ${pkg.slug}`);
      result = await upgradeSubscription(
        payment.userId,
        action.currentPackage,
        pkg,
        price,
        payment,
        tx
      );
      break;

    case 'DOWNGRADE':
      // CASE 4: Schedule downgrade
      console.log(`⬇️ Scheduling downgrade from ${action.currentPackage.package.slug} to ${pkg.slug}`);
      result = await scheduleDowngrade(
        payment.userId,
        action.currentPackage,
        pkg,
        price,
        payment,
        tx
      );
      break;

    default:
      throw new Error(`Unknown subscription action: ${action.type}`);
  }

  // 4. Log the result
  console.log(`✅ Package ${action.type === 'DOWNGRADE' ? 'scheduled' : 'activated'}: ${pkg.name} for user ${payment.userId}`);
  console.log(`📅 ${action.type === 'DOWNGRADE' ? 'Will start' : 'Expires'}: ${result.endDate}`);

  if (result.featuresInitialized > 0) {
    console.log(`🎯 Features initialized: ${result.featuresInitialized}`);
  }

  // 5. Return consistent response format
  return {
    success: true,
    package: {
      id: pkg.id,
      name: pkg.name,
      slug: pkg.slug,
      billingCycle: price.billingCycle,
    },
    userPackageId: result.userPackage.id,
    startDate: result.startDate,
    endDate: result.endDate,
    featuresInitialized: result.featuresInitialized,
    action: action.type, // Include action type for monitoring/logging
  };
}

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

/**
 * Determine what subscription action to take based on current and new package
 */
async function determineSubscriptionAction(
  userId: string,
  newPackage: any,
  newPrice: any,
  tx: any
): Promise<SubscriptionAction> {
  // Check for idempotency - if this payment was already processed
  // This handles CASE 8: PAYMENT WEBHOOK RETRY
  const existingPackage = await getPackageByPaymentId(newPrice.paymentId, tx);
  if (existingPackage) {
    return {
      type: 'DUPLICATE_PENDING',
      currentPackage: existingPackage,
      reason: 'Payment already processed',
    };
  }

  // Check for lifetime package ownership
  // This handles CASE 6: LIFETIME PACKAGE
  const lifetimePackage = await getLifetimePackage(userId, tx);
  if (lifetimePackage && lifetimePackage.package.slug !== newPackage.slug) {
    return {
      type: 'LIFETIME_OWNED',
      currentPackage: lifetimePackage,
      reason: 'User already owns a lifetime package',
    };
  }

  const activePackage = await getActivePackage(userId, tx);

  // CASE 1 & CASE 5: No active package or expired package
  if (!activePackage) {
    return {
      type: 'NEW_PURCHASE',
    };
  }

  // CASE 2: Same package renewal
  if (activePackage.package.slug === newPackage.slug) {
    return {
      type: 'RENEW',
      currentPackage: activePackage,
    };
  }

  // Compare priorities for upgrade/downgrade decisions
  const currentPriority = getPackagePriority(activePackage.package.slug);
  const newPriority = getPackagePriority(newPackage.slug);

  // CASE 3: Upgrade (higher priority package)
  if (newPriority > currentPriority) {
    return {
      type: 'UPGRADE',
      currentPackage: activePackage,
    };
  }

  // CASE 4: Downgrade (lower priority package)
  if (newPriority < currentPriority) {
    // CASE 7: Check for existing pending downgrade
    const pendingPackage = await getPendingPackage(userId, tx);
    if (pendingPackage) {
      return {
        type: 'DUPLICATE_PENDING',
        currentPackage: pendingPackage,
        reason: 'User already has a pending downgrade',
      };
    }

    return {
      type: 'DOWNGRADE',
      currentPackage: activePackage,
    };
  }

  // Same priority but different packages (edge case)
  return {
    type: 'NEW_PURCHASE',
    currentPackage: activePackage,
  };
}

/**
 * Get user's currently active package
 */
async function getActivePackage(userId: string, tx: any) {
  return tx.userPackage.findFirst({
    where: {
      user_id: userId,
      status: 'ACTIVE',
      endDate: {
        gt: new Date(), // Only return non-expired packages
      },
    },
    include: {
      package: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get user's pending downgrade package
 */
async function getPendingPackage(userId: string, tx: any) {
  return tx.userPackage.findFirst({
    where: {
      user_id: userId,
      status: 'PENDING',
    },
    include: {
      package: true,
    },
  });
}

/**
 * Get user's lifetime package if exists
 */
async function getLifetimePackage(userId: string, tx: any) {
  return tx.userPackage.findFirst({
    where: {
      user_id: userId,
      status: 'ACTIVE',
      package: {
        slug: {
          contains: 'LIFETIME',
          mode: 'insensitive',
        },
      },
    },
    include: {
      package: true,
    },
  });
}

/**
 * Check if payment has already been processed (idempotency)
 */
async function getPackageByPaymentId(paymentId: string, tx: any) {
  return tx.userPackage.findFirst({
    where: {
      paymentId: paymentId,
    },
    include: {
      package: true,
    },
  });
}

/**
 * CASE 1 & CASE 5: Activate new subscription
 */
async function activateNewSubscription(
  userId: string,
  pkg: any,
  price: any,
  payment: any,
  tx: any
) {
  const startDate = new Date();
  const endDate = calculateEndDate(price.billingCycle, startDate);

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
      status: 'ACTIVE',
      paymentId: payment.id,
      currentPackageId: pkg.id,
      autoRenew: false,
    },
  });

  // Initialize feature usage for new active packages
  const featuresInitialized = await initializePlanUsage(userId, pkg.id, tx);

  return {
    userPackage,
    startDate,
    endDate,
    featuresInitialized,
  };
}

/**
 * CASE 2: Renew existing subscription by extending end date
 */
async function renewSubscription(
  currentPackage: any,
  price: any,
  tx: any
) {
  // Calculate new end date by extending from current end date
  // This prevents overlapping subscriptions
  const newEndDate = calculateEndDate(
    price.billingCycle,
    new Date(currentPackage.endDate)
  );

  // Update the existing active package instead of creating new one
  const updatedPackage = await tx.userPackage.update({
    where: {
      id: currentPackage.id,
    },
    data: {
      endDate: newEndDate,
      purchasePrice: price.price,
      purchaseOriginalPrice: price.originalPrice,
      purchaseDiscount: price.discountPercent,
    },
  });

  return {
    userPackage: updatedPackage,
    startDate: currentPackage.startDate,
    endDate: newEndDate,
    featuresInitialized: 0, // No new features to initialize for renewal
  };
}

/**
 * CASE 3: Upgrade subscription immediately
 */
async function upgradeSubscription(
  userId: string,
  currentPackage: any,
  pkg: any,
  price: any,
  payment: any,
  tx: any
) {
  // Expire the current package immediately
  await expirePreviousPackage(userId, tx);

  // Activate the new upgraded package immediately
  return activateNewSubscription(userId, pkg, price, payment, tx);
}

/**
 * CASE 4: Schedule downgrade for when current package expires
 */
async function scheduleDowngrade(
  userId: string,
  currentPackage: any,
  pkg: any,
  price: any,
  payment: any,
  tx: any
) {
  // Schedule start date after current package expires
  const startDate = new Date(currentPackage.endDate);
  const endDate = calculateEndDate(price.billingCycle, startDate);

  // Create pending package - don't initialize features yet
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
      status: 'PENDING',
      paymentId: payment.id,
      currentPackageId: pkg.id,
      autoRenew: false,
    },
  });

  // Don't initialize features for pending packages
  // They will be initialized when the package becomes active

  return {
    userPackage,
    startDate,
    endDate,
    featuresInitialized: 0,
  };
}