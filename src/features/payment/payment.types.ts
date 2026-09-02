export interface CreatePaymentOrderInput {
  amount: number;
  currency?: string;
  purpose: string;
  referenceId?: string;
  packagePriceId?: string;
}

export interface VerifyPaymentInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface RazorpayWebhookPayload {
  entity: string;
  event: string;
  payload: {
    payment?: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        currency: string;
        status: string;
        method?: string;
        email?: string;
        contact?: string;
      };
    };

    order?: {
      entity: {
        id: string;
        amount: number;
        amount_paid: number;
        amount_due: number;
        currency: string;
        status: string;
      };
    };
  };
}