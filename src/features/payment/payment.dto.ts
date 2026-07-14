import { PaymentPurpose } from "@prisma/client";

export interface CreateOrderDto {
  amount: number;
  purpose: PaymentPurpose;
  packageId?: string;
}

export interface VerifyPaymentDto {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}