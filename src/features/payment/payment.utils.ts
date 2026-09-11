// import axios from "axios";

// const PAYU_OAUTH = "https://uat-accounts.payu.in/oauth/token";

// export async function getAccessToken() {
//   const body = new URLSearchParams({
//     grant_type: "client_credentials",
//     client_id: process.env.PAYU_CLIENT_ID!,
//     client_secret: process.env.PAYU_CLIENT_SECRET!,
//     scope: "create_payment_links",
//   });

//   const { data } = await axios.post(PAYU_OAUTH, body.toString(), {
//     headers: {
//       "Content-Type": "application/x-www-form-urlencoded",
//     },
//   });

//   return data.access_token;
// }



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