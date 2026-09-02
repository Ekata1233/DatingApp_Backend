import crypto from "crypto";

export const verifyRazorpaySignature = (
  orderId: string,
  paymentId: string,
  signature: string,
): boolean => {
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret) {
    throw new Error("RAZORPAY_KEY_SECRET is missing");
  }

  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return generatedSignature === signature;
};

export const verifyRazorpayWebhookSignature = (
  rawBody: string | Buffer,
  signature: string,
): boolean => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET is missing");
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return expectedSignature === signature;
};