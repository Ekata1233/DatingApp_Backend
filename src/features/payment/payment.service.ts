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
  console.log("========== EVENT BOOKING DEBUG ==========");
  console.log("EVENT BOOKING BODY:", body);
  console.log("EVENT ID:", body.eventId);

  // ==========================================
  // 1. GET EVENT
  // ==========================================

  const event = await prisma.event.findUnique({
    where: {
      id: body.eventId,
    },
    select: {
      id: true,
      status: true,

      menCapacity: true,
      womenCapacity: true,
      otherCapacity: true,

      menEntryPrice: true,
      womenEntryPrice: true,
      otherEntryPrice: true,

      menDiscountedPrice: true,
      womenDiscountedPrice: true,
      otherDiscountedPrice: true,

      discountPercentage: true,
    },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  // ==========================================
  // 2. EVENT MUST BE LIVE
  // ==========================================

  if (event.status !== EventStatus.LIVE) {
    throw new Error("Event is not live");
  }

  // ==========================================
  // 3. GET TICKET COUNTS
  // ==========================================
  //
  // Frontend sends:
  //
  // menTicketCount
  // womenTicketCount
  // otherTicketCount
  //
  // Example:
  //
  // MEN   = 2
  // WOMEN = 1
  // OTHER = 1
  //
  // Total = 4
  //
  // ==========================================

  const menTicketCount = Number(
    body.menTicketCount ?? 0,
  );

  const womenTicketCount = Number(
    body.womenTicketCount ?? 0,
  );

  const otherTicketCount = Number(
    body.otherTicketCount ?? 0,
  );

  // ==========================================
  // 4. VALIDATE COUNTS
  // ==========================================

  if (
    !Number.isInteger(menTicketCount) ||
    !Number.isInteger(womenTicketCount) ||
    !Number.isInteger(otherTicketCount)
  ) {
    throw new Error(
      "Ticket count must be a valid integer",
    );
  }

  if (
    menTicketCount < 0 ||
    womenTicketCount < 0 ||
    otherTicketCount < 0
  ) {
    throw new Error(
      "Ticket count cannot be negative",
    );
  }

  const ticketCount =
    menTicketCount +
    womenTicketCount +
    otherTicketCount;

  if (ticketCount <= 0) {
    throw new Error(
      "At least one ticket is required",
    );
  }

  console.log("========== TICKET COUNTS ==========");
  console.log("MEN:", menTicketCount);
  console.log("WOMEN:", womenTicketCount);
  console.log("OTHER:", otherTicketCount);
  console.log("TOTAL:", ticketCount);

  // ==========================================
  // 5. GET FINAL PRICE FOR EACH TYPE
  // ==========================================

  const getFinalTicketPrice = (
    ticketType: "MEN" | "WOMEN" | "OTHER",
    entryPrice: any,
    discountedPrice: any,
  ) => {
    if (entryPrice === null) {
      throw new Error(
        `${ticketType} ticket entry price is not available`,
      );
    }

    return discountedPrice !== null
      ? Number(discountedPrice)
      : Number(entryPrice);
  };

  // ==========================================
  // MEN PRICE
  // ==========================================

  let menPrice = 0;

  if (menTicketCount > 0) {
    menPrice = getFinalTicketPrice(
      "MEN",
      event.menEntryPrice,
      event.menDiscountedPrice,
    );
  }

  // ==========================================
  // WOMEN PRICE
  // ==========================================

  let womenPrice = 0;

  if (womenTicketCount > 0) {
    womenPrice = getFinalTicketPrice(
      "WOMEN",
      event.womenEntryPrice,
      event.womenDiscountedPrice,
    );
  }

  // ==========================================
  // OTHER PRICE
  // ==========================================

  let otherPrice = 0;

  if (otherTicketCount > 0) {
    otherPrice = getFinalTicketPrice(
      "OTHER",
      event.otherEntryPrice,
      event.otherDiscountedPrice,
    );
  }

  console.log("========== TICKET PRICES ==========");
  console.log("MEN PRICE:", menPrice);
  console.log("WOMEN PRICE:", womenPrice);
  console.log("OTHER PRICE:", otherPrice);

  // ==========================================
  // 6. CHECK MEN CAPACITY
  // ==========================================

  if (menTicketCount > 0) {
    if (
      event.menCapacity === null ||
      event.menCapacity <= 0
    ) {
      throw new Error(
        "MEN ticket capacity is not available",
      );
    }

    const bookedMen =
      await prisma.eventBookingTicket.count({
        where: {
          booking: {
            eventId: event.id,
          },

          ticketType: "MEN",

          status: {
            in: [
              "PENDING",
              "CONFIRMED",
            ],
          },
        },
      });

    const remainingMen =
      Math.max(
        event.menCapacity - bookedMen,
        0,
      );

    console.log("MEN CAPACITY:", event.menCapacity);
    console.log("MEN BOOKED:", bookedMen);
    console.log("MEN REMAINING:", remainingMen);

    if (menTicketCount > remainingMen) {
      throw new Error(
        `Only ${remainingMen} MEN ticket(s) available`,
      );
    }
  }

  // ==========================================
  // 7. CHECK WOMEN CAPACITY
  // ==========================================

  if (womenTicketCount > 0) {
    if (
      event.womenCapacity === null ||
      event.womenCapacity <= 0
    ) {
      throw new Error(
        "WOMEN ticket capacity is not available",
      );
    }

    const bookedWomen =
      await prisma.eventBookingTicket.count({
        where: {
          booking: {
            eventId: event.id,
          },

          ticketType: "WOMEN",

          status: {
            in: [
              "PENDING",
              "CONFIRMED",
            ],
          },
        },
      });

    const remainingWomen =
      Math.max(
        event.womenCapacity - bookedWomen,
        0,
      );

    console.log(
      "WOMEN CAPACITY:",
      event.womenCapacity,
    );

    console.log(
      "WOMEN BOOKED:",
      bookedWomen,
    );

    console.log(
      "WOMEN REMAINING:",
      remainingWomen,
    );

    if (
      womenTicketCount > remainingWomen
    ) {
      throw new Error(
        `Only ${remainingWomen} WOMEN ticket(s) available`,
      );
    }
  }

  // ==========================================
  // 8. CHECK OTHER CAPACITY
  // ==========================================

  if (otherTicketCount > 0) {
    if (
      event.otherCapacity === null ||
      event.otherCapacity <= 0
    ) {
      throw new Error(
        "OTHER ticket capacity is not available",
      );
    }

    const bookedOther =
      await prisma.eventBookingTicket.count({
        where: {
          booking: {
            eventId: event.id,
          },

          ticketType: "OTHER",

          status: {
            in: [
              "PENDING",
              "CONFIRMED",
            ],
          },
        },
      });

    const remainingOther =
      Math.max(
        event.otherCapacity - bookedOther,
        0,
      );

    console.log(
      "OTHER CAPACITY:",
      event.otherCapacity,
    );

    console.log(
      "OTHER BOOKED:",
      bookedOther,
    );

    console.log(
      "OTHER REMAINING:",
      remainingOther,
    );

    if (
      otherTicketCount > remainingOther
    ) {
      throw new Error(
        `Only ${remainingOther} OTHER ticket(s) available`,
      );
    }
  }

  // ==========================================
  // 9. CALCULATE TOTAL TICKET AMOUNT
  // ==========================================

  const totalAmount =
    menPrice * menTicketCount +
    womenPrice * womenTicketCount +
    otherPrice * otherTicketCount;

  const ticketAmount = totalAmount;

  console.log(
    "========== PRICE CALCULATION ==========",
  );

  console.log(
    "MEN:",
    menTicketCount,
    "*",
    menPrice,
  );

  console.log(
    "WOMEN:",
    womenTicketCount,
    "*",
    womenPrice,
  );

  console.log(
    "OTHER:",
    otherTicketCount,
    "*",
    otherPrice,
  );

  console.log(
    "TICKET COUNT:",
    ticketCount,
  );

  console.log(
    "TOTAL AMOUNT:",
    totalAmount,
  );

  // ==========================================
  // 10. CREATE BOOKING
  // ==========================================

  const bookingNumber =
    `EVT_${Date.now()}_${randomUUID()
      .replace(/-/g, "")
      .slice(0, 8)}`;

  const booking =
    await prisma.eventBooking.create({
      data: {
        userId,
        eventId: event.id,

        bookingNumber,

        ticketCount,

        ticketAmount,

        totalAmount,

        paidAmount: 0,

        status: EventBookingStatus.PENDING,

        tickets: {
          create: [
            // ==================================
            // MEN TICKETS
            // ==================================

            ...Array.from(
              {
                length: menTicketCount,
              },
              () => ({
                ticketId:
                  `TKT_${Date.now()}_${randomUUID()
                    .replace(/-/g, "")
                    .slice(0, 8)}`,

                ticketType: "MEN" as const,

                ticketAmount: menPrice,

                status: "PENDING" as const,
              }),
            ),

            // ==================================
            // WOMEN TICKETS
            // ==================================

            ...Array.from(
              {
                length: womenTicketCount,
              },
              () => ({
                ticketId:
                  `TKT_${Date.now()}_${randomUUID()
                    .replace(/-/g, "")
                    .slice(0, 8)}`,

                ticketType: "WOMEN" as const,

                ticketAmount: womenPrice,

                status: "PENDING" as const,
              }),
            ),

            // ==================================
            // OTHER TICKETS
            // ==================================

            ...Array.from(
              {
                length: otherTicketCount,
              },
              () => ({
                ticketId:
                  `TKT_${Date.now()}_${randomUUID()
                    .replace(/-/g, "")
                    .slice(0, 8)}`,

                ticketType: "OTHER" as const,

                ticketAmount: otherPrice,

                status: "PENDING" as const,
              }),
            ),
          ],
        },
      },

      include: {
        tickets: true,
      },
    });

  console.log(
    "========== EVENT BOOKING CREATED ==========",
  );

  console.log(
    "Booking ID:",
    booking.id,
  );

  console.log(
    "Booking Number:",
    booking.bookingNumber,
  );

  console.log(
    "Ticket Count:",
    booking.ticketCount,
  );

  console.log(
    "Tickets:",
    booking.tickets,
  );

  // ==========================================
  // 11. PAYMENT AMOUNT
  // ==========================================

  amount = totalAmount;

  break;
}
    default:
      throw new Error("Invalid payment purpose");
  }

  // Fetch authenticated user details
 const user = await prisma.user.findUnique({
  where: {
    id: userId,
  },
  select: {
    id: true,
    gender: true,
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
          console.log("========== EVENT BOOKING PAYMENT DEBUG ==========");

          console.log(
            "Payment ID being sent to confirmEventBooking:",
            updatedPayment.id,
          );

          console.log("Payment User ID:", updatedPayment.userId);

          console.log("Payment Amount:", updatedPayment.amount);

          await confirmEventBooking(tx, updatedPayment);

          console.log("confirmEventBooking FINISHED");

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
