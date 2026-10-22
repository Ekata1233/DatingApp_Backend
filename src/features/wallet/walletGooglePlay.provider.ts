
import { google } from "googleapis";

const getAndroidPublisher = () => {
  const base64 =
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;

  const packageName =
    process.env.GOOGLE_PLAY_PACKAGE_NAME;

  if (!base64 || !packageName) {
    throw new Error(
      "Google Play billing is not configured"
    );
  }

  const credentials = JSON.parse(
    Buffer.from(base64, "base64").toString("utf8")
  );

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/androidpublisher",
    ],
  });

  return {
    publisher: google.androidpublisher({
      version: "v3",
      auth,
    }),
    packageName,
  };
};

export const verifyWalletGooglePurchase = async (
  productId: string,
  purchaseToken: string,
  orderId: string
) => {
  const { publisher, packageName } =
    getAndroidPublisher();

  const response =
    await publisher.purchases.products.get({
      packageName,
      productId,
      token: purchaseToken,
    });

  const purchase = response.data;

  console.log("%%%%%%%%%%%%%%%%%% google play purchase data : ", purchase);
  console.log("*******************product id : ", productId)

  if (purchase.purchaseState !== 0) {
    throw new Error(
      "Google Play purchase is not completed"
    );
  }

  if (purchase.productId !== productId) {
    throw new Error("Google Play product mismatch");
  }

  if (!purchase.orderId || purchase.orderId !== orderId) {
    throw new Error("Google Play order mismatch");
  }

  if (purchase.consumptionState === 1) {
    throw new Error("Purchase already consumed");
  }

  if (purchase.quantity && purchase.quantity !== 1) {
    throw new Error("Unsupported purchase quantity");
  }

  return {
    orderId: purchase.orderId,
    productId,
    purchaseTime: purchase.purchaseTimeMillis,
  };
};

export const consumeWalletGooglePurchase = async (
  productId: string,
  purchaseToken: string
) => {
  const { publisher, packageName } =
    getAndroidPublisher();

  await publisher.purchases.products.consume({
    packageName,
    productId,
    token: purchaseToken,
  });
};
