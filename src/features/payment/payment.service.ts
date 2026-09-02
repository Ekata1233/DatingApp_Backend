// import axios from "axios";
// import { prisma } from "../../prisma/prismaClient";
// import {
//   EventBookingStatus,
//   EventStatus,
//   PaymentPurpose,
//   PaymentStatus,
//   PurchasePaymentMethod,
//   StoreItemType,
// } from "@prisma/client";
// import { getAccessToken } from "./payment.utils";
// import { randomUUID } from "node:crypto";
// import { activatePackage } from "./handlers/package.handler";
// import { creditWallet } from "./handlers/wallet.handler";
// import { creditBoost } from "./handlers/boost.handler";
// import { createWaitlist } from "./handlers/waitlist.handler";
// import { creditRoseHandler } from "../purchaseStore/handlers/creditRose.handler";
// import { creditBoostHandler } from "../purchaseStore/handlers/creditBoost.handler";
// import { creditComplimentHandler } from "../purchaseStore/handlers/creditCompliment.handler";
// import { creditDatePlanHandler } from "../purchaseStore/handlers/creditDatePlan.handler";
// import { confirmEventBooking } from "./handlers/event.handler";

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

//    case PaymentPurpose.EVENT_BOOKING: {
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

//       totalCapacity: true,

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
//   // 3. GET USER TICKET TYPE
//   // ==========================================
//   //
//   // IMPORTANT:
//   // Your request does not send ticketType.
//   // So backend determines it from user's profile.
//   //
//   // Change `gender` below if your UserProfile field
//   // has a different name.
//   // ==========================================

// // ==========================================
// // 3. GET USER GENDER FROM AUTHENTICATED USER
// // ==========================================

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

// if (!user.gender) {
//   throw new Error("User gender is not set");
// }

// // Event ticket type supports only:
// // MEN | WOMEN | OTHER

// let ticketType: "MEN" | "WOMEN" | "OTHER";
// if (!user.gender) {
//   throw new Error("User gender is not set");
// }
// switch (user.gender) {
//   case "MEN":
//     ticketType = "MEN";
//     break;

//   case "WOMEN":
//     ticketType = "WOMEN";
//     break;

//   case "NON_BINARY":
//   case "TRANS_MAN":
//   case "TRANS_WOMAN":
//   case "OTHER":
//   case "PREFER_NOT_TO_SAY":
//     ticketType = "OTHER";
//     break;

//   default:
//     throw new Error("Invalid user gender");
// }

// console.log("========== USER TICKET TYPE ==========");
// console.log("User ID:", user.id);
// console.log("User Gender:", user.gender);
// console.log("Ticket Type:", ticketType);
//   // ==========================================
//   // 4. TICKET COUNT
//   // ==========================================
//   //
//   // Your Postman body doesn't send ticketCount.
//   // Therefore default = 1.
//   // ==========================================

//   const ticketCount = 1;

//   // ==========================================
//   // 5. GET CAPACITY + PRICES
//   // ==========================================

//   let capacity: number | null = null;
//   let entryPrice: number | null = null;
//   let discountedPrice: number | null = null;

//   switch (ticketType) {
//     case "MEN":
//       capacity = event.menCapacity;

//       entryPrice =
//         event.menEntryPrice !== null
//           ? Number(event.menEntryPrice)
//           : null;

//       discountedPrice =
//         event.menDiscountedPrice !== null
//           ? Number(event.menDiscountedPrice)
//           : null;

//       break;

//     case "WOMEN":
//       capacity = event.womenCapacity;

//       entryPrice =
//         event.womenEntryPrice !== null
//           ? Number(event.womenEntryPrice)
//           : null;

//       discountedPrice =
//         event.womenDiscountedPrice !== null
//           ? Number(event.womenDiscountedPrice)
//           : null;

//       break;

//     case "OTHER":
//       capacity = event.otherCapacity;

//       entryPrice =
//         event.otherEntryPrice !== null
//           ? Number(event.otherEntryPrice)
//           : null;

//       discountedPrice =
//         event.otherDiscountedPrice !== null
//           ? Number(event.otherDiscountedPrice)
//           : null;

//       break;
//   }

//   // ==========================================
//   // 6. VALIDATE PRICE
//   // ==========================================

//   if (entryPrice === null) {
//     throw new Error(
//       `${ticketType} ticket entry price is not available`,
//     );
//   }

//   // Use discounted price when available.
//   // Otherwise use normal entry price.
//   const ticketPrice =
//     discountedPrice !== null
//       ? discountedPrice
//       : entryPrice;

//   // ==========================================
//   // 7. VALIDATE CAPACITY
//   // ==========================================

//   if (capacity === null || capacity <= 0) {
//     throw new Error(
//       `${ticketType} ticket capacity is not available`,
//     );
//   }

//   // ==========================================
//   // 8. CHECK CONFIRMED BOOKINGS
//   // ==========================================
//   //
//   // IMPORTANT:
//   // Only CONFIRMED bookings reduce available capacity.
//   //
//   // Sum ticketCount, don't count booking rows.
//   // ==========================================

//   const confirmedBookings =
//     await prisma.eventBooking.aggregate({
//       where: {
//         eventId: event.id,
//         ticketType,
//         status: EventBookingStatus.CONFIRMED,
//       },

//       _sum: {
//         ticketCount: true,
//       },
//     });

//   const bookedTickets =
//     confirmedBookings._sum.ticketCount ?? 0;

//   const remainingCapacity = Math.max(
//     capacity - bookedTickets,
//     0,
//   );

//   console.log("========== CAPACITY CHECK ==========");
//   console.log("Ticket Type:", ticketType);
//   console.log("Capacity:", capacity);
//   console.log("Confirmed Booked Tickets:", bookedTickets);
//   console.log("Remaining Capacity:", remainingCapacity);

//   if (ticketCount > remainingCapacity) {
//     throw new Error(
//       `Only ${remainingCapacity} ${ticketType} ticket(s) available`,
//     );
//   }

//   // ==========================================
//   // 9. PRICE CALCULATION
//   // ==========================================

//   const ticketAmount = ticketPrice;

//   const totalAmount =
//     ticketAmount * ticketCount;

//   console.log("========== PRICE CALCULATION ==========");
//   console.log("Entry Price:", entryPrice);
//   console.log("Discounted Price:", discountedPrice);
//   console.log("Final Ticket Price:", ticketPrice);
//   console.log("Ticket Count:", ticketCount);
//   console.log("Total Amount:", totalAmount);

//   // ==========================================
//   // 10. FIND EXISTING PENDING BOOKING
//   // ==========================================

//   let booking =
//     await prisma.eventBooking.findFirst({
//       where: {
//         eventId: event.id,
//         userId,

//         ticketType,

//         status: {
//           in: [
//             EventBookingStatus.PENDING,
//             EventBookingStatus.PAYMENT_PENDING,
//           ],
//         },
//       },

//       orderBy: {
//         createdAt: "desc",
//       },
//     });

//   // ==========================================
//   // 11. CREATE BOOKING
//   // ==========================================

//   if (!booking) {
//     const bookingNumber =
//       `EVT_${Date.now()}_${randomUUID()
//         .replace(/-/g, "")
//         .slice(0, 8)}`;

//     // const ticketId =
//     //   `TKT_${Date.now()}_${randomUUID()
//     //     .replace(/-/g, "")
//     //     .slice(0, 8)}`;

//     booking =
//       await prisma.eventBooking.create({
//         data: {
//           userId,
//           eventId: event.id,

//           bookingNumber,
//           // ticketId,

//           ticketType,
//           ticketCount,

//           // Final price actually charged
//           ticketAmount,

//           totalAmount,

//           paidAmount: 0,

//           status: EventBookingStatus.PENDING,
//         },
//       });

//     console.log(
//       "EVENT BOOKING CREATED:",
//       booking.id,
//     );
//   }

//   // ==========================================
//   // 12. GET REMAINING PAYMENT
//   // ==========================================

//   const remainingAmount =
//     Number(booking.totalAmount) -
//     Number(booking.paidAmount);

//   if (remainingAmount <= 0) {
//     throw new Error(
//       "Event booking is already fully paid",
//     );
//   }

//   amount = remainingAmount;

//   console.log(
//     "Final Payment Amount:",
//     amount,
//   );

//   break;
// }
//     default:
//       throw new Error("Invalid payment purpose");
//   }

//   // Fetch authenticated user details
//  const user = await prisma.user.findUnique({
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
import {
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
} from "./payment.utils";

import type {
  CreatePaymentOrderDTO,
  VerifyPaymentDTO,
} from "./payment.validation";

import type {
  RazorpayWebhookPayload,
} from "./payment.types";
import { prisma } from "../../prisma/prismaClient";
import { Prisma } from "@prisma/client";

const convertToPaise = (amount: number): number => {
  return Math.round(amount * 100);
};

const convertFromPaise = (amount: number): number => {
  return amount / 100;
};

export const createPaymentOrderService = async (
  userId: string,
  data: CreatePaymentOrderDTO,
) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const amount = Number(data.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid payment amount");
  }

  const amountInPaise = convertToPaise(amount);

  if (amountInPaise <= 0) {
    throw new Error("Invalid payment amount");
  }

  const receipt = `receipt_${Date.now()}_${userId.slice(0, 8)}`;

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: data.currency || "INR",
    receipt,
    notes: {
      userId,
      purpose: data.purpose,
      referenceId: data.referenceId || "",
      packagePriceId: data.packagePriceId || "",
    },
  });

  const payment = await prisma.payment.create({
    data: {
      userId,

      amount,

      currency: data.currency || "INR",

      payment_id: razorpayOrder.id,

      status: "PENDING",

      purpose: data.purpose as any,

      referenceId: data.referenceId,

      packagePriceId: data.packagePriceId,

      gatewayResponse: razorpayOrder as any,
    },
  });

  return {
    paymentId: payment.id,
    razorpayOrderId: razorpayOrder.id,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    amount: razorpayOrder.amount,
    amountInRupees: convertFromPaise(Number(razorpayOrder.amount)),
    currency: razorpayOrder.currency,
    status: razorpayOrder.status,
  };
};

export const verifyPaymentService = async (
  userId: string,
  data: VerifyPaymentDTO,
) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  /**
   * Get payment using the order ID created by our backend.
   */
  const payment = await prisma.payment.findFirst({
    where: {
      userId,
      payment_id: data.razorpay_order_id,
    },
  });

  if (!payment) {
    throw new Error("Payment order not found");
  }

  /**
   * Idempotency protection
   */
  if (payment.status === "COMPLETED") {
    return {
      success: true,
      message: "Payment already verified",
      payment,
    };
  }

  /**
   * Verify Razorpay signature
   */
  const isValid = verifyRazorpaySignature(
    payment.payment_id!,
    data.razorpay_payment_id,
    data.razorpay_signature,
  );

  if (!isValid) {
    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: "FAILED",
        gatewayResponse: {
          error: "Invalid Razorpay signature",
        },
      },
    });

    throw new Error("Invalid Razorpay payment signature");
  }

  /**
   * Update payment
   */
  const updatedPayment = await prisma.payment.update({
    where: {
      id: payment.id,
    },
    data: {
      payment_id: data.razorpay_payment_id,

      transactionId: data.razorpay_order_id,

      status: "COMPLETED",

      paidAt: new Date(),

      gatewayResponse: {
        razorpay_order_id: data.razorpay_order_id,
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_signature: data.razorpay_signature,
      },
    },
  });

  /**
   * IMPORTANT:
   *
   * Fulfil the purchase here.
   *
   * Example:
   *
   * await activatePackage(...)
   * await addBoost(...)
   * await addSuperLikes(...)
   */

  return {
    success: true,
    message: "Payment verified successfully",
    payment: updatedPayment,
  };
};

export const handleRazorpayWebhookService = async (
  rawBody: string,
  signature: string,
) => {
  const isValid = verifyRazorpayWebhookSignature(
    rawBody,
    signature,
  );

  if (!isValid) {
    throw new Error("Invalid Razorpay webhook signature");
  }

  const webhook =
    JSON.parse(rawBody) as RazorpayWebhookPayload;

  switch (webhook.event) {
    case "payment.captured": {
      const paymentEntity =
        webhook.payload.payment?.entity;

      if (!paymentEntity) {
        return;
      }

      const payment = await prisma.payment.findFirst({
        where: {
          payment_id: paymentEntity.order_id,
        },
      });

      if (!payment) {
        console.warn(
          "Payment not found for Razorpay order:",
          paymentEntity.order_id,
        );

        return;
      }

      /**
       * Idempotency
       */
      if (payment.status === "COMPLETED") {
        return;
      }

      await prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          payment_id: paymentEntity.id,
          transactionId: paymentEntity.order_id,
          status: "COMPLETED",
          paidAt: new Date(),
          gatewayResponse: JSON.parse(JSON.stringify(webhook)),
        },
      });

      /**
       * Fulfil purchase
       *
       * Example:
       *
       * await activatePackage(payment);
       */

      break;
    }

    case "payment.failed": {
      const paymentEntity =
        webhook.payload.payment?.entity;

      if (!paymentEntity) {
        return;
      }

      const payment = await prisma.payment.findFirst({
        where: {
          payment_id: paymentEntity.order_id,
        },
      });

      if (!payment) {
        return;
      }

      if (payment.status === "COMPLETED") {
        return;
      }

      await prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          payment_id: paymentEntity.id,
          status: "FAILED",
          gatewayResponse: JSON.parse(JSON.stringify(webhook)),
        },
      });

      break;
    }

    case "order.paid": {
      console.log(
        "Razorpay order paid:",
        webhook.payload.order?.entity.id,
      );

      break;
    }

    default:
      console.log(
        "Unhandled Razorpay event:",
        webhook.event,
      );
  }
};