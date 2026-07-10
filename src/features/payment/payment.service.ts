// // src/modules/payment/payment.service.ts

// import { PrismaClient, PaymentStatus } from '@prisma/client';
// import Razorpay from 'razorpay';
// import crypto from 'crypto';
// import { CreateOrderDto, RazorpayOrderResponse, WebhookPayload } from './payment.types';

// const prisma = new PrismaClient();

// export class PaymentService {
//   private razorpay: Razorpay;

//   constructor() {
//     this.razorpay = new Razorpay({
//       key_id: process.env.RAZORPAY_KEY_ID!,
//       key_secret: process.env.RAZORPAY_KEY_SECRET!,
//     });
//   }

//   // Create Razorpay Order
//   async createOrder(paymentData: CreateOrderDto): Promise<{ order: RazorpayOrderResponse; paymentId: string }> {
//     try {
//       const { userId, packageId, amount, currency = 'INR', purpose, receipt, notes } = paymentData;

//       // Create payment record in database
//       const payment = await prisma.payment.create({
//         data: {
//           userId,
//           packageId: packageId || null,
//           amount: amount,
//           currency,
//           status: PaymentStatus.PENDING,
//           purpose: purpose,
//         },
//       });

//       // Create Razorpay order
//       const orderOptions = {
//         amount: Math.round(amount * 100), // Convert to paise and ensure integer
//         currency: currency,
//         receipt: receipt || `receipt_${payment.id}`,
//         notes: {
//           ...notes,
//           paymentId: payment.id,
//           userId: userId,
//         },
//       };

//       const order = await this.razorpay.orders.create(orderOptions);

//       // Update payment with order ID
//       await prisma.payment.update({
//         where: { id: payment.id },
//         data: {
//           transactionId: order.id,
//           gatewayResponse: order as any,
//         },
//       });

//       return {
//         order: order as RazorpayOrderResponse,
//         paymentId: payment.id,
//       };
//     } catch (error) {
//       console.error('Error creating order:', error);
//       throw new Error('Failed to create payment order');
//     }
//   }

//   // Verify Payment Signature
//   verifyPaymentSignature(paymentResponse: {
//     razorpay_payment_id: string;
//     razorpay_order_id: string;
//     razorpay_signature: string;
//   }): boolean {
//     try {
//       const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = paymentResponse;
      
//       const body = razorpay_order_id + '|' + razorpay_payment_id;
//       const expectedSignature = crypto
//         .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
//         .update(body)
//         .digest('hex');

//       return expectedSignature === razorpay_signature;
//     } catch (error) {
//       console.error('Error verifying signature:', error);
//       return false;
//     }
//   }

//   // Process Successful Payment
//   async processSuccessfulPayment(paymentId: string, razorpayPaymentId: string) {
//     try {
//       // Update payment status
//       const payment = await prisma.payment.update({
//         where: { id: paymentId },
//         data: {
//           status: PaymentStatus.COMPLETED,
//           payment_id: razorpayPaymentId,
//           paidAt: new Date(),
//         },
//         include: {
//           Waitlist: true,
//         },
//       });

//       // Handle business logic based on purpose
//       await this.handlePaymentSuccess(payment);

//       return payment;
//     } catch (error) {
//       console.error('Error processing successful payment:', error);
//       throw error;
//     }
//   }

//   // Handle Payment Success Business Logic
//   private async handlePaymentSuccess(payment: any) {
//     try {
//       switch (payment.purpose) {
//         case 'PACKAGE_PURCHASE':
//           await this.handlePackagePurchase(payment);
//           break;
//         case 'WAITLIST':
//           await this.handleWaitlistPayment(payment);
//           break;
//         case 'SUBSCRIPTION':
//           await this.handleSubscriptionPayment(payment);
//           break;
//         default:
//           console.log('No specific handling for this payment purpose');
//       }
//     } catch (error) {
//       console.error('Error in payment success handler:', error);
//       throw error;
//     }
//   }

//   private async handlePackagePurchase(payment: any) {
//     // Implement package purchase logic
//     console.log(`Processing package purchase for payment ${payment.id}`);
//     // Example: Update user's subscription, assign package, etc.
//   }

//   private async handleWaitlistPayment(payment: any) {
//     // Implement waitlist payment logic
//     console.log(`Processing waitlist payment for payment ${payment.id}`);
//   }

//   private async handleSubscriptionPayment(payment: any) {
//     // Implement subscription payment logic
//     console.log(`Processing subscription payment for payment ${payment.id}`);
//   }

//   // Process Failed Payment
//   async processFailedPayment(paymentId: string, errorDetails?: any) {
//     try {
//       const payment = await prisma.payment.findUnique({
//         where: { id: paymentId },
//       });

//       if (!payment) {
//         throw new Error('Payment not found');
//       }

//       const updatedPayment = await prisma.payment.update({
//         where: { id: paymentId },
//         data: {
//           status: PaymentStatus.FAILED,
//           gatewayResponse: errorDetails ? { ...(payment.gatewayResponse as any), error: errorDetails } : undefined,
//         },
//       });

//       return updatedPayment;
//     } catch (error) {
//       console.error('Error processing failed payment:', error);
//       throw error;
//     }
//   }

//   // Get Payment Status
//   async getPaymentStatus(paymentId: string) {
//     try {
//       const payment = await prisma.payment.findUnique({
//         where: { id: paymentId },
//         include: {
//           Waitlist: true,
//         },
//       });

//       if (!payment) {
//         throw new Error('Payment not found');
//       }

//       return payment;
//     } catch (error) {
//       console.error('Error getting payment status:', error);
//       throw error;
//     }
//   }

//   // Get User Payments
//   async getUserPayments(userId: string) {
//     try {
//       const payments = await prisma.payment.findMany({
//         where: { userId },
//         orderBy: { created_at: 'desc' },
//       });

//       return payments;
//     } catch (error) {
//       console.error('Error getting user payments:', error);
//       throw error;
//     }
//   }

//   // Refund Payment
//   async refundPayment(paymentId: string, amount?: number) {
//     try {
//       const payment = await prisma.payment.findUnique({
//         where: { id: paymentId },
//       });

//       if (!payment || !payment.payment_id) {
//         throw new Error('Payment not found or no payment ID available');
//       }

//       if (payment.status !== PaymentStatus.COMPLETED) {
//         throw new Error('Only completed payments can be refunded');
//       }

//       // Process refund with Razorpay
//       const refundOptions: any = {
//         payment_id: payment.payment_id,
//         notes: {
//           paymentId: payment.id,
//           userId: payment.userId,
//         },
//       };

//       if (amount) {
//         refundOptions.amount = Math.round(amount * 100); // Convert to paise
//       }

//       const refund = await this.razorpay.payments.refund(payment.payment_id, refundOptions);

//       // Update payment status
//       const updatedPayment = await prisma.payment.update({
//         where: { id: paymentId },
//         data: {
//           status: PaymentStatus.REFUNDED,
//           gatewayResponse: {
//             ...(payment.gatewayResponse as any),
//             refund: refund,
//           },
//         },
//       });

//       return updatedPayment;
//     } catch (error) {
//       console.error('Error processing refund:', error);
//       throw error;
//     }
//   }

//   // Fetch order details from Razorpay
//   async fetchOrder(orderId: string) {
//     try {
//       const order = await this.razorpay.orders.fetch(orderId);
//       return order;
//     } catch (error) {
//       console.error('Error fetching order:', error);
//       throw error;
//     }
//   }

//   // Fetch payment details from Razorpay
//   async fetchPayment(paymentId: string) {
//     try {
//       const payment = await this.razorpay.payments.fetch(paymentId);
//       return payment;
//     } catch (error) {
//       console.error('Error fetching payment:', error);
//       throw error;
//     }
//   }
// }