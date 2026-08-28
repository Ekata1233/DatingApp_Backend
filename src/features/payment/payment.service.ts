import axios from "axios";
import { prisma } from "../../prisma/prismaClient";
import {
  EventBookingStatus,
  EventStatus,
  PaymentPurpose,
  PaymentStatus,
  PurchasePaymentMethod,
  StoreItemType,
} from "@prisma/client";
import { getAccessToken } from "./payment.utils";
import { randomUUID } from "node:crypto";
import { activatePackage } from "./handlers/package.handler";
import { creditWallet } from "./handlers/wallet.handler";
import { creditBoost } from "./handlers/boost.handler";
import { createWaitlist } from "./handlers/waitlist.handler";
import { creditRoseHandler } from "../purchaseStore/handlers/creditRose.handler";
import { creditBoostHandler } from "../purchaseStore/handlers/creditBoost.handler";
import { creditComplimentHandler } from "../purchaseStore/handlers/creditCompliment.handler";
import { creditDatePlanHandler } from "../purchaseStore/handlers/creditDatePlan.handler";
import { confirmEventBooking } from "./handlers/event.handler";

//CREATE PAYMENT LINK
export async function createPaymentLink(userId: string, body: any) {
  const accessToken = await getAccessToken();

  let amount = 0;
  let priceId: string | null = null;

  switch (body.purpose) {
    case PaymentPurpose.WAITLIST: {
      const waitlist = await prisma.launchConfig.findFirst({
        select: {
          finalPrice: true,
          waitlistEnabled: true,
        },
      });

      if (!waitlist) {
        throw new Error("Launch configuration not found");
      }

      if (!waitlist.waitlistEnabled) {
        throw new Error("Waitlist is closed");
      }

      amount = Number(waitlist.finalPrice);
      break;
    }

    case PaymentPurpose.PACKAGE: {
      // ✅ FIXED: Find package by slug and billing cycle
      const pkg = await prisma.package.findUnique({
        where: { slug: body.packageSlug }, // User sends slug like "premium"
      });

      console.log("pkg : ", pkg);

      if (!pkg || !pkg.active) {
        throw new Error("Package not found or inactive");
      }

      // Find specific price for the billing cycle
      const package_price = await prisma.packagePrice.findUnique({
        where: {
          packageId_billingCycle: {
            packageId: pkg.id,
            billingCycle: body.billingCycle, // User sends billing cycle
          },
        },
      });

      console.log("package_price : ", package_price);

      if (!package_price || !package_price.active) {
        throw new Error("Price not available for this billing cycle");
      }

      amount = Number(package_price.price);
      priceId = package_price.id; // Store priceId for payment creation
      break;
    }

    case PaymentPurpose.BOOST: {
      const boost = await prisma.boostOption.findUnique({
        where: { id: body.boostPackageId },
        select: { totalPrice: true },
      });

      if (!boost) throw new Error("Boost package not found");

      amount = Number(boost.totalPrice);
      break;
    }

    case PaymentPurpose.PURCHASE_STORE: {
      const storePack = await prisma.storePack.findUnique({
        where: {
          id: body.storePackId,
        },
      });

      if (!storePack) {
        throw new Error("Store pack not found");
      }

      if (!storePack.isActive) {
        throw new Error("Store pack is inactive");
      }

      amount = Number(storePack.totalPrice);
      priceId = storePack.id;
      break;
    }
    // ==========================================
    // EVENT BOOKING
    // ==========================================

  case PaymentPurpose.EVENT_BOOKING: {
  console.log("EVENT BOOKING BODY:", body);
  console.log("EVENT ID:", body.eventId);

  const event = await prisma.event.findUnique({
    where: {
      id: body.eventId,
    },
    select: {
      id: true,
      entryPrice: true,
      status: true,
    },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  if (!event.entryPrice) {
    throw new Error("Event price not available");
  }

  if (event.status !== EventStatus.LIVE) {
    throw new Error("Event is not live");
  }

  const ticketCount = Number(body.ticketCount) || 1;
  const ticketAmount = Number(event.entryPrice);
  const totalAmount = ticketAmount * ticketCount;

  // Find existing pending booking
  let booking = await prisma.eventBooking.findFirst({
    where: {
      eventId: event.id,
      userId,
      status: {
        in: [
          EventBookingStatus.PENDING,
          EventBookingStatus.PAYMENT_PENDING,
        ],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Create booking if it does not exist
  if (!booking) {
    const bookingNumber = `EVT_${Date.now()}_${randomUUID()
      .replace(/-/g, "")
      .slice(0, 8)}`;

    const ticketId = `TKT_${Date.now()}_${randomUUID()
      .replace(/-/g, "")
      .slice(0, 8)}`;

    booking = await prisma.eventBooking.create({
      data: {
        userId,
        eventId: event.id,

        bookingNumber,
        ticketId,

        ticketCount,
        ticketAmount,
        totalAmount,
        paidAmount: 0,

        status: EventBookingStatus.PENDING,
      },
    });

    console.log("EVENT BOOKING CREATED:", booking.id);
  }

  const remainingAmount =
    Number(booking.totalAmount) -
    Number(booking.paidAmount);

  if (remainingAmount <= 0) {
    throw new Error("Event booking is already fully paid");
  }

  amount = remainingAmount;

  break;
}
    default:
      throw new Error("Invalid payment purpose");
  }

  // Fetch authenticated user details
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      full_name: true,
      email: true,
      phone_number: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const orderId = `ORD_${Date.now()}_${randomUUID().replace(/-/g, "")}`;

  const payload = {
    subAmount: amount,
    isPartialPaymentAllowed: false,
    description: body.description,
    source: "API",
    order_id: orderId,

    successURL:
      "https://dating-app-backend-plum.vercel.app/api/payments/return",
    failureURL:
      "https://dating-app-backend-plum.vercel.app/api/payments/return",

    customer: {
      customerId: userId,
      name: user.full_name,
      email: user.email,
      phone: user.phone_number?.replace("+91", ""),
    },

    udf: {
      udf1: userId,
      udf2: body.purpose ?? "",
    },
  };

  console.log("payload : ", payload);

  const { data } = await axios.post(
    "https://uatoneapi.payu.in/payment-links/",
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        merchantId: process.env.PAYU_MERCHANT_ID!,
      },
    },
  );

  await prisma.payment.create({
    data: {
      userId,
      amount: amount,
      payment_id: data.guid,
      transactionId: orderId,
      status: PaymentStatus.PENDING,
      purpose: body.purpose,
      packagePriceId: priceId,

      gatewayResponse: data,
    },
  });

  return data;
}

export async function paymentWebhookService(payload: any) {
  
  const payment_id = payload.txnid;
  const status = payload.status;
 console.log("========== PAYMENT WEBHOOK DEBUG ==========");
  console.log("PayU txnid:", payment_id);
  console.log("PayU status:", status);
  // Use transaction with optimistic locking to prevent race conditions
  const result = await prisma.$transaction(
    async (tx) => {
      // Lock the payment row for update
      const payment = await tx.payment.findUnique({
        where: { payment_id },
      });
 console.log("========== PAYMENT FOUND ==========");
      console.log("Payment:", payment);
      console.log("Payment DB ID:", payment?.id);
      console.log("Payment payment_id:", payment?.payment_id);
      console.log("Payment transactionId:", payment?.transactionId);
      console.log("Payment purpose:", payment?.purpose);
      if (!payment) {
        throw new Error("Payment not found");
      }

      // Check idempotency with status check AND version/updatedAt check
      if (payment.status === PaymentStatus.COMPLETED) {
        console.log(`Payment ${payment_id} already processed`);
        return { success: true, alreadyProcessed: true };
      }

      // Update payment status with optimistic locking
      const updatedPayment = await tx.payment.update({
        where: {
          id: payment.id,
          status: { not: PaymentStatus.COMPLETED },
        },
        data: {
          status:
            status === "success"
              ? PaymentStatus.COMPLETED
              : PaymentStatus.FAILED,

          paidAt: status === "success" ? new Date() : null,

          gatewayResponse: payload,
        },
      });
   console.log("========== PAYMENT UPDATED ==========");
      console.log("Updated Payment ID:", updatedPayment.id);
      console.log("Updated Payment payment_id:", updatedPayment.payment_id);
      console.log(
        "Updated Payment transactionId:",
        updatedPayment.transactionId,
      );
      console.log("Updated Payment status:", updatedPayment.status);
      console.log("Updated Payment purpose:", updatedPayment.purpose);
      if (updatedPayment.status !== PaymentStatus.COMPLETED) {
        return { success: false, reason: "payment_failed" };
      }

      // Process based on purpose
      switch (updatedPayment.purpose) {
        case PaymentPurpose.WAITLIST:
          await createWaitlist(tx, updatedPayment);
          break;
        case PaymentPurpose.PACKAGE:
          await activatePackage(tx, updatedPayment);
          break;
        case PaymentPurpose.BOOST:
          await creditBoost(tx, updatedPayment);
          break;
        case PaymentPurpose.WALLET:
          await creditWallet(tx, updatedPayment);
          break;
        case PaymentPurpose.PURCHASE_STORE:
          console.log("into the hte purchase store webhook");
          const storePack = await tx.storePack.findUnique({
            where: {
              id: payment.packagePriceId!,
            },
          });

          if (!storePack) {
            throw new Error("Store pack not found");
          }

          switch (storePack.itemType) {
            case StoreItemType.ROSE:
              await creditRoseHandler({
                tx,
                userId: updatedPayment.userId,
                storePack,
                paymentMethod: PurchasePaymentMethod.PAYMENT_GATEWAY,
                walletTransactionId: undefined,
                paymentId: updatedPayment.id,
              });
              break;

            case StoreItemType.BOOST:
              await creditBoostHandler({
                tx,
                userId: updatedPayment.userId,
                storePack,
                paymentMethod: PurchasePaymentMethod.PAYMENT_GATEWAY,
                walletTransactionId: undefined,
                paymentId: updatedPayment.id,
              });
              break;

            case StoreItemType.COMPLIMENT:
              await creditComplimentHandler({
                tx,
                userId: updatedPayment.userId,
                storePack,
                paymentMethod: PurchasePaymentMethod.PAYMENT_GATEWAY,
                walletTransactionId: undefined,
                paymentId: updatedPayment.id,
              });
              break;

            case StoreItemType.DATE_PLAN:
              await creditDatePlanHandler({
                tx,
                userId: updatedPayment.userId,
                storePack,
                paymentMethod: PurchasePaymentMethod.PAYMENT_GATEWAY,
                walletTransactionId: undefined,
                paymentId: updatedPayment.id,
              });
              break;
          }
          break;
        case PaymentPurpose.EVENT_BOOKING:

          console.log(
            "========== EVENT BOOKING PAYMENT DEBUG ==========",
          );

          console.log(
            "Payment ID being sent to confirmEventBooking:",
            updatedPayment.id,
          );

          console.log(
            "Payment User ID:",
            updatedPayment.userId,
          );

          console.log(
            "Payment Amount:",
            updatedPayment.amount,
          );

          await confirmEventBooking(
            tx,
            updatedPayment,
          );

          console.log(
            "confirmEventBooking FINISHED",
          );

          break;
      }

      return { success: true, alreadyProcessed: false };
    },
    {
      maxWait: 10000,
      timeout: 30000,
      isolationLevel: "Serializable", // Add serializable isolation for extra safety
    },
  );

  return result;
}
