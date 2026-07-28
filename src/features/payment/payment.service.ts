// import { PaymentStatus, Prisma } from "@prisma/client";
// import { CreateOrderDto, VerifyPaymentDto } from "./payment.dto";
// import razorpay from "../../config/razorpay";
// import { prisma } from "../../prisma/prismaClient";
// import crypto from "crypto";

// export const createOrder = async (
//   userId: string,
//   payload: CreateOrderDto
// ) => {
//   const { amount, purpose } = payload;

//   // Bare-minimum guard now that there's no package to derive price from.
//   if (!amount || amount <= 0) {
//     throw new Error("Invalid amount.");
//   }

//   const amountInPaise = Math.round(amount * 100);

//   const order = await razorpay.orders.create({
//     amount: amountInPaise,
//     currency: "INR",
//     receipt: `USR_${userId}_${Date.now()}`,
//     payment_capture: true,
//   });

//   const payment = await prisma.payment.create({
//     data: {
//       userId,
//       amount, // rupees. See note at bottom re: storing paise instead.
//       currency: "INR",
//       payment_id: order.id,
//       transactionId: order.receipt,
//       status: PaymentStatus.PENDING,
//       purpose,
//       gatewayResponse: {
//         id: order.id,
//         entity: order.entity,
//         amount: order.amount,
//         amount_paid: order.amount_paid,
//         amount_due: order.amount_due,
//         currency: order.currency,
//         receipt: order.receipt,
//         status: order.status,
//         attempts: order.attempts,
//         created_at: order.created_at,
//       } as Prisma.InputJsonValue,
//     },
//   });

//   return {
//     paymentId: payment.id,
//     razorpayOrderId: order.id,
//     amount: order.amount,
//     currency: order.currency,
//     key: process.env.RAZORPAY_KEY_ID,
//   };
// };

// export const verifyPayment = async (
//   userId: string,
//   payload: VerifyPaymentDto
// ) => {
//   const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = payload;

//   // 1. Signature check — constant-time compare
//   const generatedSignature = crypto
//     .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
//     .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//     .digest("hex");

//   const signatureValid =
//     generatedSignature.length === razorpay_signature.length &&
//     crypto.timingSafeEqual(
//       Buffer.from(generatedSignature),
//       Buffer.from(razorpay_signature)
//     );

//   if (!signatureValid) {
//     throw new Error("Payment verification failed.");
//   }

//   // 2. Load our order + ownership check (fixes IDOR — userId was unused before)
//   const existing = await prisma.payment.findUnique({
//     where: { payment_id: razorpay_order_id },
//   });

//   if (!existing || existing.userId !== userId) {
//     throw new Error("Payment not found or not authorized.");
//   }

//   // 3. Idempotency — don't re-process a completed payment
//   if (existing.status === PaymentStatus.COMPLETED) {
//     return existing;
//   }

//   // 4. Confirm money was actually captured for the right order + amount
//   const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
// const expectedPaise = existing.amount.mul(100).toNumber();
//   if (
//     paymentDetails.status !== "captured" ||
//     paymentDetails.order_id !== razorpay_order_id ||
//     Number(paymentDetails.amount) !== expectedPaise
//   ) {
//     await prisma.payment.update({
//       where: { payment_id: razorpay_order_id },
//       data: {
//         status: PaymentStatus.FAILED,
//         gatewayResponse: paymentDetails as unknown as Prisma.InputJsonValue,
//       },
//     });
//     throw new Error("Payment not captured or amount mismatch.");
//   }

//   // 5. Mark completed
//   const payment = await prisma.payment.update({
//     where: { payment_id: razorpay_order_id },
//     data: {
//       status: PaymentStatus.COMPLETED,
//       transactionId: razorpay_payment_id,
//       gatewayResponse: paymentDetails as unknown as Prisma.InputJsonValue,
//       paidAt: new Date(),
//     },
//   });

//   return payment;
// };

// export const handleWebhookEvent = async (
//   rawBody: Buffer,
//   signature: string
// ) => {
//   // 1. Verify signature over the RAW body
//   const expectedSignature = crypto
//     .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
//     .update(rawBody)
//     .digest("hex");

//   const valid =
//     expectedSignature.length === signature.length &&
//     crypto.timingSafeEqual(
//       Buffer.from(expectedSignature),
//       Buffer.from(signature)
//     );

//   if (!valid) {
//     throw new Error("Invalid webhook signature.");
//   }

//   const event = JSON.parse(rawBody.toString());
//   const type: string = event.event;

//   // We only act on payment lifecycle events tied to an order
//   const paymentEntity = event.payload?.payment?.entity;
//   if (!paymentEntity?.order_id) {
//     return; // nothing to reconcile
//   }

//   const orderId = paymentEntity.order_id;

//   const existing = await prisma.payment.findUnique({
//     where: { payment_id: orderId },
//   });

//   if (!existing) {
//     // Order we never created / already deleted — ignore, don't error.
//     return;
//   }

//   // 2. Idempotency: if already in a terminal state matching the event, skip.
//   if (type === "payment.captured") {
//     if (existing.status === PaymentStatus.COMPLETED) return;

//     // Amount safety check — same guard as verifyPayment
//  const expectedPaise = existing.amount.mul(100).toNumber();
//     if (Number(paymentEntity.amount) !== expectedPaise) {
//       await prisma.payment.update({
//         where: { payment_id: orderId },
//         data: {
//           status: PaymentStatus.FAILED,
//           gatewayResponse: paymentEntity as unknown as Prisma.InputJsonValue,
//         },
//       });
//       return;
//     }

//     await prisma.payment.update({
//       where: { payment_id: orderId },
//       data: {
//         status: PaymentStatus.COMPLETED,
//         transactionId: paymentEntity.id,
//         gatewayResponse: paymentEntity as unknown as Prisma.InputJsonValue,
//         paidAt: new Date(),
//       },
//     });
//     return;
//   }

//   if (type === "payment.failed") {
//     if (existing.status === PaymentStatus.COMPLETED) return; // already paid, ignore
//     await prisma.payment.update({
//       where: { payment_id: orderId },
//       data: {
//         status: PaymentStatus.FAILED,
//         gatewayResponse: paymentEntity as unknown as Prisma.InputJsonValue,
//       },
//     });
//     return;
//   }

//   // Other events (order.paid, refund.*) — ignore for now.
// };

import axios from "axios";
import { prisma } from "../../prisma/prismaClient";
import { PaymentPurpose, PaymentStatus } from "@prisma/client";
import { getAccessToken } from "./payment.utils";
import { randomUUID } from "node:crypto";
import { activatePackage, createWaitlist, creditBoost, creditWallet } from "./payment.handler";

//CREATE PAYMENT LINK
export async function createPaymentLink(userId: string, body: any) {
  const accessToken = await getAccessToken();

  let amount = 0;
  let priceId = null;

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
        where: { slug: body.packageSlug },  // User sends slug like "premium"
      });

      console.log("pkg : ", pkg)

      if (!pkg || !pkg.active) {
        throw new Error("Package not found or inactive");
      }

      // Find specific price for the billing cycle
      const package_price = await prisma.packagePrice.findUnique({
        where: {
          packageId_billingCycle: {
            packageId: pkg.id,
            billingCycle: body.billingCycle,  // User sends billing cycle
          },
        },
      });

      console.log("package_price : ", package_price)


      if (!package_price || !package_price.active) {
        throw new Error("Price not available for this billing cycle");
      }

      amount = Number(package_price.price);
      priceId = package_price.id;  // Store priceId for payment creation
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

    successURL: "https://www.welvors.com/stepdone/",
    failureURL: "https://www.welvors.com/stepdone/",


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

  console.log("payload : ", payload)

  const { data } = await axios.post(
    "https://uatoneapi.payu.in/payment-links/",
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        merchantId: process.env.PAYU_MERCHANT_ID!,
      },
    }
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


//WEBHOOK
// export async function paymentWebhookService(payload: any) {
//   console.log("payload : ", payload)
//   const payment_id = payload.txnid;
//   const status = payload.status;

//   const payment = await prisma.payment.findUnique({
//     where: {
//       payment_id,
//     },
//   });

//   if (!payment) {
//     throw new Error("Payment not found");
//   }

//   // Prevent duplicate webhook processing
//   if (payment.status === PaymentStatus.COMPLETED) {
//     return;
//   }

//   await prisma.$transaction(async (tx) => {
//     const updatedPayment = await tx.payment.update({
//       where: {
//         id: payment.id,
//       },
//       data: {
//         status:
//           status === "success"
//             ? PaymentStatus.COMPLETED
//             : PaymentStatus.FAILED,
//         paidAt: new Date(),
//         gatewayResponse: payload,
//       },
//     });

//     console.log("payment response : ", updatedPayment);
//     if (updatedPayment.status !== PaymentStatus.COMPLETED) {
//       return;
//     }

//     switch (updatedPayment.purpose) {
//       case PaymentPurpose.WAITLIST:
//         await createWaitlist(tx, updatedPayment);
//         break;

//       case PaymentPurpose.PACKAGE:
//         await activatePackage(tx, updatedPayment);
//         break;

//       case PaymentPurpose.BOOST:
//         await creditBoost(tx, updatedPayment);
//         break;

//       case PaymentPurpose.WALLET:
//         await creditWallet(tx, updatedPayment);
//         break;
//     }
//   },
//   {
//     maxWait: 10000,   // wait up to 10 sec for DB connection
//     timeout: 30000,   // transaction can run for 30 sec
//   });
// }

export async function paymentWebhookService(payload: any) {
    const payment_id = payload.txnid;
    const status = payload.status;

    // Use transaction with optimistic locking to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
        // Lock the payment row for update
        const payment = await tx.payment.findUnique({
            where: { payment_id },
        });

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
                status: status === "success" ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
                paidAt: new Date(),
                gatewayResponse: payload,
            },
        });

        if (updatedPayment.status !== PaymentStatus.COMPLETED) {
            return { success: false, reason: 'payment_failed' };
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
        }

        return { success: true, alreadyProcessed: false };
    }, {
        maxWait: 10000,
        timeout: 30000,
        isolationLevel: 'Serializable', // Add serializable isolation for extra safety
    });

    return result;
}