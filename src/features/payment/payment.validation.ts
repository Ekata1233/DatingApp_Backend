// // src/modules/payment/payment.validation.ts

// import { z } from 'zod';

// export const createOrderSchema = z.object({
//   userId: z.string().uuid('Invalid user ID'),
//   packageId: z.string().uuid('Invalid package ID').optional(),
//   amount: z.number().positive('Amount must be greater than 0'),
//   currency: z.string().default('INR'),
//   purpose: z.enum(['PACKAGE_PURCHASE', 'SUBSCRIPTION', 'WAITLIST', 'OTHER']),
//   notes: z.record(z.any()).optional(),
// });

// export const verifyPaymentSchema = z.object({
//   razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
//   razorpay_order_id: z.string().min(1, 'Order ID is required'),
//   razorpay_signature: z.string().min(1, 'Signature is required'),
// });

// export const refundPaymentSchema = z.object({
//   amount: z.number().positive('Amount must be greater than 0').optional(),
// });

// export const paymentIdSchema = z.object({
//   paymentId: z.string().uuid('Invalid payment ID'),
// });

// export const userIdSchema = z.object({
//   userId: z.string().uuid('Invalid user ID'),
// });