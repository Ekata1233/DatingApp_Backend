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
  const secret =
    process.env.RAZORPAY_KEY_SECRET;

  if (!secret) {
    throw new Error(
      "RAZORPAY_KEY_SECRET is missing",
    );
  }

  const payload =
    `${orderId}|${paymentId}`;

  const generatedSignature =
    crypto
      .createHmac(
        "sha256",
        secret,
      )
      .update(payload)
      .digest("hex");

  console.log(
    "========== RAZORPAY SIGNATURE DEBUG ==========",
  );

  console.log(
    "PAYLOAD:",
    payload,
  );

  console.log(
    "SECRET EXISTS:",
    !!secret,
  );

  console.log(
    "SECRET LENGTH:",
    secret.length,
  );

  console.log(
    "RECEIVED SIGNATURE:",
    signature,
  );

  console.log(
    "GENERATED SIGNATURE:",
    generatedSignature,
  );

  if (
    generatedSignature.length !==
    signature.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(
      generatedSignature,
      "hex",
    ),
    Buffer.from(
      signature,
      "hex",
    ),
  );
};

export const verifyRazorpayWebhookSignature = (
  rawBody: string | Buffer,
  signature: string,
): boolean => {
  const secret =
    process.env
      .RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error(
      "RAZORPAY_WEBHOOK_SECRET is missing",
    );
  }

  const expectedSignature =
    crypto
      .createHmac(
        "sha256",
        secret,
      )
      .update(rawBody)
      .digest("hex");

  if (
    expectedSignature.length !==
    signature.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(
      expectedSignature,
      "hex",
    ),
    Buffer.from(
      signature,
      "hex",
    ),
  );
};