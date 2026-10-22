import {
  BillingCycle,
  Payment,
  Prisma,
} from "@prisma/client";

function getPackageEndDate(
  start: Date,
  cycle: BillingCycle,
  months: number | null,
): Date | null {
  if (cycle === "LIFETIME") return null;

  const duration =
    months ??
    ({
      MONTHLY: 1,
      QUARTERLY: 3,
      HALF_YEARLY: 6,
      YEARLY: 12,
    } as Record<string, number>)[cycle];

  if (!duration) {
    throw new Error("Invalid package duration");
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
  if (!payment.packagePriceId) {
    throw new Error("Package price missing");
  }

  const existing = await tx.userPackage.findFirst({
    where: { paymentId: payment.id },
  });

  if (existing) return existing;

  const price = await tx.packagePrice.findUnique({
    where: { id: payment.packagePriceId },
    include: { package: true },
  });

  if (!price) {
    throw new Error("Package price not found");
  }

  const startDate = new Date();

  return tx.userPackage.create({
    data: {
      user_id: payment.userId,
      packageId: price.packageId,
      priceId: price.id,
      purchasePrice: payment.amount,
      purchaseOriginalPrice: price.originalPrice,
      purchaseDiscount: price.discountPercent,
      startDate,
      endDate: getPackageEndDate(
        startDate,
        price.billingCycle,
        price.months,
      ),
      status: "ACTIVE",
      autoRenew: false,
      paymentId: payment.id,
      currentPackageId: price.packageId,
    },
  });
}