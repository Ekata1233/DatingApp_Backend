
import {
  PaymentPurpose,
  PaymentStatus,
  Prisma,
  PurchasePaymentMethod,
} from "@prisma/client";

import { prisma } from "../../prisma/prismaClient";
import { enrichPurchaseHistory } from "./purchase-history.details";

export type PurchaseHistoryType =
  | "ALL"
  | "ROSE"
  | "COMPLIMENT"
  | "BOOST"
  | "PACKAGE"
  | "DATE_PLAN";

export type PaymentMethodFilter =
  | "ALL"
  | "WALLET"
  | "PAYMENT_GATEWAY";

interface PurchaseHistoryInput {
  userId: string;
  type: PurchaseHistoryType;
  paymentMethod: PaymentMethodFilter;
  page: number;
  limit: number;
}

type HistoryItem = {
  id: string;
  type: Exclude<PurchaseHistoryType, "ALL">;
  title: string;
  quantity: number | null;
  amount: string;
  currency: string;
  paymentMethod: string;

  // NEW: Gateway information
  gateway: string | null;
  gatewayPaymentMethod: string | null;

  paymentId: string | null;
  walletTransactionId: string | null;
  status: string;
  purchasedAt: Date;
  details: Record<string, unknown>;
};

// ==========================================
// PURCHASE METADATA HELPER
// ==========================================

function purchaseMetadata(
  value: Prisma.JsonValue | null,
): Record<string, unknown> {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  const metadata = (
    value as Record<string, unknown>
  ).purchaseMetadata;

  if (
    !metadata ||
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    return {};
  }

  return metadata as Record<string, unknown>;
}

// ==========================================
// NEW: RAZORPAY PAYMENT METHOD HELPER
// ==========================================

function getRazorpayMethod(
  gatewayResponse: Prisma.JsonValue | null,
): string | null {
  if (
    !gatewayResponse ||
    typeof gatewayResponse !== "object" ||
    Array.isArray(gatewayResponse)
  ) {
    return null;
  }

  const method = (
    gatewayResponse as Record<string, unknown>
  ).razorpayMethod;

  if (typeof method !== "string" || !method.trim()) {
    return null;
  }

  return method.toUpperCase();
}

// ==========================================
// PURCHASE HISTORY SERVICE
// ==========================================

export const getPurchaseHistoryService = async ({
  userId,
  type,
  paymentMethod,
  page,
  limit,
}: PurchaseHistoryInput) => {
  const items: HistoryItem[] = [];

  const wants = (value: PurchaseHistoryType) =>
    type === "ALL" || type === value;

  const gatewayAllowed =
    paymentMethod !== "WALLET";

  const walletAllowed =
    paymentMethod !== "PAYMENT_GATEWAY";

  // ==========================================
  // 1. ROSE WALLET PURCHASES
  // ==========================================

  if (wants("ROSE") && walletAllowed) {
    const purchases = await prisma.rosePurchase.findMany({
      where: {
        userId,
        paymentMethod: PurchasePaymentMethod.WALLET,
      },
    });

    for (const p of purchases) {
      items.push({
        id: p.id,
        type: "ROSE",
        title: "Rose Purchase",
        quantity: p.quantity,
        amount: p.amount.toString(),
        currency: "INR",
        paymentMethod: "WALLET",

        // NEW
        gateway: null,
        gatewayPaymentMethod: null,

        paymentId: null,
        walletTransactionId: p.walletTransactionId,
        status: "COMPLETED",
        purchasedAt: p.createdAt,
        details: {},
      });
    }
  }

  // ==========================================
  // 2. BOOST WALLET PURCHASES
  // ==========================================

  if (wants("BOOST") && walletAllowed) {
    const purchases = await prisma.boostPurchase.findMany({
      where: {
        userId,
        paymentMethod: PurchasePaymentMethod.WALLET,
      },
      include: {
        boostOption: {
          include: {
            boost: true,
          },
        },
      },
    });

    for (const p of purchases) {
      items.push({
        id: p.id,
        type: "BOOST",
        title: p.boostOption.boost.name,
        quantity: p.quantity,
        amount: p.amount.toString(),
        currency: "INR",
        paymentMethod: "WALLET",

        // NEW
        gateway: null,
        gatewayPaymentMethod: null,

        paymentId: null,
        walletTransactionId: p.walletTransactionId,
        status: "COMPLETED",
        purchasedAt: p.createdAt,
        details: {
          boostOptionId: p.boostOptionId,
          boostType: p.boostOption.boost.name,
          timePerBoost: p.boostOption.timePerBoost,
        },
      });
    }
  }

  // ==========================================
  // 3. DATE PLAN WALLET PURCHASES
  // ==========================================

  if (wants("DATE_PLAN") && walletAllowed) {
    const purchases = await prisma.datePlanPurchase.findMany({
      where: {
        userId,
        paymentMethod: PurchasePaymentMethod.WALLET,
      },
    });

    for (const p of purchases) {
      items.push({
        id: p.id,
        type: "DATE_PLAN",
        title: "Date Plan Purchase",
        quantity: p.quantity,
        amount: String(p.amount),
        currency: "INR",
        paymentMethod: "WALLET",

        // NEW
        gateway: null,
        gatewayPaymentMethod: null,

        paymentId: null,
        walletTransactionId: p.walletTransactionId,
        status: "COMPLETED",
        purchasedAt: p.createdAt,
        details: {},
      });
    }
  }

  // ==========================================
  // 4. RAZORPAY PURCHASES
  // ==========================================

  if (gatewayAllowed) {
    const purposes: PaymentPurpose[] = [];

    if (wants("ROSE") || wants("COMPLIMENT")) {
      purposes.push(PaymentPurpose.PURCHASE_STORE);
    }

    if (wants("BOOST")) {
      purposes.push(PaymentPurpose.BOOST);
    }

    if (wants("PACKAGE")) {
      purposes.push(PaymentPurpose.PACKAGE);
    }

    if (wants("DATE_PLAN")) {
      purposes.push(PaymentPurpose.OTHER);
    }

    if (purposes.length) {
      const payments = await prisma.payment.findMany({
        where: {
          userId,
          status: PaymentStatus.COMPLETED,
          purpose: {
            in: purposes,
          },
        },
        orderBy: {
          created_at: "desc",
        },
      });

      for (const payment of payments) {
        const metadata = purchaseMetadata(
          payment.gatewayResponse,
        );

        let purchaseType:
          | Exclude<PurchaseHistoryType, "ALL">
          | null = null;

        if (payment.purpose === PaymentPurpose.BOOST) {
          purchaseType = "BOOST";
        } else if (
          payment.purpose === PaymentPurpose.PACKAGE
        ) {
          purchaseType = "PACKAGE";
        } else if (
          payment.purpose === PaymentPurpose.PURCHASE_STORE
        ) {
          if (metadata.purchaseType === "ROSE") {
            purchaseType = "ROSE";
          } else if (
            metadata.purchaseType === "COMPLIMENT"
          ) {
            purchaseType = "COMPLIMENT";
          }
        } else if (
          payment.purpose === PaymentPurpose.OTHER &&
          metadata.purchaseType === "DATE_PLAN"
        ) {
          purchaseType = "DATE_PLAN";
        }

        if (!purchaseType || !wants(purchaseType)) {
          continue;
        }

        items.push({
          id: payment.id,
          type: purchaseType,
          title: `${purchaseType.replace("_", " ")} Purchase`,
          quantity: null,
          amount: payment.amount.toString(),
          currency: payment.currency,
          paymentMethod: "PAYMENT_GATEWAY",

          // NEW: Actual Razorpay payment method
          gateway: "RAZORPAY",
          gatewayPaymentMethod: getRazorpayMethod(
            payment.gatewayResponse,
          ),

          paymentId: payment.payment_id,
          walletTransactionId: null,
          status: payment.status,
          purchasedAt:
            payment.paidAt ?? payment.created_at,
          details: {
            referenceId: payment.referenceId,
            packagePriceId: payment.packagePriceId,
            orderId: payment.transactionId,
            purchaseMetadata: metadata,
          },
        });
      }
    }
  }

  // ==========================================
  // 5. SORT ALL PURCHASES
  // ==========================================

  items.sort((a, b) => {
    const dateDiff =
      b.purchasedAt.getTime() -
      a.purchasedAt.getTime();

    return dateDiff || b.id.localeCompare(a.id);
  });

  // ==========================================
  // 6. PAGINATION
  // ==========================================

  const total = items.length;
  const skip = (page - 1) * limit;

  const paginatedItems = items.slice(
    skip,
    skip + limit,
  );

  // ==========================================
  // 7. ENRICH PURCHASE DETAILS
  // ==========================================

  const enrichedItems = await enrichPurchaseHistory(
    userId,
    paginatedItems,
  );

  // ==========================================
  // 8. RETURN RESPONSE
  // ==========================================

  return {
    items: enrichedItems,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: skip + limit < total,
    },
  };
};
