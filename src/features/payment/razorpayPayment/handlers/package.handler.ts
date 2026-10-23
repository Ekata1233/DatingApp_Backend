
import {
  BillingCycle,
  PackageStatus,
  Payment,
  PaymentPurpose,
  PaymentStatus,
  Prisma,
} from "@prisma/client";

// Use the same priority rules as your wallet service.
// Prefer importing your existing helper if it is exported.
const PACKAGE_PRIORITY: Record<string, number> = {
  premium: 1,
  vip: 2,
  "vip-elite": 3,
};

type SubscriptionAction =
  | "NEW_PURCHASE"
  | "RENEW"
  | "UPGRADE"
  | "DOWNGRADE";

function getPackagePriority(slug: string): number {
  return PACKAGE_PRIORITY[slug.toLowerCase()] ?? 0;
}

function calculatePackageEndDate(
  start: Date,
  cycle: BillingCycle,
  months: number | null,
): Date | null {
  if (cycle === BillingCycle.LIFETIME) {
    return null;
  }

  const duration =
    months ??
    ({
      MONTHLY: 1,
      QUARTERLY: 3,
      HALF_YEARLY: 6,
      YEARLY: 12,
    } as Record<string, number>)[cycle];

  if (!duration || duration <= 0) {
    throw new Error("INVALID_PACKAGE_DURATION");
  }

  const result = new Date(start);
  const originalDay = result.getUTCDate();

  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + duration);

  const lastDay = new Date(
    Date.UTC(
      result.getUTCFullYear(),
      result.getUTCMonth() + 1,
      0,
    ),
  ).getUTCDate();

  result.setUTCDate(Math.min(originalDay, lastDay));

  return result;
}

export async function fulfillPackagePurchase(
  tx: Prisma.TransactionClient,
  payment: Payment,
) {
  // ==========================================
  // 1. VALIDATE PAYMENT
  // ==========================================

  if (payment.purpose !== PaymentPurpose.PACKAGE) {
    throw new Error("INVALID_PAYMENT_PURPOSE");
  }

  if (payment.status !== PaymentStatus.COMPLETED) {
    throw new Error("PAYMENT_NOT_COMPLETED");
  }

  if (!payment.packagePriceId) {
    throw new Error("PACKAGE_PRICE_MISSING");
  }

  if (!payment.payment_id?.startsWith("pay_")) {
    throw new Error("RAZORPAY_PAYMENT_ID_MISSING");
  }

  // ==========================================
  // 2. IDEMPOTENCY
  // ==========================================

  const existingPurchase = await tx.userPackage.findFirst({
    where: {
      paymentId: payment.id,
    },
  });

  if (existingPurchase) {
    return {
      alreadyProcessed: true,
      action: null,
      userPackage: existingPurchase,
    };
  }

  // ==========================================
  // 3. VALIDATE USER
  // ==========================================

  const user = await tx.user.findUnique({
    where: { id: payment.userId },
    select: {
      id: true,
      account_status: true,
    },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  if (user.account_status !== "ACTIVE") {
    throw new Error("ACCOUNT_NOT_ACTIVE");
  }

  // ==========================================
  // 4. GET PACKAGE PRICE
  // ==========================================

  const packagePrice = await tx.packagePrice.findFirst({
    where: {
      id: payment.packagePriceId,
    },
    include: {
      package: true,
    },
  });

  if (!packagePrice) {
    throw new Error("PACKAGE_PRICE_NOT_FOUND");
  }

  const selectedPackage = packagePrice.package;

  // Do not require current active=true here:
  // the price may have been disabled after
  // the customer created and paid the order.

  if (!payment.amount.equals(packagePrice.price)) {
    throw new Error("PACKAGE_PAYMENT_AMOUNT_MISMATCH");
  }

  const now = new Date();

  // ==========================================
  // 5. CHECK EXISTING LIFETIME PACKAGE
  // ==========================================

  const lifetimePackage = await tx.userPackage.findFirst({
    where: {
      user_id: payment.userId,
      status: PackageStatus.ACTIVE,
      price: {
        billingCycle: BillingCycle.LIFETIME,
      },
      OR: [
        { endDate: null },
        { endDate: { gt: now } },
      ],
    },
  });

  if (lifetimePackage) {
    throw new Error("LIFETIME_PACKAGE_ALREADY_OWNED");
  }

  // ==========================================
  // 6. CURRENT ACTIVE PACKAGE
  // ==========================================

  const activePackage = await tx.userPackage.findFirst({
    where: {
      user_id: payment.userId,
      status: PackageStatus.ACTIVE,
      endDate: {
        gt: now,
      },
    },
    include: {
      package: true,
      price: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // ==========================================
  // 7. CHECK PENDING PACKAGE
  // ==========================================

  const pendingPackage = await tx.userPackage.findFirst({
    where: {
      user_id: payment.userId,
      status: PackageStatus.PENDING,
    },
  });

  if (pendingPackage) {
    throw new Error("PENDING_PACKAGE_ALREADY_EXISTS");
  }

  // ==========================================
  // 8. DETERMINE ACTION
  // ==========================================

  let action: SubscriptionAction = "NEW_PURCHASE";

  if (activePackage) {
    if (activePackage.packageId === selectedPackage.id) {
      action = "RENEW";
    } else {
      const currentPriority = getPackagePriority(
        activePackage.package.slug,
      );

      const newPriority = getPackagePriority(
        selectedPackage.slug,
      );

      if (!currentPriority || !newPriority) {
        throw new Error("UNKNOWN_PACKAGE_PRIORITY");
      }

      if (newPriority > currentPriority) {
        action = "UPGRADE";
      } else if (newPriority < currentPriority) {
        action = "DOWNGRADE";
      } else {
        throw new Error("SAME_PRIORITY_PACKAGE_CONFLICT");
      }
    }
  }

  // ==========================================
  // 9. CALCULATE DATES
  // ==========================================

  let startDate = now;
  let endDate: Date | null = null;

  if (action === "RENEW") {
    startDate = activePackage!.startDate;

    endDate = calculatePackageEndDate(
      activePackage!.endDate!,
      packagePrice.billingCycle,
      packagePrice.months,
    );
  } else if (action === "DOWNGRADE") {
    startDate = activePackage!.endDate!;

    endDate = calculatePackageEndDate(
      startDate,
      packagePrice.billingCycle,
      packagePrice.months,
    );
  } else {
    endDate = calculatePackageEndDate(
      now,
      packagePrice.billingCycle,
      packagePrice.months,
    );
  }

  // ==========================================
  // 10. CREATE / UPDATE USER PACKAGE
  // ==========================================

  let userPackage;

  if (action === "RENEW") {
    userPackage = await tx.userPackage.update({
      where: {
        id: activePackage!.id,
      },
      data: {
        endDate,
        priceId: packagePrice.id,
        purchasePrice: payment.amount,
        purchaseOriginalPrice: packagePrice.originalPrice,
        purchaseDiscount: packagePrice.discountPercent,

        // Links the renewed subscription
        // to the latest Razorpay payment.
        paymentId: payment.id,
      },
    });
  } else {
    if (action === "UPGRADE") {
      await tx.userPackage.updateMany({
        where: {
          user_id: payment.userId,
          status: PackageStatus.ACTIVE,
        },
        data: {
          status: PackageStatus.EXPIRED,
          endDate: now,
          autoRenew: false,
        },
      });
    }

    userPackage = await tx.userPackage.create({
      data: {
        user_id: payment.userId,
        packageId: selectedPackage.id,
        priceId: packagePrice.id,

        purchasePrice: payment.amount,
        purchaseOriginalPrice: packagePrice.originalPrice,
        purchaseDiscount: packagePrice.discountPercent,

        startDate,
        endDate,

        status:
          action === "DOWNGRADE"
            ? PackageStatus.PENDING
            : PackageStatus.ACTIVE,

        autoRenew: false,
        currentPackageId: selectedPackage.id,

        // Payment.id is the internal UUID.
        paymentId: payment.id,
      },
    });
  }

  // ==========================================
  // 11. RETURN
  // ==========================================

  return {
    alreadyProcessed: false,
    action,
    userPackage,
    package: {
      id: selectedPackage.id,
      name: selectedPackage.name,
      slug: selectedPackage.slug,
    },
    subscription: {
      status: userPackage.status,
      startDate: userPackage.startDate,
      endDate: userPackage.endDate,
    },
    payment: {
      method: "PAYMENT_GATEWAY",
      paymentId: payment.id,
      razorpayPaymentId: payment.payment_id,
      amountPaid: payment.amount,
    },
  };
}
