
import { prisma } from "../../prisma/prismaClient";

type PurchaseType =
  | "ROSE"
  | "COMPLIMENT"
  | "BOOST"
  | "PACKAGE"
  | "DATE_PLAN";

export interface HistoryItem {
  id: string;
  type: PurchaseType;
  title: string;
  quantity: number | null;
  amount: string;
  currency: string;
  paymentMethod: string;
  paymentId: string | null;
  gateway: string | null;
gatewayPaymentMethod: string | null;
  walletTransactionId: string | null;
  status: string;
  purchasedAt: Date;
  details: Record<string, unknown>;
}

export const enrichPurchaseHistory = async (
  userId: string,
  items: HistoryItem[],
): Promise<HistoryItem[]> => {
  // Only query purchase records that are needed.
  const gatewayPaymentIds = items
    .filter((item) => item.paymentId)
    .map((item) => item.paymentId!);

  const packagePriceIds = items
    .filter((item) => item.type === "PACKAGE")
    .map((item) => item.details.packagePriceId)
    .filter((id): id is string => typeof id === "string");

  const [
    roses,
    compliments,
    boosts,
    datePlans,
    userPackages,
    packagePrices,
  ] = await Promise.all([
    prisma.rosePurchase.findMany({
      where: {
        userId,
        paymentId: { in: gatewayPaymentIds },
      },
    }),

    prisma.complimentPurchase.findMany({
      where: {
        userId,
        paymentId: { in: gatewayPaymentIds },
      },
    }),

    prisma.boostPurchase.findMany({
      where: {
        userId,
        paymentId: { in: gatewayPaymentIds },
      },
      include: {
        boostOption: {
          include: {
            boost: true,
          },
        },
      },
    }),

    prisma.datePlanPurchase.findMany({
      where: {
        userId,
        paymentId: { in: gatewayPaymentIds },
      },
    }),

    prisma.userPackage.findMany({
  where: {
    user_id: userId,
    payment: {
      is: {
        payment_id: {
          in: gatewayPaymentIds,
        },
      },
    },
  },
  include: {
    package: true,
    price: true,

    // ADD THIS RELATION
    payment: {
      select: {
        id: true,
        payment_id: true,
      },
    },
  },
}),

    prisma.packagePrice.findMany({
      where: {
        id: { in: packagePriceIds },
      },
      include: {
        package: true,
      },
    }),
  ]);

  const roseMap = new Map(
    roses.map((p) => [p.paymentId, p]),
  );

  const complimentMap = new Map(
    compliments.map((p) => [p.paymentId, p]),
  );

  const boostMap = new Map(
    boosts.map((p) => [p.paymentId, p]),
  );

  const datePlanMap = new Map(
    datePlans.map((p) => [p.paymentId, p]),
  );

  const userPackageMap = new Map(
    userPackages
      .filter((p) => p.payment?.payment_id)
      .map((p) => [p.payment!.payment_id, p]),
  );

  const packagePriceMap = new Map(
    packagePrices.map((p) => [p.id, p]),
  );

  return items.map((item) => {
    const paymentId = item.paymentId;

    // ======================================
    // ROSE
    // ======================================
    if (item.type === "ROSE" && paymentId) {
      const purchase = roseMap.get(paymentId);

      if (purchase) {
        return {
          ...item,
          title: `${purchase.quantity} Roses`,
          quantity: purchase.quantity,
          details: {
            ...item.details,
            rosePurchaseId: purchase.id,
            roseCount: purchase.quantity,
          },
        };
      }
    }

    // ======================================
    // COMPLIMENT
    // ======================================
    if (item.type === "COMPLIMENT" && paymentId) {
      const purchase = complimentMap.get(paymentId);

      if (purchase) {
        return {
          ...item,
          title: `${purchase.quantity} Compliments`,
          quantity: purchase.quantity,
          details: {
            ...item.details,
            complimentPurchaseId: purchase.id,
            complimentCount: purchase.quantity,
          },
        };
      }
    }

    // ======================================
    // BOOST / SUPER BOOST
    // ======================================
    if (item.type === "BOOST" && paymentId) {
      const purchase = boostMap.get(paymentId);

      if (purchase) {
        const option = purchase.boostOption;

        // Uses Boost.name as the type display value.
        // Adjust if your Boost model uses another field.
        const boostName = option.boost.name;

        return {
          ...item,
          title: `${purchase.quantity} ${boostName}`,
          quantity: purchase.quantity,
          details: {
            ...item.details,
            boostPurchaseId: purchase.id,
            boostType: boostName,
            boostOptionId: purchase.boostOptionId,
            boostOptionLabel: option.label,
            boostCount: purchase.quantity,
            timePerBoost: option.timePerBoost,
            pricePerBoost: option.pricePerBoost.toString(),
            discountedPrice: option.discounted_price.toString(),
            totalPrice: purchase.amount.toString(),
          },
        };
      }
    }

    // ======================================
    // DATE PLAN
    // ======================================
    if (item.type === "DATE_PLAN" && paymentId) {
      const purchase = datePlanMap.get(paymentId);

      if (purchase) {
        return {
          ...item,
          title: `${purchase.quantity} Date Plans`,
          quantity: purchase.quantity,
          details: {
            ...item.details,
            datePlanPurchaseId: purchase.id,
            datePlanCount: purchase.quantity,
          },
        };
      }
    }

    // ======================================
    // PACKAGE
    // ======================================
    if (item.type === "PACKAGE") {
      const userPackage = paymentId
        ? userPackageMap.get(paymentId)
        : null;

      const priceId = item.details.packagePriceId;

      const packagePrice =
        typeof priceId === "string"
          ? packagePriceMap.get(priceId)
          : null;

      if (packagePrice) {
        return {
          ...item,
          title: `${packagePrice.package.name} Package`,
          quantity: 1,
          details: {
            ...item.details,
            packageId: packagePrice.packageId,
            packageName: packagePrice.package.name,
            packageSlug: packagePrice.package.slug,
            billingCycle: packagePrice.billingCycle,
            months: packagePrice.months,
            originalPrice:
              packagePrice.originalPrice?.toString() ?? null,
            discountPercent: packagePrice.discountPercent,

            userPackageId: userPackage?.id ?? null,
            subscriptionStatus: userPackage?.status ?? null,
            startDate: userPackage?.startDate ?? null,
            endDate: userPackage?.endDate ?? null,
            autoRenew: userPackage?.autoRenew ?? null,
          },
        };
      }
    }

    return item;
  });
};
