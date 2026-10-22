import crypto from "node:crypto";

import {
  PaymentPurpose,
  PaymentStatus,
  Prisma,
  StoreItemType,
} from "@prisma/client";

import { prisma } from "../../../prisma/prismaClient";
import { razorpay, razorpayKeyId } from "./razorpay.config";
import { razorpayRepository } from "./razorpay.repository";

import { fulfillWalletTopup } from "./handlers/wallet.handler";
import { fulfillPackagePurchase } from "./handlers/package.handler";
import { fulfillEventBooking } from "./handlers/event.handler";

import { fulfillRosePayment } from "./handlers/rose.handler";
import { fulfillComplimentPayment } from "./handlers/compliment.handler";
import { fulfillBoostPayment } from "./handlers/boost.handler";
import { fulfillDatePlanPayment } from "./handlers/datePlan.handler";

import { createEventBookingForPayment } from "../payment.service";

import type {
  CreateRazorpayOrderDTO,
  VerifyRazorpayDTO,
} from "./razorpay.validation";

// ============================================
// CONFIGURATION
// ============================================

const secret = process.env.RAZORPAY_KEY_SECRET!;

type PurchaseType = "BOOST" | "DATE_PLAN" | "ROSE" | "COMPLIMENT";

type PurchaseMetadata = {
  purchaseType?: PurchaseType;
  boostOptionId?: string;
  datePlanPackageId?: string;
  storePackId?: string;
};

// ============================================
// MONEY HELPERS
// ============================================

function toPaise(amount: Prisma.Decimal): number {
  const value = amount.mul(100).toNumber();

  if (!Number.isSafeInteger(value) || value < 100) {
    throw new Error("Invalid payment amount");
  }

  return value;
}

function getPurchaseMetadata(
  gatewayResponse: Prisma.JsonValue | null,
): PurchaseMetadata {
  if (
    !gatewayResponse ||
    typeof gatewayResponse !== "object" ||
    Array.isArray(gatewayResponse)
  ) {
    return {};
  }

  const metadata = (gatewayResponse as Record<string, unknown>)
    .purchaseMetadata;

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  return metadata as PurchaseMetadata;
}

// ============================================
// CREATE RAZORPAY ORDER
// ============================================

export async function createRazorpayOrderService(
  userId: string,
  data: CreateRazorpayOrderDTO,
) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  let amount: Prisma.Decimal;

  let referenceId: string | undefined;
  let packagePriceId: string | undefined;
  let bookingId: string | undefined;

  let walletDetails: any = null;
  let packageDetails: any = null;
  let eventBookingDetails: any = null;

  let boostDetails: any = null;
  let datePlanDetails: any = null;
  let storeDetails: any = null;

  let purchaseMetadata: PurchaseMetadata = {};

  // ==========================================
  // 1. WALLET
  // ==========================================

  if (data.purpose === PaymentPurpose.WALLET) {
    amount = new Prisma.Decimal(data.amount!);

    walletDetails = {
      topupAmount: amount.toNumber(),
      currency: "INR",
    };

    // ==========================================
    // 2. PACKAGE
    // ==========================================
  } else if (data.purpose === PaymentPurpose.PACKAGE) {
    const price = await prisma.packagePrice.findFirst({
      where: {
        id: data.packagePriceId,
        active: true,
        package: {
          active: true,
        },
      },
      include: {
        package: true,
      },
    });

    if (!price) {
      throw new Error("Package price unavailable");
    }

    amount = price.price;
    packagePriceId = price.id;

    packageDetails = {
      packageId: price.packageId,
      packagePriceId: price.id,
      packageName: price.package.name,
      packageSlug: price.package.slug,
      billingCycle: price.billingCycle,
      totalAmount: Number(price.price),
      currency: "INR",
    };

    // ==========================================
    // 3. EVENT BOOKING
    // ==========================================
  } else if (data.purpose === PaymentPurpose.EVENT_BOOKING) {
    const result = await createEventBookingForPayment(userId, {
      purpose: PaymentPurpose.EVENT_BOOKING,
      currency: "INR",
      eventId: data.eventId,
      menTicketCount: data.menTicketCount,
      womenTicketCount: data.womenTicketCount,
      otherTicketCount: data.otherTicketCount,
    });

    amount = new Prisma.Decimal(result.amount);

    referenceId = result.booking.id;
    bookingId = result.booking.id;

    const booking = result.booking;

    eventBookingDetails = {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      eventId: data.eventId,

      ticketCount: booking.ticketCount,

      ticketAmount: Number(booking.ticketAmount),
      discountAmount: Number(booking.discountAmount),
      platformFee: Number(booking.platformFee),
      gstAmount: Number(booking.gstAmount),
      totalAmount: Number(booking.totalAmount),

      tickets: booking.tickets,
      status: booking.status,
      currency: "INR",
    };

    // ==========================================
    // 4. BOOST / SUPER BOOST
    // ==========================================
  } else if (data.purpose === PaymentPurpose.BOOST) {
    const option = await prisma.boostOption.findFirst({
      where: {
        id: data.boostOptionId,
        is_active: true,
        boost: {
          is_active: true,
        },
      },
      include: {
        boost: true,
      },
    });

    if (!option) {
      throw new Error("Boost option unavailable");
    }

    amount = option.totalPrice;

    referenceId = option.id;

    boostDetails = {
      boostId: option.boost_id,
      boostOptionId: option.id,
      boostType: option.boost.name,
      title: option.boost.title,
      description: option.boost.description,

      label: option.label,
      boostCount: option.boostCount,
      timePerBoost: option.timePerBoost,

      pricePerBoost: Number(option.pricePerBoost),
      discountedPrice: Number(option.discounted_price),
      discountPercentage: option.discount_percent ?? 0,

      totalAmount: Number(option.totalPrice),
      currency: "INR",
    };

    purchaseMetadata = {
      purchaseType: "BOOST",
      boostOptionId: option.id,
    };

    // ==========================================
    // 5. DATE PLAN PACKAGE
    // ==========================================
  } else if (
    data.purpose === PaymentPurpose.OTHER &&
    data.purchaseType === "DATE_PLAN"
  ) {
    const plan = await prisma.datePlanPackage.findFirst({
      where: {
        id: data.datePlanPackageId,
        isActive: true,
      },
    });

    if (!plan) {
      throw new Error("Date Plan package unavailable");
    }

    amount = plan.price;

    referenceId = plan.id;

    datePlanDetails = {
      datePlanPackageId: plan.id,
      title: plan.title,
      description: plan.description,

      planCount: plan.planCount,
      pricePerPlan: Number(plan.pricePerPlan),
      discountPercentage: plan.discount ?? 0,

      totalAmount: Number(plan.price),
      currency: "INR",
    };

    purchaseMetadata = {
      purchaseType: "DATE_PLAN",
      datePlanPackageId: plan.id,
    };

    // ==========================================
    // 6. ROSE / COMPLIMENT
    // ==========================================
  } else if (data.purpose === PaymentPurpose.PURCHASE_STORE) {
    if (data.purchaseType !== "ROSE" && data.purchaseType !== "COMPLIMENT") {
      throw new Error("Invalid store purchase type");
    }

    const pack = await prisma.storePack.findFirst({
      where: {
        id: data.storePackId,
        itemType: data.purchaseType,
        isActive: true,
      },
    });

    if (!pack) {
      throw new Error("Store pack unavailable");
    }

    amount = pack.totalPrice;

    referenceId = pack.id;

    storeDetails = {
      storePackId: pack.id,
      itemType: pack.itemType,
      title: pack.title,

      quantity: pack.quantity,
      pricePerUnit: Number(pack.pricePerUnit),
      totalAmount: Number(pack.totalPrice),

      badge: pack.badge,
      currency: "INR",
    };

    purchaseMetadata = {
      purchaseType: data.purchaseType === "ROSE" ? "ROSE" : "COMPLIMENT",
      storePackId: pack.id,
    };
  } else {
    throw new Error("Unsupported payment purpose");
  }

  // ==========================================
  // 7. CONVERT AMOUNT TO PAISE
  // ==========================================

  const amountPaise = toPaise(amount);

  // ==========================================
  // 8. CREATE RAZORPAY ORDER
  // ==========================================

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: `WLV_${crypto.randomUUID().slice(0, 20)}`,

    notes: {
      userId,
      purpose: data.purpose,
      referenceId: referenceId ?? "",
      packagePriceId: packagePriceId ?? "",

      purchaseType: purchaseMetadata.purchaseType ?? "",
      boostOptionId: purchaseMetadata.boostOptionId ?? "",
      datePlanPackageId: purchaseMetadata.datePlanPackageId ?? "",
      storePackId: purchaseMetadata.storePackId ?? "",
    },
  });

  // ==========================================
  // 9. CREATE PAYMENT RECORD
  // ==========================================

  const payment = await prisma.payment.create({
    data: {
      userId,
      amount,
      currency: "INR",
      purpose: data.purpose,
      status: PaymentStatus.PENDING,

      // Pending = Razorpay order ID
      payment_id: order.id,

      referenceId,
      packagePriceId,

      gatewayResponse: {
        ...JSON.parse(JSON.stringify(order)),
        purchaseMetadata,
      },
    },
  });

  // ==========================================
  // 10. RESPONSE
  // ==========================================

  return {
    paymentId: payment.id,
    razorpayOrderId: order.id,
    razorpayKeyId,
    amount: amountPaise,
    amountInRupees: amount.toString(),
    currency: "INR",
    bookingId: bookingId ?? null,
  };
}

// ============================================
// VERIFY CHECKOUT SIGNATURE
// ============================================

export function verifyCheckoutSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!razorpaySecret) {
    throw new Error("RAZORPAY_KEY_SECRET is missing");
  }

  if (!/^[a-fA-F0-9]{64}$/.test(signature)) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", razorpaySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "hex"),
    Buffer.from(signature, "hex"),
  );
}

// ============================================
// FINALIZE RAZORPAY PAYMENT
// ============================================

export async function finalizeRazorpayPayment(
  orderId: string,
  gatewayPaymentId: string,
) {
  // ==========================================
  // 1. VERIFY PAYMENT WITH RAZORPAY
  // ==========================================

  const gatewayPayment = await razorpay.payments.fetch(gatewayPaymentId);

  if (
    gatewayPayment.order_id !== orderId ||
    gatewayPayment.status !== "captured"
  ) {
    throw new Error("Razorpay payment is not captured");
  }

  // ==========================================
  // 2. TRANSACTION WITH RETRIES
  // ==========================================

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const payment = await tx.payment.findFirst({
            where: {
              OR: [{ payment_id: orderId }, { transactionId: orderId }],
            },
          });

          if (!payment) {
            throw new Error("Payment order not found");
          }

          // ==================================
          // 3. VERIFY AMOUNT AND CURRENCY
          // ==================================

          if (
            payment.currency !== gatewayPayment.currency ||
            toPaise(payment.amount) !== Number(gatewayPayment.amount)
          ) {
            throw new Error("Payment amount/currency mismatch");
          }

          // ==================================
          // 4. IDEMPOTENCY
          // ==================================

          if (payment.status === PaymentStatus.COMPLETED) {
            if (payment.payment_id !== gatewayPaymentId) {
              throw new Error("Payment ID mismatch");
            }

            return {
              payment,
              alreadyProcessed: true,
            };
          }

          // ==================================
          // 5. PRESERVE PURCHASE METADATA
          // ==================================

          const purchaseMetadata = getPurchaseMetadata(payment.gatewayResponse);

          // ==================================
          // 6. CLAIM PAYMENT
          // ==================================

          const claim = await tx.payment.updateMany({
            where: {
              id: payment.id,
              status: {
                in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING],
              },
              payment_id: orderId,
            },
            data: {
              payment_id: gatewayPaymentId,
              transactionId: orderId,

              status: PaymentStatus.COMPLETED,
              paidAt: new Date(),

              gatewayResponse: {
                razorpay_order_id: orderId,
                razorpay_payment_id: gatewayPaymentId,
                gateway_status: gatewayPayment.status,

                // Keep metadata after verification
                purchaseMetadata,
              },
            },
          });

          if (claim.count !== 1) {
            throw new Error(
              "Payment is being processed or requires reconciliation",
            );
          }

          const updatedPayment = await tx.payment.findUniqueOrThrow({
            where: {
              id: payment.id,
            },
          });

          // ==================================
          // 7. FULFILL PURCHASE
          // ==================================

          switch (updatedPayment.purpose) {
            // ================================
            // WALLET
            // ================================

            case PaymentPurpose.WALLET:
              await fulfillWalletTopup(tx, updatedPayment);
              break;

            // ================================
            // PACKAGE
            // ================================

            case PaymentPurpose.PACKAGE:
              await fulfillPackagePurchase(tx, updatedPayment);
              break;

            // ================================
            // EVENT BOOKING
            // ================================

            case PaymentPurpose.EVENT_BOOKING:
              await fulfillEventBooking(tx, updatedPayment);
              break;

            // ================================
            // BOOST / SUPER BOOST
            // ================================

            case PaymentPurpose.BOOST:
              if (
                purchaseMetadata.purchaseType !== "BOOST" ||
                purchaseMetadata.boostOptionId !== updatedPayment.referenceId
              ) {
                throw new Error("Invalid Boost purchase metadata");
              }

              await fulfillBoostPayment(tx, updatedPayment);
              break;

            // ================================
            // DATE PLAN
            // ================================

            case PaymentPurpose.OTHER:
              if (
                purchaseMetadata.purchaseType !== "DATE_PLAN" ||
                purchaseMetadata.datePlanPackageId !==
                  updatedPayment.referenceId
              ) {
                throw new Error("Invalid Date Plan purchase metadata");
              }

              console.log("DATE PLAN FULFILLMENT START:", {
  paymentId: updatedPayment.id,
  gatewayPaymentId: updatedPayment.payment_id,
  userId: updatedPayment.userId,
  referenceId: updatedPayment.referenceId,
  amount: updatedPayment.amount.toString(),
});

try {
  await fulfillDatePlanPayment(tx, updatedPayment);

  console.log("DATE PLAN FULFILLMENT SUCCESS");
} catch (error) {
  console.error("DATE PLAN FULFILLMENT FAILED:", error);
  throw error;
}
              break;

            // ================================
            // ROSE / COMPLIMENT
            // ================================

            case PaymentPurpose.PURCHASE_STORE: {
              const storePackId = purchaseMetadata.storePackId;

              if (!storePackId || storePackId !== updatedPayment.referenceId) {
                throw new Error("Store pack reference missing or invalid");
              }

              const pack = await tx.storePack.findUnique({
                where: {
                  id: storePackId,
                },
              });

              if (!pack) {
                throw new Error("Store pack not found");
              }

              if (!updatedPayment.amount.equals(pack.totalPrice)) {
                throw new Error("Store pack payment amount mismatch");
              }

              if (
                purchaseMetadata.purchaseType === "ROSE" &&
                pack.itemType === StoreItemType.ROSE
              ) {
                if (!updatedPayment.payment_id) {
                  throw new Error("Razorpay payment ID missing");
                }

                await fulfillRosePayment(
                  tx,
                  updatedPayment.userId,
                  storePackId,
                  updatedPayment.payment_id,
                );
              } else if (
                purchaseMetadata.purchaseType === "COMPLIMENT" &&
                pack.itemType === StoreItemType.COMPLIMENT
              ) {
                if (!updatedPayment.payment_id) {
                  throw new Error("Razorpay payment ID missing");
                }

                await fulfillComplimentPayment(
                  tx,
                  updatedPayment.userId,
                  storePackId,
                  updatedPayment.payment_id,
                );
              } else {
                throw new Error("Invalid store purchase type");
              }

              break;
            }

            default:
              throw new Error("Unsupported payment purpose");
          }

          // ==================================
          // 8. RETURN
          // ==================================

          return {
            payment: updatedPayment,
            alreadyProcessed: false,
          };
        },
        {
          isolationLevel: "Serializable",
          maxWait: 10000,
          timeout: 30000,
        },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034" &&
        attempt < 2
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Payment processing retry exhausted");
}

// ============================================
// VERIFY RAZORPAY PAYMENT SERVICE
// ============================================

export async function verifyRazorpayPaymentService(
  userId: string,
  data: VerifyRazorpayDTO,
) {
  console.log("\n========== RAZORPAY VERIFY DEBUG ==========");

  // ==========================================
  // 1. REQUEST DEBUG
  // ==========================================

  console.log("REQUEST DATA:", {
    userId,
    razorpayOrderId: data.razorpay_order_id,
    razorpayPaymentId: data.razorpay_payment_id,
    signatureLength: data.razorpay_signature?.length,
  });

  console.log("RAZORPAY CONFIG:", {
    keyId: process.env.RAZORPAY_KEY_ID,
    secretConfigured: Boolean(process.env.RAZORPAY_KEY_SECRET),
    secretLength: process.env.RAZORPAY_KEY_SECRET?.length ?? 0,
  });

  // ==========================================
  // 2. FIND PAYMENT IN DATABASE
  // ==========================================

  const payment = await razorpayRepository.findByOrderId(
    data.razorpay_order_id,
  );

  console.log(
    "DATABASE PAYMENT:",
    payment
      ? {
          id: payment.id,
          userId: payment.userId,
          payment_id: payment.payment_id,
          transactionId: payment.transactionId,
          status: payment.status,
          purpose: payment.purpose,
          amount: payment.amount.toString(),
          currency: payment.currency,
        }
      : null,
  );

  if (!payment || payment.userId !== userId) {
    console.error("VERIFY FAILED: Payment order not found");

    throw new Error("Payment order not found");
  }

  // ==========================================
  // 3. VERIFY ORDER & PAYMENT WITH RAZORPAY
  // ==========================================

  

 
  // ==========================================
  // 3. VERIFY ORDER & PAYMENT WITH RAZORPAY
  // ==========================================

  console.log("FETCHING RAZORPAY ORDER AND PAYMENT");

  let gatewayOrder;
  let gatewayPayment;

  // 1. FETCH ORDER
  try {
    gatewayOrder = await razorpay.orders.fetch(
      data.razorpay_order_id
    );

    console.log("ORDER FOUND:", {
      id: gatewayOrder.id,
      status: gatewayOrder.status,
      amount: gatewayOrder.amount,
    });
  } catch (error: any) {
    console.error("ORDER FETCH FAILED:", {
      orderId: data.razorpay_order_id,
      statusCode: error?.statusCode,
      description:
        error?.error?.description ?? error?.message,
    });

    throw new Error("Razorpay order lookup failed");
  }

  // 2. FETCH PAYMENT
  try {
    gatewayPayment = await razorpay.payments.fetch(
      data.razorpay_payment_id
    );

    console.log("PAYMENT FOUND:", {
      id: gatewayPayment.id,
      orderId: gatewayPayment.order_id,
      status: gatewayPayment.status,
      amount: gatewayPayment.amount,
    });
  } catch (error: any) {
    console.error("PAYMENT FETCH FAILED:", {
      paymentId: data.razorpay_payment_id,
      statusCode: error?.statusCode,
      description:
        error?.error?.description ?? error?.message,
    });

    throw new Error("Razorpay payment lookup failed");
  }


  // ==========================================
  // 4. CHECK ORDER AND AMOUNT
  // ==========================================

  const orderMatches = gatewayPayment.order_id === data.razorpay_order_id;

  const expectedAmountPaise = payment.amount.mul(100).toNumber();

  const amountMatches =
    Number(gatewayPayment.amount) === expectedAmountPaise &&
    Number(gatewayOrder.amount) === expectedAmountPaise;

  const currencyMatches =
    gatewayPayment.currency === payment.currency &&
    gatewayOrder.currency === payment.currency;

  console.log("RAZORPAY GATEWAY RESULT:", {
    gatewayOrderId: gatewayOrder.id,
    orderStatus: gatewayOrder.status,
    orderAmount: gatewayOrder.amount,

    gatewayPaymentId: gatewayPayment.id,
    gatewayPaymentOrderId: gatewayPayment.order_id,
    paymentStatus: gatewayPayment.status,
    paymentAmount: gatewayPayment.amount,

    expectedAmountPaise,

    orderMatches,
    amountMatches,
    currencyMatches,
  });

  if (!orderMatches) {
    console.error("VERIFY FAILED: Razorpay order mismatch");

    throw new Error("Razorpay payment does not belong to this order");
  }

  if (!amountMatches || !currencyMatches) {
    console.error("VERIFY FAILED: Payment amount/currency mismatch");

    throw new Error("Razorpay payment amount or currency mismatch");
  }

  // ==========================================
  // 5. VERIFY CHECKOUT SIGNATURE
  // ==========================================

  console.log("VERIFYING RAZORPAY SIGNATURE");

  const isSignatureValid = verifyCheckoutSignature(
    data.razorpay_order_id,
    data.razorpay_payment_id,
    data.razorpay_signature,
  );

  console.log("SIGNATURE VERIFICATION:", {
    orderId: data.razorpay_order_id,
    paymentId: data.razorpay_payment_id,
    signatureLength: data.razorpay_signature.length,
    signatureValid: isSignatureValid,
  });

  if (!isSignatureValid) {
    console.error("VERIFY FAILED: Invalid Razorpay signature");

    console.error("POSSIBLE REASONS:", [
      "Incorrect RAZORPAY_KEY_SECRET",
      "Order created using a different Razorpay key",
      "Frontend signature does not match this checkout",
      "Different Razorpay environments",
    ]);

    throw new Error("Invalid Razorpay signature");
  }

  console.log("RAZORPAY SIGNATURE VERIFIED");

  // ==========================================
  // 6. CHECK PAYMENT CAPTURE STATUS
  // ==========================================

  console.log("PAYMENT CAPTURE CHECK:", {
    status: gatewayPayment.status,
    captured: gatewayPayment.captured,
  });

  if (gatewayPayment.status !== "captured") {
    throw new Error(
      `Razorpay payment is not captured: ${gatewayPayment.status}`,
    );
  }

  // ==========================================
  // 7. FINALIZE PAYMENT
  // ==========================================

  console.log("STARTING PAYMENT FINALIZATION");

  let result;

  try {
    result = await finalizeRazorpayPayment(
      data.razorpay_order_id,
      data.razorpay_payment_id,
    );
  } catch (error) {
    console.error("PAYMENT FINALIZATION FAILED:", error);

    throw error;
  }

  // ==========================================
  // 8. FINAL DEBUG
  // ==========================================

  console.log("PAYMENT FINALIZATION RESULT:", {
    paymentId: result.payment.id,
    gatewayPaymentId: result.payment.payment_id,
    status: result.payment.status,
    purpose: result.payment.purpose,
    alreadyProcessed: result.alreadyProcessed,
  });

  console.log("========== RAZORPAY VERIFY COMPLETED ==========\n");

  // ==========================================
  // 9. RESPONSE
  // ==========================================

  return {
    success: true,

    message: result.alreadyProcessed
      ? "Payment already processed"
      : "Payment processed successfully",

    payment: result.payment,
  };
}

// ============================================
// GET PAYMENT STATUS
// ============================================

export async function getRazorpayPaymentStatusService(
  userId: string,
  paymentId: string,
) {
  const payment = await razorpayRepository.findUserPayment(userId, paymentId);

  if (!payment) {
    throw new Error("Payment not found");
  }

  const purchaseMetadata = getPurchaseMetadata(payment.gatewayResponse);

  return {
    id: payment.id,
    purpose: payment.purpose,

    purchaseType: purchaseMetadata.purchaseType ?? null,

    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,

    referenceId: payment.referenceId,

    packagePriceId: payment.packagePriceId,

    paidAt: payment.paidAt,
  };
}
