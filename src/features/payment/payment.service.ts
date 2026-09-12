  // import axios from "axios";

  // import { getAccessToken } from "./payment.utils";
 
  // import { activatePackage } from "./handlers/package.handler";
  // import { creditWallet } from "./handlers/wallet.handler";
  // import { creditBoost } from "./handlers/boost.handler";
  // import { createWaitlist } from "./handlers/waitlist.handler";
  // import { creditRoseHandler } from "../purchaseStore/handlers/creditRose.handler";
  // import { creditBoostHandler } from "../purchaseStore/handlers/creditBoost.handler";
  // import { creditComplimentHandler } from "../purchaseStore/handlers/creditCompliment.handler";
  // import { creditDatePlanHandler } from "../purchaseStore/handlers/creditDatePlan.handler";
  // import { confirmEventBooking, confirmsEventBooking } from "./handlers/event.handler";

  // //CREATE PAYMENT LINK
  // export async function createPaymentLink(userId: string, body: any) {
  //   const accessToken = await getAccessToken();

  //   let amount = 0;
  //   let priceId: string | null = null;

  //   switch (body.purpose) {
  //     case PaymentPurpose.WAITLIST: {
  //       const waitlist = await prisma.launchConfig.findFirst({
  //         select: {
  //           finalPrice: true,
  //           waitlistEnabled: true,
  //         },
  //       });

  //       if (!waitlist) {
  //         throw new Error("Launch configuration not found");
  //       }

  //       if (!waitlist.waitlistEnabled) {
  //         throw new Error("Waitlist is closed");
  //       }

  //       amount = Number(waitlist.finalPrice);
  //       break;
  //     }

  //     case PaymentPurpose.PACKAGE: {
  //       // ✅ FIXED: Find package by slug and billing cycle
  //       const pkg = await prisma.package.findUnique({
  //         where: { slug: body.packageSlug }, // User sends slug like "premium"
  //       });

  //       console.log("pkg : ", pkg);

  //       if (!pkg || !pkg.active) {
  //         throw new Error("Package not found or inactive");
  //       }

  //       // Find specific price for the billing cycle
  //       const package_price = await prisma.packagePrice.findUnique({
  //         where: {
  //           packageId_billingCycle: {
  //             packageId: pkg.id,
  //             billingCycle: body.billingCycle, // User sends billing cycle
  //           },
  //         },
  //       });

  //       console.log("package_price : ", package_price);

  //       if (!package_price || !package_price.active) {
  //         throw new Error("Price not available for this billing cycle");
  //       }

  //       amount = Number(package_price.price);
  //       priceId = package_price.id; // Store priceId for payment creation
  //       break;
  //     }

  //     case PaymentPurpose.BOOST: {
  //       const boost = await prisma.boostOption.findUnique({
  //         where: { id: body.boostPackageId },
  //         select: { totalPrice: true },
  //       });

  //       if (!boost) throw new Error("Boost package not found");

  //       amount = Number(boost.totalPrice);
  //       break;
  //     }

  //     case PaymentPurpose.PURCHASE_STORE: {
  //       const storePack = await prisma.storePack.findUnique({
  //         where: {
  //           id: body.storePackId,
  //         },
  //       });

  //       if (!storePack) {
  //         throw new Error("Store pack not found");
  //       }

  //       if (!storePack.isActive) {
  //         throw new Error("Store pack is inactive");
  //       }

  //       amount = Number(storePack.totalPrice);
  //       priceId = storePack.id;
  //       break;
  //     }
  //     // ==========================================
  //     // EVENT BOOKING
  //     // ==========================================

  //   case PaymentPurpose.EVENT_BOOKING: {
  //   console.log("========== EVENT BOOKING DEBUG ==========");
  //   console.log("EVENT BOOKING BODY:", body);
  //   console.log("EVENT ID:", body.eventId);

  //   // ==========================================
  //   // 1. GET EVENT
  //   // ==========================================

  //   const event = await prisma.event.findUnique({
  //     where: {
  //       id: body.eventId,
  //     },
  //     select: {
  //       id: true,
  //       status: true,

  //       menCapacity: true,
  //       womenCapacity: true,
  //       otherCapacity: true,

  //       menEntryPrice: true,
  //       womenEntryPrice: true,
  //       otherEntryPrice: true,

  //       menDiscountedPrice: true,
  //       womenDiscountedPrice: true,
  //       otherDiscountedPrice: true,

  //       discountPercentage: true,
  //     },
  //   });

  //   if (!event) {
  //     throw new Error("Event not found");
  //   }

  //   // ==========================================
  //   // 2. EVENT MUST BE LIVE
  //   // ==========================================

  //   if (event.status !== EventStatus.LIVE) {
  //     throw new Error("Event is not live");
  //   }

  //   // ==========================================
  //   // 3. GET TICKET COUNTS
  //   // ==========================================
  //   //
  //   // Frontend sends:
  //   //
  //   // menTicketCount
  //   // womenTicketCount
  //   // otherTicketCount
  //   //
  //   // Example:
  //   //
  //   // MEN   = 2
  //   // WOMEN = 1
  //   // OTHER = 1
  //   //
  //   // Total = 4
  //   //
  //   // ==========================================

  //   const menTicketCount = Number(
  //     body.menTicketCount ?? 0,
  //   );

  //   const womenTicketCount = Number(
  //     body.womenTicketCount ?? 0,
  //   );

  //   const otherTicketCount = Number(
  //     body.otherTicketCount ?? 0,
  //   );

  //   // ==========================================
  //   // 4. VALIDATE COUNTS
  //   // ==========================================

  //   if (
  //     !Number.isInteger(menTicketCount) ||
  //     !Number.isInteger(womenTicketCount) ||
  //     !Number.isInteger(otherTicketCount)
  //   ) {
  //     throw new Error(
  //       "Ticket count must be a valid integer",
  //     );
  //   }

  //   if (
  //     menTicketCount < 0 ||
  //     womenTicketCount < 0 ||
  //     otherTicketCount < 0
  //   ) {
  //     throw new Error(
  //       "Ticket count cannot be negative",
  //     );
  //   }

  //   const ticketCount =
  //     menTicketCount +
  //     womenTicketCount +
  //     otherTicketCount;

  //   if (ticketCount <= 0) {
  //     throw new Error(
  //       "At least one ticket is required",
  //     );
  //   }

  //   console.log("========== TICKET COUNTS ==========");
  //   console.log("MEN:", menTicketCount);
  //   console.log("WOMEN:", womenTicketCount);
  //   console.log("OTHER:", otherTicketCount);
  //   console.log("TOTAL:", ticketCount);

  //   // ==========================================
  //   // 5. GET FINAL PRICE FOR EACH TYPE
  //   // ==========================================

  //   const getFinalTicketPrice = (
  //     ticketType: "MEN" | "WOMEN" | "OTHER",
  //     entryPrice: any,
  //     discountedPrice: any,
  //   ) => {
  //     if (entryPrice === null) {
  //       throw new Error(
  //         `${ticketType} ticket entry price is not available`,
  //       );
  //     }

  //     return discountedPrice !== null
  //       ? Number(discountedPrice)
  //       : Number(entryPrice);
  //   };

  //   // ==========================================
  //   // MEN PRICE
  //   // ==========================================

  //   let menPrice = 0;

  //   if (menTicketCount > 0) {
  //     menPrice = getFinalTicketPrice(
  //       "MEN",
  //       event.menEntryPrice,
  //       event.menDiscountedPrice,
  //     );
  //   }

  //   // ==========================================
  //   // WOMEN PRICE
  //   // ==========================================

  //   let womenPrice = 0;

  //   if (womenTicketCount > 0) {
  //     womenPrice = getFinalTicketPrice(
  //       "WOMEN",
  //       event.womenEntryPrice,
  //       event.womenDiscountedPrice,
  //     );
  //   }

  //   // ==========================================
  //   // OTHER PRICE
  //   // ==========================================

  //   let otherPrice = 0;

  //   if (otherTicketCount > 0) {
  //     otherPrice = getFinalTicketPrice(
  //       "OTHER",
  //       event.otherEntryPrice,
  //       event.otherDiscountedPrice,
  //     );
  //   }

  //   console.log("========== TICKET PRICES ==========");
  //   console.log("MEN PRICE:", menPrice);
  //   console.log("WOMEN PRICE:", womenPrice);
  //   console.log("OTHER PRICE:", otherPrice);

  //   // ==========================================
  //   // 6. CHECK MEN CAPACITY
  //   // ==========================================

  //   if (menTicketCount > 0) {
  //     if (
  //       event.menCapacity === null ||
  //       event.menCapacity <= 0
  //     ) {
  //       throw new Error(
  //         "MEN ticket capacity is not available",
  //       );
  //     }

  //     const bookedMen =
  //       await prisma.eventBookingTicket.count({
  //         where: {
  //           booking: {
  //             eventId: event.id,
  //           },

  //           ticketType: "MEN",

  //           status: {
  //             in: [
  //               "PENDING",
  //               "CONFIRMED",
  //             ],
  //           },
  //         },
  //       });

  //     const remainingMen =
  //       Math.max(
  //         event.menCapacity - bookedMen,
  //         0,
  //       );

  //     console.log("MEN CAPACITY:", event.menCapacity);
  //     console.log("MEN BOOKED:", bookedMen);
  //     console.log("MEN REMAINING:", remainingMen);

  //     if (menTicketCount > remainingMen) {
  //       throw new Error(
  //         `Only ${remainingMen} MEN ticket(s) available`,
  //       );
  //     }
  //   }

  //   // ==========================================
  //   // 7. CHECK WOMEN CAPACITY
  //   // ==========================================

  //   if (womenTicketCount > 0) {
  //     if (
  //       event.womenCapacity === null ||
  //       event.womenCapacity <= 0
  //     ) {
  //       throw new Error(
  //         "WOMEN ticket capacity is not available",
  //       );
  //     }

  //     const bookedWomen =
  //       await prisma.eventBookingTicket.count({
  //         where: {
  //           booking: {
  //             eventId: event.id,
  //           },

  //           ticketType: "WOMEN",

  //           status: {
  //             in: [
  //               "PENDING",
  //               "CONFIRMED",
  //             ],
  //           },
  //         },
  //       });

  //     const remainingWomen =
  //       Math.max(
  //         event.womenCapacity - bookedWomen,
  //         0,
  //       );

  //     console.log(
  //       "WOMEN CAPACITY:",
  //       event.womenCapacity,
  //     );

  //     console.log(
  //       "WOMEN BOOKED:",
  //       bookedWomen,
  //     );

  //     console.log(
  //       "WOMEN REMAINING:",
  //       remainingWomen,
  //     );

  //     if (
  //       womenTicketCount > remainingWomen
  //     ) {
  //       throw new Error(
  //         `Only ${remainingWomen} WOMEN ticket(s) available`,
  //       );
  //     }
  //   }

  //   // ==========================================
  //   // 8. CHECK OTHER CAPACITY
  //   // ==========================================

  //   if (otherTicketCount > 0) {
  //     if (
  //       event.otherCapacity === null ||
  //       event.otherCapacity <= 0
  //     ) {
  //       throw new Error(
  //         "OTHER ticket capacity is not available",
  //       );
  //     }

  //     const bookedOther =
  //       await prisma.eventBookingTicket.count({
  //         where: {
  //           booking: {
  //             eventId: event.id,
  //           },

  //           ticketType: "OTHER",

  //           status: {
  //             in: [
  //               "PENDING",
  //               "CONFIRMED",
  //             ],
  //           },
  //         },
  //       });

  //     const remainingOther =
  //       Math.max(
  //         event.otherCapacity - bookedOther,
  //         0,
  //       );

  //     console.log(
  //       "OTHER CAPACITY:",
  //       event.otherCapacity,
  //     );

  //     console.log(
  //       "OTHER BOOKED:",
  //       bookedOther,
  //     );

  //     console.log(
  //       "OTHER REMAINING:",
  //       remainingOther,
  //     );

  //     if (
  //       otherTicketCount > remainingOther
  //     ) {
  //       throw new Error(
  //         `Only ${remainingOther} OTHER ticket(s) available`,
  //       );
  //     }
  //   }

  //   // ==========================================
  //   // 9. CALCULATE TOTAL TICKET AMOUNT
  //   // ==========================================

  //   const totalAmount =
  //     menPrice * menTicketCount +
  //     womenPrice * womenTicketCount +
  //     otherPrice * otherTicketCount;

  //   const ticketAmount = totalAmount;

  //   console.log(
  //     "========== PRICE CALCULATION ==========",
  //   );

  //   console.log(
  //     "MEN:",
  //     menTicketCount,
  //     "*",
  //     menPrice,
  //   );

  //   console.log(
  //     "WOMEN:",
  //     womenTicketCount,
  //     "*",
  //     womenPrice,
  //   );

  //   console.log(
  //     "OTHER:",
  //     otherTicketCount,
  //     "*",
  //     otherPrice,
  //   );

  //   console.log(
  //     "TICKET COUNT:",
  //     ticketCount,
  //   );

  //   console.log(
  //     "TOTAL AMOUNT:",
  //     totalAmount,
  //   );

  //   // ==========================================
  //   // 10. CREATE BOOKING
  //   // ==========================================

  //   const bookingNumber =
  //     `EVT_${Date.now()}_${randomUUID()
  //       .replace(/-/g, "")
  //       .slice(0, 8)}`;

  //   const booking =
  //     await prisma.eventBooking.create({
  //       data: {
  //         userId,
  //         eventId: event.id,

  //         bookingNumber,

  //         ticketCount,

  //         ticketAmount,

  //         totalAmount,

  //         paidAmount: 0,

  //         status: EventBookingStatus.PENDING,

  //         tickets: {
  //           create: [
  //             // ==================================
  //             // MEN TICKETS
  //             // ==================================

  //             ...Array.from(
  //               {
  //                 length: menTicketCount,
  //               },
  //               () => ({
  //                 ticketId:
  //                   `TKT_${Date.now()}_${randomUUID()
  //                     .replace(/-/g, "")
  //                     .slice(0, 8)}`,

  //                 ticketType: "MEN" as const,

  //                 ticketAmount: menPrice,

  //                 status: "PENDING" as const,
  //               }),
  //             ),

  //             // ==================================
  //             // WOMEN TICKETS
  //             // ==================================

  //             ...Array.from(
  //               {
  //                 length: womenTicketCount,
  //               },
  //               () => ({
  //                 ticketId:
  //                   `TKT_${Date.now()}_${randomUUID()
  //                     .replace(/-/g, "")
  //                     .slice(0, 8)}`,

  //                 ticketType: "WOMEN" as const,

  //                 ticketAmount: womenPrice,

  //                 status: "PENDING" as const,
  //               }),
  //             ),

  //             // ==================================
  //             // OTHER TICKETS
  //             // ==================================

  //             ...Array.from(
  //               {
  //                 length: otherTicketCount,
  //               },
  //               () => ({
  //                 ticketId:
  //                   `TKT_${Date.now()}_${randomUUID()
  //                     .replace(/-/g, "")
  //                     .slice(0, 8)}`,

  //                 ticketType: "OTHER" as const,

  //                 ticketAmount: otherPrice,

  //                 status: "PENDING" as const,
  //               }),
  //             ),
  //           ],
  //         },
  //       },

  //       include: {
  //         tickets: true,
  //       },
  //     });

  //   console.log(
  //     "========== EVENT BOOKING CREATED ==========",
  //   );

  //   console.log(
  //     "Booking ID:",
  //     booking.id,
  //   );

  //   console.log(
  //     "Booking Number:",
  //     booking.bookingNumber,
  //   );

  //   console.log(
  //     "Ticket Count:",
  //     booking.ticketCount,
  //   );

  //   console.log(
  //     "Tickets:",
  //     booking.tickets,
  //   );

  //   // ==========================================
  //   // 11. PAYMENT AMOUNT
  //   // ==========================================

  //   amount = totalAmount;

  //   break;
  // }
  //     default:
  //       throw new Error("Invalid payment purpose");
  //   }

  //   // Fetch authenticated user details
  // const user = await prisma.user.findUnique({
  //   where: {
  //     id: userId,
  //   },
  //   select: {
  //     id: true,
  //     gender: true,
  //     full_name: true,
  //     email: true,
  //     phone_number: true,
  //   },
  // });

  // if (!user) {
  //   throw new Error("User not found");
  // }

  //   const orderId = `ORD_${Date.now()}_${randomUUID().replace(/-/g, "")}`;

  //   const payload = {
  //     subAmount: amount,
  //     isPartialPaymentAllowed: false,
  //     description: body.description,
  //     source: "API",
  //     order_id: orderId,

  //     successURL:
  //       "https://dating-app-backend-plum.vercel.app/api/payments/return",
  //     failureURL:
  //       "https://dating-app-backend-plum.vercel.app/api/payments/return",

  //     customer: {
  //       customerId: userId,
  //       name: user.full_name,
  //       email: user.email,
  //       phone: user.phone_number?.replace("+91", ""),
  //     },

  //     udf: {
  //       udf1: userId,
  //       udf2: body.purpose ?? "",
  //     },
  //   };

  //   console.log("payload : ", payload);

  //   const { data } = await axios.post(
  //     "https://uatoneapi.payu.in/payment-links/",
  //     payload,
  //     {
  //       headers: {
  //         Authorization: `Bearer ${accessToken}`,
  //         merchantId: process.env.PAYU_MERCHANT_ID!,
  //       },
  //     },
  //   );

  //   await prisma.payment.create({
  //     data: {
  //       userId,
  //       amount: amount,
  //       payment_id: data.guid,
  //       transactionId: orderId,
  //       status: PaymentStatus.PENDING,
  //       purpose: body.purpose,
  //       packagePriceId: priceId,

  //       gatewayResponse: data,
  //     },
  //   });

  //   return data;
  // }

  // export async function paymentWebhookService(payload: any) {
  //   const payment_id = payload.txnid;
  //   const status = payload.status;
  //   console.log("========== PAYMENT WEBHOOK DEBUG ==========");
  //   console.log("PayU txnid:", payment_id);
  //   console.log("PayU status:", status);
  //   // Use transaction with optimistic locking to prevent race conditions
  //   const result = await prisma.$transaction(
  //     async (tx) => {
  //       // Lock the payment row for update
  //       const payment = await tx.payment.findUnique({
  //         where: { payment_id },
  //       });
  //       console.log("========== PAYMENT FOUND ==========");
  //       console.log("Payment:", payment);
  //       console.log("Payment DB ID:", payment?.id);
  //       console.log("Payment payment_id:", payment?.payment_id);
  //       console.log("Payment transactionId:", payment?.transactionId);
  //       console.log("Payment purpose:", payment?.purpose);
  //       if (!payment) {
  //         throw new Error("Payment not found");
  //       }

  //       // Check idempotency with status check AND version/updatedAt check
  //       if (payment.status === PaymentStatus.COMPLETED) {
  //         console.log(`Payment ${payment_id} already processed`);
  //         return { success: true, alreadyProcessed: true };
  //       }

  //       // Update payment status with optimistic locking
  //       const updatedPayment = await tx.payment.update({
  //         where: {
  //           id: payment.id,
  //           status: { not: PaymentStatus.COMPLETED },
  //         },
  //         data: {
  //           status:
  //             status === "success"
  //               ? PaymentStatus.COMPLETED
  //               : PaymentStatus.FAILED,

  //           paidAt: status === "success" ? new Date() : null,

  //           gatewayResponse: payload,
  //         },
  //       });
  //       console.log("========== PAYMENT UPDATED ==========");
  //       console.log("Updated Payment ID:", updatedPayment.id);
  //       console.log("Updated Payment payment_id:", updatedPayment.payment_id);
  //       console.log(
  //         "Updated Payment transactionId:",
  //         updatedPayment.transactionId,
  //       );
  //       console.log("Updated Payment status:", updatedPayment.status);
  //       console.log("Updated Payment purpose:", updatedPayment.purpose);
  //       if (updatedPayment.status !== PaymentStatus.COMPLETED) {
  //         return { success: false, reason: "payment_failed" };
  //       }

  //       // Process based on purpose
  //       switch (updatedPayment.purpose) {
  //         case PaymentPurpose.WAITLIST:
  //           await createWaitlist(tx, updatedPayment);
  //           break;
  //         case PaymentPurpose.PACKAGE:
  //           await activatePackage(tx, updatedPayment);
  //           break;
  //         case PaymentPurpose.BOOST:
  //           await creditBoost(tx, updatedPayment);
  //           break;
  //         case PaymentPurpose.WALLET:
  //           await creditWallet(tx, updatedPayment);
  //           break;
  //         case PaymentPurpose.PURCHASE_STORE:
  //           console.log("into the hte purchase store webhook");
  //           const storePack = await tx.storePack.findUnique({
  //             where: {
  //               id: payment.packagePriceId!,
  //             },
  //           });

  //           if (!storePack) {
  //             throw new Error("Store pack not found");
  //           }

  //           switch (storePack.itemType) {
  //             case StoreItemType.ROSE:
  //               await creditRoseHandler({
  //                 tx,
  //                 userId: updatedPayment.userId,
  //                 storePack,
  //                 paymentMethod: PurchasePaymentMethod.PAYMENT_GATEWAY,
  //                 walletTransactionId: undefined,
  //                 paymentId: updatedPayment.id,
  //               });
  //               break;

  //             case StoreItemType.BOOST:
  //               await creditBoostHandler({
  //                 tx,
  //                 userId: updatedPayment.userId,
  //                 storePack,
  //                 paymentMethod: PurchasePaymentMethod.PAYMENT_GATEWAY,
  //                 walletTransactionId: undefined,
  //                 paymentId: updatedPayment.id,
  //               });
  //               break;

  //             case StoreItemType.COMPLIMENT:
  //               await creditComplimentHandler({
  //                 tx,
  //                 userId: updatedPayment.userId,
  //                 storePack,
  //                 paymentMethod: PurchasePaymentMethod.PAYMENT_GATEWAY,
  //                 walletTransactionId: undefined,
  //                 paymentId: updatedPayment.id,
  //               });
  //               break;

  //             case StoreItemType.DATE_PLAN:
  //               await creditDatePlanHandler({
  //                 tx,
  //                 userId: updatedPayment.userId,
  //                 storePack,
  //                 paymentMethod: PurchasePaymentMethod.PAYMENT_GATEWAY,
  //                 walletTransactionId: undefined,
  //                 paymentId: updatedPayment.id,
  //               });
  //               break;
  //           }
  //           break;
  //         case PaymentPurpose.EVENT_BOOKING:
  //           console.log("========== EVENT BOOKING PAYMENT DEBUG ==========");

  //           console.log(
  //             "Payment ID being sent to confirmEventBooking:",
  //             updatedPayment.id,
  //           );

  //           console.log("Payment User ID:", updatedPayment.userId);

  //           console.log("Payment Amount:", updatedPayment.amount);

  //           await confirmEventBooking(tx, updatedPayment);

  //           console.log("confirmEventBooking FINISHED");

  //           break;
  //       }

  //       return { success: true, alreadyProcessed: false };
  //     },
  //     {
  //       maxWait: 10000,
  //       timeout: 30000,
  //       isolationLevel: "Serializable", // Add serializable isolation for extra safety
  //     },
  //   );

  //   return result;
  // }



  


import { razorpay } from "../../config/razorpay";
  import { prisma } from "../../prisma/prismaClient";
  import {
    EventBookingStatus,
    EventStatus,
    PaymentPurpose,
    PaymentStatus,
    PurchasePaymentMethod,
    StoreItemType,
  } from "@prisma/client";
   import { randomUUID } from "node:crypto";
import {
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
} from "./payment.utils";

import type {
  CreatePaymentsOrderDTO,
  VerifyPaymentsDTO,
} from "./payment.validation";

import type {
  RazorpayWebhookPayload,
} from "./payment.types";
  import {  confirmsEventBooking } from "./handlers/event.handler";



// ============================================
// MONEY HELPERS
// ============================================

const convertToPaise = (
  amount: number,
): number => {
  return Math.round(amount * 100);
};

const convertFromPaise = (
  amount: number,
): number => {
  return amount / 100;
};

// ✅ NEW CHANGE
// Used only to safely round money values
// to 2 decimal places.
const roundAmount = (
  amount: number,
): number => {
  return (
    Math.round(
      (amount +
        Number.EPSILON) *
        100,
    ) / 100
  );
};

// ============================================
// CREATE EVENT BOOKING FOR PAYMENT
// ============================================

const createEventBookingForPayment =
  async (
    userId: string,
    data: CreatePaymentsOrderDTO,
  ) => {
    if (!data.eventId) {
      throw new Error(
        "Event ID is required",
      );
    }

    // =====================================
    // GET EVENT
    // =====================================

    const event =
      await prisma.event.findUnique({
        where: {
          id: data.eventId,
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
        },
      });

    if (!event) {
      throw new Error(
        "Event not found",
      );
    }

    if (
      event.status !==
      EventStatus.LIVE
    ) {
      throw new Error(
        "Event is not live",
      );
    }

    // =====================================
    // TICKET COUNTS
    // =====================================

    const menTicketCount =
      Number(
        data.menTicketCount ?? 0,
      );

    const womenTicketCount =
      Number(
        data.womenTicketCount ?? 0,
      );

    const otherTicketCount =
      Number(
        data.otherTicketCount ?? 0,
      );

    if (
      !Number.isInteger(
        menTicketCount,
      ) ||
      !Number.isInteger(
        womenTicketCount,
      ) ||
      !Number.isInteger(
        otherTicketCount,
      )
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

    // =====================================
    // ✅ NEW CHANGE
    // GET GLOBAL GST + PLATFORM FEE
    // =====================================

    const globalAmount =
      await prisma.globalAmount.findFirst();

    if (!globalAmount) {
      throw new Error(
        "Global amount configuration not found",
      );
    }

    const gstPercentage =
      Number(
        globalAmount.gst,
      );

    const eventPlatformFee =
      Number(
        globalAmount.eventPlatformFee,
      );

    if (
      !Number.isFinite(
        gstPercentage,
      ) ||
      gstPercentage < 0 ||
      gstPercentage > 100
    ) {
      throw new Error(
        "Invalid GST configuration",
      );
    }

    if (
      !Number.isFinite(
        eventPlatformFee,
      ) ||
      eventPlatformFee < 0
    ) {
      throw new Error(
        "Invalid event platform fee configuration",
      );
    }

    // =====================================
    // PRICE
    // =====================================
    // YOUR EXISTING LOGIC - UNCHANGED
    // =====================================

    const getFinalPrice = (
      type:
        | "MEN"
        | "WOMEN"
        | "OTHER",
      entryPrice: any,
      discountedPrice: any,
    ) => {
      if (entryPrice === null) {
        throw new Error(
          `${type} ticket price is unavailable`,
        );
      }

      return discountedPrice !==
        null
        ? Number(
            discountedPrice,
          )
        : Number(
            entryPrice,
          );
    };

    const menPrice =
      menTicketCount > 0
        ? getFinalPrice(
            "MEN",
            event.menEntryPrice,
            event.menDiscountedPrice,
          )
        : 0;

    const womenPrice =
      womenTicketCount > 0
        ? getFinalPrice(
            "WOMEN",
            event.womenEntryPrice,
            event.womenDiscountedPrice,
          )
        : 0;

    const otherPrice =
      otherTicketCount > 0
        ? getFinalPrice(
            "OTHER",
            event.otherEntryPrice,
            event.otherDiscountedPrice,
          )
        : 0;

    // =====================================
    // CAPACITY
    // =====================================
    // YOUR EXISTING LOGIC - UNCHANGED
    // =====================================

    const checkCapacity = async (
      ticketType:
        | "MEN"
        | "WOMEN"
        | "OTHER",
      requestedCount: number,
      capacity: number | null,
    ) => {
      if (
        requestedCount <= 0
      ) {
        return;
      }

      if (
        capacity === null ||
        capacity <= 0
      ) {
        throw new Error(
          `${ticketType} ticket capacity is not available`,
        );
      }

      const alreadyBooked =
        await prisma
          .eventBookingTicket
          .count({
            where: {
              booking: {
                eventId:
                  event.id,
              },

              ticketType,

              status: {
                in: [
                  "PENDING",
                  "CONFIRMED",
                ],
              },
            },
          });

      const remaining =
        Math.max(
          capacity -
            alreadyBooked,
          0,
        );

      if (
        requestedCount >
        remaining
      ) {
        throw new Error(
          `Only ${remaining} ${ticketType} ticket(s) available`,
        );
      }
    };

    await checkCapacity(
      "MEN",
      menTicketCount,
      event.menCapacity,
    );

    await checkCapacity(
      "WOMEN",
      womenTicketCount,
      event.womenCapacity,
    );

    await checkCapacity(
      "OTHER",
      otherTicketCount,
      event.otherCapacity,
    );

    // =====================================
    // TOTAL
    // =====================================

    // YOUR EXISTING CALCULATION:
    //
    // menPrice / womenPrice / otherPrice
    // already contain discounted price
    // when discounted price exists.
    //
    // So ticketAmount is the final
    // discounted ticket subtotal.
    // =====================================

    const ticketAmount =
      menPrice *
        menTicketCount +
      womenPrice *
        womenTicketCount +
      otherPrice *
        otherTicketCount;

    if (ticketAmount <= 0) {
      throw new Error(
        "Invalid event payment amount",
      );
    }

    // =====================================
    // ✅ NEW CHANGE
    // ORIGINAL TICKET AMOUNT
    // =====================================

    const originalTicketAmount =
      Number(
        event.menEntryPrice ??
          0,
      ) *
        menTicketCount +
      Number(
        event.womenEntryPrice ??
          0,
      ) *
        womenTicketCount +
      Number(
        event.otherEntryPrice ??
          0,
      ) *
        otherTicketCount;

    // =====================================
    // ✅ NEW CHANGE
    // DISCOUNT AMOUNT
    // =====================================

    const discountAmount =
      roundAmount(
        Math.max(
          0,

          originalTicketAmount -
            ticketAmount,
        ),
      );

    // =====================================
    // ✅ NEW CHANGE
    // PLATFORM FEE
    // =====================================
    //
    // Global platform fee is treated
    // as PER BOOKING.
    //
    // Example:
    // eventPlatformFee = 49
    // 1 ticket = ₹49
    // 3 tickets = ₹49
    // =====================================

    const platformFee =
      roundAmount(
        eventPlatformFee,
      );

    // =====================================
    // ✅ NEW CHANGE
    // TAXABLE AMOUNT
    // =====================================
    //
    // Discounted ticket amount
    // + platform fee
    // =====================================

    const taxableAmount =
      roundAmount(
        ticketAmount +
          platformFee,
      );

    // =====================================
    // ✅ NEW CHANGE
    // GST AMOUNT
    // =====================================

    const gstAmount =
      roundAmount(
        (taxableAmount *
          gstPercentage) /
          100,
      );

    // =====================================
    // ✅ NEW CHANGE
    // FINAL TOTAL
    // =====================================

    const totalAmount =
      roundAmount(
        taxableAmount +
          gstAmount,
      );

    console.log(
      "========== EVENT BOOKING AMOUNT ==========",
    );

    console.log({
      originalTicketAmount:
        roundAmount(
          originalTicketAmount,
        ),

      discountedTicketAmount:
        roundAmount(
          ticketAmount,
        ),

      discountAmount,

      platformFee,

      gstPercentage,

      taxableAmount,

      gstAmount,

      totalAmount,
    });

    // =====================================
    // BOOKING NUMBER
    // =====================================
    // EXISTING LOGIC - UNCHANGED
    // =====================================

    const bookingNumber =
      `EVT_${Date.now()}_${randomUUID()
        .replace(
          /-/g,
          "",
        )
        .slice(
          0,
          8,
        )}`;

    // =====================================
    // CREATE BOOKING
    // =====================================

    const booking =
      await prisma
        .eventBooking
        .create({
          data: {
            userId,

            eventId:
              event.id,

            bookingNumber,

            ticketCount,

            // Existing ticketAmount
            // keeps discounted subtotal
            ticketAmount:
              roundAmount(
                ticketAmount,
              ),

            // ✅ NEW CHANGE
            discountAmount,

            // ✅ NEW CHANGE
            platformFee,

            // ✅ NEW CHANGE
            gstAmount,

            // ✅ CHANGED
            // Previously:
            // totalAmount: ticketAmount
            //
            // Now:
            // discounted ticket subtotal
            // + platform fee
            // + GST
            totalAmount,

            paidAmount: 0,

            status:
              EventBookingStatus
                .PAYMENT_PENDING,

            // =================================
            // EXISTING TICKET CREATE LOGIC
            // UNCHANGED
            // =================================

            tickets: {
              create: [
                ...Array.from(
                  {
                    length:
                      menTicketCount,
                  },
                  () => ({
                    ticketId:
                      `TKT_${Date.now()}_${randomUUID()
                        .replace(
                          /-/g,
                          "",
                        )
                        .slice(
                          0,
                          8,
                        )}`,

                    ticketType:
                      "MEN" as const,

                    ticketAmount:
                      menPrice,

                    status:
                      "PENDING" as const,
                  }),
                ),

                ...Array.from(
                  {
                    length:
                      womenTicketCount,
                  },
                  () => ({
                    ticketId:
                      `TKT_${Date.now()}_${randomUUID()
                        .replace(
                          /-/g,
                          "",
                        )
                        .slice(
                          0,
                          8,
                        )}`,

                    ticketType:
                      "WOMEN" as const,

                    ticketAmount:
                      womenPrice,

                    status:
                      "PENDING" as const,
                  }),
                ),

                ...Array.from(
                  {
                    length:
                      otherTicketCount,
                  },
                  () => ({
                    ticketId:
                      `TKT_${Date.now()}_${randomUUID()
                        .replace(
                          /-/g,
                          "",
                        )
                        .slice(
                          0,
                          8,
                        )}`,

                    ticketType:
                      "OTHER" as const,

                    ticketAmount:
                      otherPrice,

                    status:
                      "PENDING" as const,
                  }),
                ),
              ],
            },
          },

          include: {
            tickets: true,
          },
        });

    // =====================================
    // ✅ CHANGED
    // =====================================
    //
    // Previously:
    //
    // amount: ticketAmount
    //
    // Now final total goes to Razorpay.
    // =====================================

    return {
      booking,

      amount:
        totalAmount,
    };
  };

// ============================================
// CREATE PAYMENT ORDER
// ============================================
// EXISTING LOGIC - UNCHANGED
// ============================================

export const createPaymentOrderService =
  async (
    userId: string,
    data: CreatePaymentsOrderDTO,
  ) => {
    if (!userId) {
      throw new Error(
        "User ID is required",
      );
    }

    let amount = 0;

    let referenceId:
      | string
      | undefined =
      data.referenceId;

    let eventBooking:
      | any
      | null = null;

    // =========================================
    // EVENT BOOKING
    // =========================================

    if (
      data.purpose ===
      PaymentPurpose.EVENT_BOOKING
    ) {
      const eventResult =
        await createEventBookingForPayment(
          userId,
          data,
        );

      // This now receives final total:
      // ticket + platform fee + GST
      amount =
        eventResult.amount;

      eventBooking =
        eventResult.booking;

      // VERY IMPORTANT
      referenceId =
        eventResult.booking.id;
    } else {
      amount =
        Number(
          data.amount,
        );

      if (
        !Number.isFinite(
          amount,
        ) ||
        amount <= 0
      ) {
        throw new Error(
          "Invalid payment amount",
        );
      }
    }

    const amountInPaise =
      convertToPaise(
        amount,
      );

    if (
      amountInPaise <= 0
    ) {
      throw new Error(
        "Invalid payment amount",
      );
    }

    const receipt =
      `receipt_${Date.now()}_${userId.slice(
        0,
        8,
      )}`;

    // =========================================
    // RAZORPAY ORDER
    // =========================================

    const razorpayOrder =
      await razorpay.orders.create({
        amount:
          amountInPaise,

        currency:
          data.currency ||
          "INR",

        receipt,

        notes: {
          userId,

          purpose:
            data.purpose,

          referenceId:
            referenceId || "",

          eventBookingId:
            eventBooking?.id ||
            "",

          eventId:
            data.eventId ||
            "",

          packagePriceId:
            data.packagePriceId ||
            "",
        },
      });

    // =========================================
    // PAYMENT
    // =========================================

    const payment =
      await prisma.payment.create({
        data: {
          userId,

          amount,

          currency:
            data.currency ||
            "INR",

          // While pending:
          // payment_id = Razorpay order id
          payment_id:
            razorpayOrder.id,

          status:
            PaymentStatus.PENDING,

          purpose:
            data.purpose,

          // EVENT_BOOKING:
          // referenceId = booking.id
          referenceId,

          packagePriceId:
            data.packagePriceId,

          gatewayResponse:
            razorpayOrder as any,
        },
      });

    return {
      paymentId:
        payment.id,

      razorpayOrderId:
        razorpayOrder.id,

      razorpayKeyId:
        process.env
          .RAZORPAY_KEY_ID,

      amount:
        razorpayOrder.amount,

      amountInRupees:
        convertFromPaise(
          Number(
            razorpayOrder.amount,
          ),
        ),

      currency:
        razorpayOrder.currency,

      status:
        razorpayOrder.status,

      eventBooking:
        eventBooking
          ? {
              id:
                eventBooking.id,

              bookingNumber:
                eventBooking
                  .bookingNumber,

              ticketCount:
                eventBooking
                  .ticketCount,

              // ✅ NEW RESPONSE FIELDS
              ticketAmount:
                Number(
                  eventBooking
                    .ticketAmount,
                ),

              discountAmount:
                Number(
                  eventBooking
                    .discountAmount,
                ),

              platformFee:
                Number(
                  eventBooking
                    .platformFee,
                ),

              gstAmount:
                Number(
                  eventBooking
                    .gstAmount,
                ),

              totalAmount:
                Number(
                  eventBooking
                    .totalAmount,
                ),

              status:
                eventBooking
                  .status,

              tickets:
                eventBooking
                  .tickets,
            }
          : null,
    };
  };

// ============================================
// VERIFY PAYMENT
// ============================================
// EXISTING LOGIC - UNCHANGED
// ============================================

export const verifyPaymentService =
  async (
    userId: string,
    data: VerifyPaymentsDTO,
  ) => {
    if (!userId) {
      throw new Error(
        "User ID is required",
      );
    }

    // =========================================
    // 1. FIND PAYMENT
    // =========================================

    const payment =
      await prisma.payment.findFirst({
        where: {
          userId,

          OR: [
            {
              payment_id:
                data.razorpay_order_id,
            },

            {
              transactionId:
                data.razorpay_order_id,
            },
          ],
        },
      });

    if (!payment) {
      throw new Error(
        "Payment order not found",
      );
    }

    console.log(
      "========== VERIFY PAYMENT ==========",
    );

    console.log(
      "Payment DB ID:",
      payment.id,
    );

    console.log(
      "Payment status:",
      payment.status,
    );

    console.log(
      "Payment purpose:",
      payment.purpose,
    );

    console.log(
      "Payment referenceId:",
      payment.referenceId,
    );

    // =========================================
    // 2. IDEMPOTENCY
    // =========================================

    if (
      payment.status ===
      PaymentStatus.COMPLETED
    ) {
      return {
        success: true,

        message:
          "Payment already verified",

        payment,

        eventBooking: null,
      };
    }

    // =========================================
    // 3. GET SERVER-SIDE ORDER ID
    // =========================================

    const storedOrderId =
      payment.transactionId ||
      payment.payment_id;

    if (!storedOrderId) {
      throw new Error(
        "Razorpay order ID not found",
      );
    }

    console.log(
      "Stored Order ID:",
      storedOrderId,
    );

    console.log(
      "Received Order ID:",
      data.razorpay_order_id,
    );

    console.log(
      "Received Payment ID:",
      data.razorpay_payment_id,
    );

    // =========================================
    // 4. ORDER ID CHECK
    // =========================================

    if (
      storedOrderId !==
      data.razorpay_order_id
    ) {
      throw new Error(
        "Razorpay order ID mismatch",
      );
    }

    // =========================================
    // 5. VERIFY SIGNATURE
    // =========================================

    const isValid =
      verifyRazorpaySignature(
        storedOrderId,
        data.razorpay_payment_id,
        data.razorpay_signature,
      );

    console.log(
      "Signature valid:",
      isValid,
    );

    if (!isValid) {
      throw new Error(
        "Invalid Razorpay payment signature",
      );
    }

    // =========================================
    // 6. COMPLETE PAYMENT + FULFIL
    // =========================================

    const result =
      await prisma.$transaction(
        async (tx) => {
          // =====================================
          // RE-FETCH INSIDE TRANSACTION
          // =====================================

          const currentPayment =
            await tx.payment.findUnique({
              where: {
                id: payment.id,
              },
            });

          if (!currentPayment) {
            throw new Error(
              "Payment not found",
            );
          }

          // =====================================
          // IDEMPOTENCY INSIDE TRANSACTION
          // =====================================

          if (
            currentPayment.status ===
            PaymentStatus.COMPLETED
          ) {
            return {
              payment:
                currentPayment,

              eventBooking:
                null,

              alreadyProcessed:
                true,
            };
          }

          // =====================================
          // UPDATE PAYMENT
          // =====================================

          const updatedPayment =
            await tx.payment.update({
              where: {
                id:
                  currentPayment.id,
              },

              data: {
                // Razorpay payment ID
                payment_id:
                  data.razorpay_payment_id,

                // Razorpay order ID
                transactionId:
                  storedOrderId,

                status:
                  PaymentStatus.COMPLETED,

                paidAt:
                  new Date(),

                gatewayResponse: {
                  razorpay_order_id:
                    storedOrderId,

                  razorpay_payment_id:
                    data.razorpay_payment_id,

                  razorpay_signature:
                    data.razorpay_signature,
                },
              },
            });

          console.log(
            "Payment completed:",
            updatedPayment.id,
          );

          let eventBooking =
            null;

          // =====================================
          // EVENT BOOKING
          // =====================================

          if (
            updatedPayment.purpose ===
            PaymentPurpose.EVENT_BOOKING
          ) {
            if (
              !updatedPayment.referenceId
            ) {
              throw new Error(
                "Event booking referenceId missing",
              );
            }

            console.log(
              "Confirming Event Booking:",
              updatedPayment.referenceId,
            );

            eventBooking =
              await confirmsEventBooking(
                tx,
                updatedPayment,
              );

            console.log(
              "Event Booking confirmed:",
              eventBooking.id,
            );
          }

          return {
            payment:
              updatedPayment,

            eventBooking,

            alreadyProcessed:
              false,
          };
        },
        {
          maxWait: 10000,

          timeout: 30000,

          isolationLevel:
            "Serializable",
        },
      );

    // =========================================
    // 7. RESPONSE
    // =========================================

    return {
      success: true,

      message:
        result.alreadyProcessed
          ? "Payment already verified"
          : "Payment verified successfully",

      payment:
        result.payment,

      eventBooking:
        result.eventBooking,
    };
  };

// ============================================
// RAZORPAY WEBHOOK
// ============================================
// EXISTING LOGIC - UNCHANGED
// ============================================

export const handleRazorpayWebhookService =
  async (
    rawBody:
      | string
      | Buffer,

    signature:
      string,
  ) => {
    const isValid =
      verifyRazorpayWebhookSignature(
        rawBody,
        signature,
      );

    if (!isValid) {
      throw new Error(
        "Invalid Razorpay webhook signature",
      );
    }

    const webhook =
      JSON.parse(
        Buffer.isBuffer(
          rawBody,
        )
          ? rawBody.toString(
              "utf8",
            )
          : rawBody,
      ) as RazorpayWebhookPayload;

    switch (
      webhook.event
    ) {
      // ========================================
      // PAYMENT CAPTURED
      // ========================================

      case "payment.captured": {
        const paymentEntity =
          webhook.payload
            .payment
            ?.entity;

        if (
          !paymentEntity
        ) {
          return {
            success: true,
          };
        }

        const payment =
          await prisma.payment.findFirst({
            where: {
              OR: [
                {
                  payment_id:
                    paymentEntity
                      .order_id,
                },

                {
                  transactionId:
                    paymentEntity
                      .order_id,
                },
              ],
            },
          });

        if (!payment) {
          console.warn(
            "Payment not found for Razorpay order:",
            paymentEntity
              .order_id,
          );

          return {
            success:
              true,
          };
        }

        if (
          payment.status ===
          PaymentStatus.COMPLETED
        ) {
          return {
            success:
              true,

            alreadyProcessed:
              true,
          };
        }

        await prisma.$transaction(
          async (tx) => {
            const currentPayment =
              await tx.payment
                .findUnique({
                  where: {
                    id:
                      payment.id,
                  },
                });

            if (
              !currentPayment
            ) {
              throw new Error(
                "Payment not found",
              );
            }

            if (
              currentPayment
                .status ===
              PaymentStatus
                .COMPLETED
            ) {
              return;
            }

            const updatedPayment =
              await tx.payment.update({
                where: {
                  id:
                    payment.id,
                },

                data: {
                  payment_id:
                    paymentEntity
                      .id,

                  transactionId:
                    paymentEntity
                      .order_id,

                  status:
                    PaymentStatus
                      .COMPLETED,

                  paidAt:
                    new Date(),

                  gatewayResponse:
                    JSON.parse(
                      JSON.stringify(
                        webhook,
                      ),
                    ),
                },
              });

            // ===============================
            // EVENT BOOKING
            // ===============================

            if (
              updatedPayment
                .purpose ===
              PaymentPurpose
                .EVENT_BOOKING
            ) {
              await confirmsEventBooking(
                tx,
                updatedPayment,
              );
            }
          },

          {
            maxWait:
              10000,

            timeout:
              30000,

            isolationLevel:
              "Serializable",
          },
        );

        break;
      }

      // ========================================
      // PAYMENT FAILED
      // ========================================

      case "payment.failed": {
        const paymentEntity =
          webhook.payload
            .payment
            ?.entity;

        if (
          !paymentEntity
        ) {
          return;
        }

        const payment =
          await prisma.payment.findFirst({
            where: {
              OR: [
                {
                  payment_id:
                    paymentEntity
                      .order_id,
                },

                {
                  transactionId:
                    paymentEntity
                      .order_id,
                },
              ],
            },
          });

        if (!payment) {
          return;
        }

        if (
          payment.status ===
          PaymentStatus.COMPLETED
        ) {
          return;
        }

        await prisma.payment.update({
          where: {
            id:
              payment.id,
          },

          data: {
            status:
              PaymentStatus.FAILED,

            gatewayResponse:
              JSON.parse(
                JSON.stringify(
                  webhook,
                ),
              ),
          },
        });

        break;
      }

      case "order.paid": {
        console.log(
          "Razorpay order paid:",

          webhook.payload
            .order
            ?.entity.id,
        );

        break;
      }

      default: {
        console.log(
          "Unhandled Razorpay event:",
          webhook.event,
        );
      }
    }

    return {
      success: true,
    };
  };