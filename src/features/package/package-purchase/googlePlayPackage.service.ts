import { google } from "googleapis";

export const verifyGooglePlayPackage = async (
  productId: string,
  purchaseToken: string,
) => {
  const encoded =
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;

  const packageName =
    process.env.GOOGLE_PLAY_PACKAGE_NAME;

  if (!encoded || !packageName) {
    throw new Error("GOOGLE_PLAY_NOT_CONFIGURED");
  }

  const credentials = JSON.parse(
    Buffer.from(encoded, "base64").toString("utf8"),
  );

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/androidpublisher",
    ],
  });

  const publisher = google.androidpublisher({
    version: "v3",
    auth,
  });

  try {
    const response =
      await publisher.purchases.products.get({
        packageName,
        productId,
        token: purchaseToken,
      });

    const purchase = response.data;

    if (purchase.purchaseState !== 0) {
      throw new Error(
        "GOOGLE_PLAY_PAYMENT_NOT_COMPLETED",
      );
    }

    if (
      purchase.productId &&
      purchase.productId !== productId
    ) {
      throw new Error(
        "GOOGLE_PLAY_PRODUCT_MISMATCH",
      );
    }

    return {
      orderId: purchase.orderId ?? null,
      productId,
      purchaseToken,
      purchaseTimeMillis:
        purchase.purchaseTimeMillis ?? null,
    };
  } catch (error: any) {
    if (
      error.message ===
        "GOOGLE_PLAY_PAYMENT_NOT_COMPLETED" ||
      error.message ===
        "GOOGLE_PLAY_PRODUCT_MISMATCH"
    ) {
      throw error;
    }

    throw new Error(
      "GOOGLE_PLAY_VERIFICATION_FAILED",
    );
  }
};