// // src/modules/payment/payment.types.ts

// export enum PaymentStatus {
//   PENDING = 'PENDING',
//   PROCESSING = 'PROCESSING',
//   COMPLETED = 'COMPLETED',
//   FAILED = 'FAILED',
//   REFUNDED = 'REFUNDED',
//   CANCELLED = 'CANCELLED'
// }

// export enum PaymentPurpose {
//   PACKAGE_PURCHASE = 'PACKAGE_PURCHASE',
//   SUBSCRIPTION = 'SUBSCRIPTION',
//   WAITLIST = 'WAITLIST',
//   OTHER = 'OTHER'
// }

// export interface CreateOrderDto {
//   userId: string;
//   packageId?: string;
//   amount: number;
//   currency?: string;
//   purpose: PaymentPurpose;
//   receipt?: string;
//   notes?: Record<string, any>;
// }

// export interface RazorpayOrderResponse {
//   id: string;
//   entity: string;
//   amount: number;
//   amount_paid: number;
//   amount_due: number;
//   currency: string;
//   receipt: string;
//   status: string;
//   attempts: number;
//   notes: Record<string, any>;
//   created_at: number;
// }

// export interface RazorpayPaymentResponse {
//   razorpay_payment_id: string;
//   razorpay_order_id: string;
//   razorpay_signature: string;
// }

// export interface WebhookPayload {
//   entity: string;
//   account_id: string;
//   event: string;
//   contains: string[];
//   payload: {
//     payment: {
//       entity: {
//         id: string;
//         entity: string;
//         amount: number;
//         currency: string;
//         status: string;
//         order_id: string;
//         invoice_id: string;
//         international: boolean;
//         method: string;
//         amount_refunded: number;
//         refund_status: string;
//         captured: boolean;
//         description: string;
//         card_id: string;
//         bank: string;
//         wallet: string;
//         vpa: string;
//         email: string;
//         contact: string;
//         notes: Record<string, any>;
//         fee: number;
//         tax: number;
//         error_code: string;
//         error_description: string;
//         error_source: string;
//         error_step: string;
//         error_reason: string;
//         created_at: number;
//       }
//     }
//   };
//   created_at: number;
// }