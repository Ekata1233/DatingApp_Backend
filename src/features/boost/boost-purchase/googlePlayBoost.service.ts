import { google } from "googleapis";

const getPublisher = async () => {
  const encoded =
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;

  if (!encoded) {
    throw new Error("GOOGLE_PLAY_NOT_CONFIGURED");
  }

  const credentials = JSON.parse(
    Buffer.from(encoded, "base64").toString("utf8")
  );

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/androidpublisher",
    ],
  });

  return google.androidpublisher({
    version: "v3",
    auth,
  });
};

export const verifyGooglePlayBoostPurchase = async (
  productId: string,
  purchaseToken: string
) => {
  const publisher = await getPublisher();

  const packageName =
    process.env.GOOGLE_PLAY_PACKAGE_NAME;

  if (!packageName) {
    throw new Error("GOOGLE_PLAY_NOT_CONFIGURED");
  }

  const response =
    await publisher.purchases.products.get({
      packageName,
      productId,
      token: purchaseToken,
    });

  const purchase = response.data;

  if (purchase.purchaseState !== 0) {
    throw new Error("GOOGLE_PLAY_PAYMENT_NOT_COMPLETED");
  }

  if (
    purchase.productId &&
    purchase.productId !== productId
  ) {
    throw new Error("GOOGLE_PLAY_PRODUCT_MISMATCH");
  }

  if (purchase.consumptionState === 1) {
    throw new Error("GOOGLE_PLAY_ALREADY_CONSUMED");
  }

  if ((purchase.quantity ?? 1) !== 1) {
    throw new Error("UNSUPPORTED_PURCHASE_QUANTITY");
  }

  return {
    orderId: purchase.orderId,
    productId,
    purchaseToken,
    verified: true,
  };
};

export const consumeGooglePlayBoostPurchase = async (
  productId: string,
  purchaseToken: string
) => {
  const publisher = await getPublisher();

  await publisher.purchases.products.consume({
    packageName:
      process.env.GOOGLE_PLAY_PACKAGE_NAME!,
    productId,
    token: purchaseToken,
  });
};