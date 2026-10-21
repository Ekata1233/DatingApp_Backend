
import { PaymentPurpose } from "@prisma/client";
import { z } from "zod";

// ============================================
// CREATE RAZORPAY ORDER VALIDATION
// ============================================

export const createRazorpayOrderSchema = z
  .object({
    // ========================================
    // PAYMENT PURPOSE
    // ========================================

    purpose: z.enum([
      PaymentPurpose.WALLET,
      PaymentPurpose.EVENT_BOOKING,
      PaymentPurpose.PACKAGE,
      PaymentPurpose.BOOST,
      PaymentPurpose.PURCHASE_STORE,
      PaymentPurpose.OTHER,
    ]),

    // ========================================
    // PURCHASE TYPE
    // ========================================
    // DATE_PLAN uses OTHER
    // ROSE / COMPLIMENT use PURCHASE_STORE
    // BOOST uses BOOST directly

    purchaseType: z
      .enum(["DATE_PLAN", "ROSE", "COMPLIMENT"])
      .optional(),

    // ========================================
    // WALLET
    // ========================================

    amount: z.number().positive().optional(),

    // ========================================
    // PACKAGE
    // ========================================

    packagePriceId: z.string().uuid().optional(),

    // ========================================
    // EVENT BOOKING
    // ========================================

    eventId: z.string().uuid().optional(),

    menTicketCount: z.number().int().min(0).default(0),

    womenTicketCount: z.number().int().min(0).default(0),

    otherTicketCount: z.number().int().min(0).default(0),

    // ========================================
    // BOOST / SUPER BOOST
    // ========================================

    boostOptionId: z.string().uuid().optional(),

    // ========================================
    // DATE PLAN PACKAGE
    // ========================================

    datePlanPackageId: z.string().uuid().optional(),

    // ========================================
    // ROSE / COMPLIMENT STORE PACK
    // ========================================

    storePackId: z.string().uuid().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const addError = (
      path: string,
      message: string,
    ) => {
      ctx.addIssue({
        code: "custom",
        path: [path],
        message,
      });
    };

    // ========================================
    // 1. WALLET VALIDATION
    // ========================================

    if (data.purpose === PaymentPurpose.WALLET) {
      if (
        data.amount === undefined ||
        !Number.isSafeInteger(
          Math.round(data.amount * 100),
        ) ||
        Math.abs(
          data.amount * 100 -
            Math.round(data.amount * 100),
        ) > 0.000001 ||
        data.amount < 1 ||
        data.amount > 100000
      ) {
        addError(
          "amount",
          "Wallet amount must be ₹1–₹100,000",
        );
      }
    }

    // ========================================
    // 2. PACKAGE VALIDATION
    // ========================================

    if (data.purpose === PaymentPurpose.PACKAGE) {
      if (!data.packagePriceId) {
        addError(
          "packagePriceId",
          "Package price ID is required",
        );
      }
    }

    // ========================================
    // 3. EVENT BOOKING VALIDATION
    // ========================================

    if (
      data.purpose === PaymentPurpose.EVENT_BOOKING
    ) {
      const count =
        data.menTicketCount +
        data.womenTicketCount +
        data.otherTicketCount;

      if (!data.eventId) {
        addError(
          "eventId",
          "Valid event ID is required",
        );
      }

      if (count < 1 || count > 10) {
        addError(
          "menTicketCount",
          "Total ticket count must be between 1 and 10",
        );
      }
    }

    // ========================================
    // 4. BOOST / SUPER BOOST VALIDATION
    // ========================================

    if (data.purpose === PaymentPurpose.BOOST) {
      if (!data.boostOptionId) {
        addError(
          "boostOptionId",
          "Boost option ID is required",
        );
      }
    }

    // ========================================
    // 5. DATE PLAN PACKAGE VALIDATION
    // ========================================

    if (data.purpose === PaymentPurpose.OTHER) {
      if (data.purchaseType !== "DATE_PLAN") {
        addError(
          "purchaseType",
          "Purchase type must be DATE_PLAN",
        );
      }

      if (!data.datePlanPackageId) {
        addError(
          "datePlanPackageId",
          "Date Plan package ID is required",
        );
      }
    }

    // ========================================
    // 6. ROSE / COMPLIMENT VALIDATION
    // ========================================

    if (
      data.purpose === PaymentPurpose.PURCHASE_STORE
    ) {
      if (
        data.purchaseType !== "ROSE" &&
        data.purchaseType !== "COMPLIMENT"
      ) {
        addError(
          "purchaseType",
          "Purchase type must be ROSE or COMPLIMENT",
        );
      }

      if (!data.storePackId) {
        addError(
          "storePackId",
          "Store pack ID is required",
        );
      }
    }

    // ========================================
    // 7. PREVENT CLIENT PRICE MANIPULATION
    // ========================================

    if (
      data.purpose !== PaymentPurpose.WALLET &&
      data.amount !== undefined
    ) {
      addError(
        "amount",
        "Amount is calculated by the server",
      );
    }

    // ========================================
    // 8. VALIDATE PURCHASE TYPE COMBINATION
    // ========================================

    if (
      data.purchaseType !== undefined &&
      data.purpose !== PaymentPurpose.OTHER &&
      data.purpose !== PaymentPurpose.PURCHASE_STORE
    ) {
      addError(
        "purchaseType",
        "purchaseType is not allowed for this payment purpose",
      );
    }

    // ========================================
    // 9. REJECT UNRELATED PRODUCT IDS
    // ========================================

    const allowedFields: Record<string, string[]> = {
      [PaymentPurpose.WALLET]: ["amount"],

      [PaymentPurpose.PACKAGE]: ["packagePriceId"],

      [PaymentPurpose.EVENT_BOOKING]: [
        "eventId",
        "menTicketCount",
        "womenTicketCount",
        "otherTicketCount",
      ],

      [PaymentPurpose.BOOST]: ["boostOptionId"],

      [PaymentPurpose.OTHER]: [
        "purchaseType",
        "datePlanPackageId",
      ],

      [PaymentPurpose.PURCHASE_STORE]: [
        "purchaseType",
        "storePackId",
      ],
    };

    const productFields = [
      "amount",
      "packagePriceId",
      "eventId",
      "boostOptionId",
      "datePlanPackageId",
      "storePackId",
      "purchaseType",
    ] as const;

    const allowed = allowedFields[data.purpose] ?? [];

    for (const field of productFields) {
      if (
        data[field] !== undefined &&
        !allowed.includes(field)
      ) {
        // Amount already receives a specific error above.
        if (
          field === "amount" &&
          data.purpose !== PaymentPurpose.WALLET
        ) {
          continue;
        }

        // purchaseType already receives a specific error above.
        if (
          field === "purchaseType" &&
          data.purpose !== PaymentPurpose.OTHER &&
          data.purpose !== PaymentPurpose.PURCHASE_STORE
        ) {
          continue;
        }

        addError(
          field,
          `${field} is not allowed for ${data.purpose}`,
        );
      }
    }
  });

// ============================================
// VERIFY RAZORPAY PAYMENT VALIDATION
// ============================================

export const verifyRazorpaySchema = z
  .object({
    razorpay_order_id: z
      .string()
      .startsWith("order_"),

    razorpay_payment_id: z
      .string()
      .startsWith("pay_"),

    razorpay_signature: z
      .string()
      .regex(/^[a-fA-F0-9]{64}$/),
  })
  .strict();

// ============================================
// TYPES
// ============================================

export type CreateRazorpayOrderDTO = z.infer<
  typeof createRazorpayOrderSchema
>;

export type VerifyRazorpayDTO = z.infer<
  typeof verifyRazorpaySchema
>;
