import { google } from "googleapis";
import {
  AppStoreServerAPIClient,
  Environment,
  SignedDataVerifier,
} from "@apple/app-store-server-library";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

export interface VerifiedStorePurchase {
  platform: "ANDROID" | "IOS";
  productId: string;
  transactionId: string;
  originalTransactionId?: string;
  purchaseDate: Date;
  expiryDate: Date;
  autoRenew: boolean;
  storeStatus: string;
  environment: string;
  rawResponse: unknown;
}

// ==========================================
// GOOGLE PLAY
// ==========================================

const googleCredentials = JSON.parse(
  Buffer.from(
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64!,
    "base64",
  ).toString("utf8"),
);

const googleAuth = new google.auth.GoogleAuth({
  credentials: googleCredentials,
  scopes: [
    "https://www.googleapis.com/auth/androidpublisher",
  ],
});

const androidPublisher = google.androidpublisher({
  version: "v3",
  auth: googleAuth,
});

export const verifyGooglePurchase = async (
  purchaseToken: string,
  expectedProductId: string,
): Promise<VerifiedStorePurchase> => {
  const response =
    await androidPublisher.purchases.subscriptionsv2.get({
      packageName: process.env.GOOGLE_PLAY_PACKAGE_NAME!,
      token: purchaseToken,
    });

  const subscription = response.data;

  const lineItem = subscription.lineItems?.find(
    (item) => item.productId === expectedProductId,
  );

  if (!lineItem) {
    throw new Error(
      "Google Play product does not match selected package",
    );
  }

  const state = subscription.subscriptionState;

  // Grant access during grace period and until the
  // paid expiry after cancellation.
  const allowedStates = [
    "SUBSCRIPTION_STATE_ACTIVE",
    "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
    "SUBSCRIPTION_STATE_CANCELED",
  ];

  if (!state || !allowedStates.includes(state)) {
    throw new Error(
      `Google Play subscription is not eligible: ${state}`,
    );
  }

  if (!lineItem.expiryTime) {
    throw new Error("Google Play expiry date missing");
  }

  const expiryDate = new Date(lineItem.expiryTime);

  if (
    Number.isNaN(expiryDate.getTime()) ||
    expiryDate <= new Date()
  ) {
    throw new Error("Google Play subscription expired");
  }

  if (!subscription.startTime) {
    throw new Error("Google Play purchase date missing");
  }

  const purchaseDate = new Date(subscription.startTime);

  if (Number.isNaN(purchaseDate.getTime())) {
    throw new Error("Invalid Google Play purchase date");
  }

  const transactionId =
    lineItem.latestSuccessfulOrderId

  if (!transactionId) {
    throw new Error("Google Play order ID missing");
  }

  return {
    platform: "ANDROID",
    productId: expectedProductId,
    transactionId,
    purchaseDate,
    expiryDate,
    autoRenew:
      lineItem.autoRenewingPlan?.autoRenewEnabled === true,
    storeStatus: state,
    environment: subscription.testPurchase
      ? "TEST"
      : "PRODUCTION",
    rawResponse: subscription,
  };
};

// // ==========================================
// // APPLE APP STORE
// // ==========================================

// const applePrivateKey = Buffer.from(
//   process.env.APPLE_PRIVATE_KEY_BASE64!,
//   "base64",
// ).toString("utf8");

// const appleRootCertificates = readdirSync(
//   process.env.APPLE_ROOT_CA_PATH!,
// )
//   .filter((file) => file.endsWith(".cer"))
//   .map((file) =>
//     readFileSync(
//       join(process.env.APPLE_ROOT_CA_PATH!, file),
//     ),
//   );

// const createAppleClient = (environment: Environment) =>
//   new AppStoreServerAPIClient(
//     applePrivateKey,
//     process.env.APPLE_KEY_ID!,
//     process.env.APPLE_ISSUER_ID!,
//     process.env.APPLE_BUNDLE_ID!,
//     environment,
//   );

// const createAppleVerifier = (environment: Environment) =>
//   new SignedDataVerifier(
//     appleRootCertificates,
//     true,
//     environment,
//     process.env.APPLE_BUNDLE_ID!,
//     environment === Environment.PRODUCTION
//       ? Number(process.env.APPLE_APP_ID)
//       : undefined,
//   );

// export const verifyApplePurchase = async (
//   transactionId: string,
//   expectedProductId: string,
// ): Promise<VerifiedStorePurchase> => {
//   let lastError: unknown;

//   for (const environment of [
//     Environment.PRODUCTION,
//     Environment.SANDBOX,
//   ]) {
//     try {
//       const client = createAppleClient(environment);
//       const verifier = createAppleVerifier(environment);

//       const response =
//         await client.getAllSubscriptionStatuses(transactionId);

//       const transactions = (response.data ?? []).flatMap(
//         (group) => group.lastTransactions ?? [],
//       );

//       // Verify each signed transaction, not merely decode it.
//       for (const item of transactions) {
//         if (!item.signedTransactionInfo) continue;

//         const tx = await verifier.verifyAndDecodeTransaction(
//           item.signedTransactionInfo,
//         );

//         if (tx.productId !== expectedProductId) continue;

//         if (
//           !tx.expiresDate ||
//           !tx.purchaseDate ||
//           !tx.transactionId ||
//           !tx.originalTransactionId
//         ) {
//           continue;
//         }

//         const expiryDate = new Date(tx.expiresDate);
//         const purchaseDate = new Date(tx.purchaseDate);

//         // Apple status 1 = active, 4 = billing grace period.
//         // Status 3 = billing retry without grace entitlement.
//         const eligibleStatus =
//           item.status === 1 || item.status === 4;

//         if (
//           !eligibleStatus ||
//           tx.revocationDate ||
//           expiryDate <= new Date()
//         ) {
//           continue;
//         }

//         let autoRenew = false;

//         if (item.signedRenewalInfo) {
//           const renewal =
//             await verifier.verifyAndDecodeRenewalInfo(
//               item.signedRenewalInfo,
//             );

//           autoRenew = renewal.autoRenewStatus === 1;
//         }

//         return {
//           platform: "IOS",
//           productId: expectedProductId,
//           transactionId: tx.transactionId,
//           originalTransactionId:
//             tx.originalTransactionId,
//           purchaseDate,
//           expiryDate,
//           autoRenew,
//           storeStatus: String(item.status),
//           environment,
//           rawResponse: {
//             transaction: tx,
//             status: item.status,
//           },
//         };
//       }

//       throw new Error(
//         "No eligible Apple subscription for this product",
//       );
//     } catch (error) {
//       lastError = error;

//       // Production-to-sandbox fallback must only occur for
//       // Apple's documented environment mismatch response.
//       // Do not automatically retry all failures in sandbox.
//       if (environment === Environment.PRODUCTION) {
//         const code = (error as any)?.apiError;
//         if (code === 4040010) continue;
//       }

//       break;
//     }
//   }

//   throw lastError instanceof Error
//     ? lastError
//     : new Error("Apple subscription verification failed");
// };


 // ==========================================
 // APPLE APP STORE
 // ==========================================

const getAppleConfig = () => {
  const {
    APPLE_PRIVATE_KEY_BASE64,
    APPLE_ROOT_CA_PATH,
    APPLE_KEY_ID,
    APPLE_ISSUER_ID,
    APPLE_BUNDLE_ID,
    APPLE_APP_ID,
  } = process.env;

  if (
    !APPLE_PRIVATE_KEY_BASE64 ||
    !APPLE_ROOT_CA_PATH ||
    !APPLE_KEY_ID ||
    !APPLE_ISSUER_ID ||
    !APPLE_BUNDLE_ID
  ) {
    throw new Error(
      "Apple App Store purchase verification is not configured"
    );
  }

  const applePrivateKey = Buffer.from(
    APPLE_PRIVATE_KEY_BASE64,
    "base64"
  ).toString("utf8");

  const appleRootCertificates = readdirSync(
    APPLE_ROOT_CA_PATH
  )
    .filter((file) => file.endsWith(".cer"))
    .map((file) =>
      readFileSync(join(APPLE_ROOT_CA_PATH, file))
    );

  if (!appleRootCertificates.length) {
    throw new Error(
      "No Apple root certificates found"
    );
  }

  return {
    applePrivateKey,
    appleRootCertificates,
    keyId: APPLE_KEY_ID,
    issuerId: APPLE_ISSUER_ID,
    bundleId: APPLE_BUNDLE_ID,
    appId: APPLE_APP_ID,
  };
};

const createAppleClient = (
  environment: Environment,
  config: ReturnType<typeof getAppleConfig>
) =>
  new AppStoreServerAPIClient(
    config.applePrivateKey,
    config.keyId,
    config.issuerId,
    config.bundleId,
    environment
  );

const createAppleVerifier = (
  environment: Environment,
  config: ReturnType<typeof getAppleConfig>
) => {
  if (
    environment === Environment.PRODUCTION &&
    (!config.appId ||
      !Number.isFinite(Number(config.appId)) ||
      Number(config.appId) <= 0)
  ) {
    throw new Error(
      "APPLE_APP_ID is required for production verification"
    );
  }

  return new SignedDataVerifier(
    config.appleRootCertificates,
    true,
    environment,
    config.bundleId,
    environment === Environment.PRODUCTION
      ? Number(config.appId)
      : undefined
  );
};

export const verifyApplePurchase = async (
  transactionId: string,
  expectedProductId: string
): Promise<VerifiedStorePurchase> => {
  // Apple credentials are loaded only when
  // an iOS purchase verification is requested.
  const config = getAppleConfig();

  let lastError: unknown;

  for (const environment of [
    Environment.PRODUCTION,
    Environment.SANDBOX,
  ]) {
    try {
      const client = createAppleClient(
        environment,
        config
      );

      const verifier = createAppleVerifier(
        environment,
        config
      );

      const response =
        await client.getAllSubscriptionStatuses(
          transactionId
        );

      const transactions = (
        response.data ?? []
      ).flatMap(
        (group) => group.lastTransactions ?? []
      );

      for (const item of transactions) {
        if (!item.signedTransactionInfo) {
          continue;
        }

        const tx =
          await verifier.verifyAndDecodeTransaction(
            item.signedTransactionInfo
          );

        if (tx.productId !== expectedProductId) {
          continue;
        }

        if (
          !tx.expiresDate ||
          !tx.purchaseDate ||
          !tx.transactionId ||
          !tx.originalTransactionId
        ) {
          continue;
        }

        const expiryDate = new Date(
          tx.expiresDate
        );

        const purchaseDate = new Date(
          tx.purchaseDate
        );

        const eligibleStatus =
          item.status === 1 ||
          item.status === 4;

        if (
          !eligibleStatus ||
          tx.revocationDate ||
          expiryDate <= new Date()
        ) {
          continue;
        }

        let autoRenew = false;

        if (item.signedRenewalInfo) {
          const renewal =
            await verifier.verifyAndDecodeRenewalInfo(
              item.signedRenewalInfo
            );

          autoRenew =
            renewal.autoRenewStatus === 1;
        }

        return {
          platform: "IOS",
          productId: expectedProductId,
          transactionId: tx.transactionId,
          originalTransactionId:
            tx.originalTransactionId,
          purchaseDate,
          expiryDate,
          autoRenew,
          storeStatus: String(item.status),
          environment,
          rawResponse: {
            transaction: tx,
            status: item.status,
          },
        };
      }

      throw new Error(
        "No eligible Apple subscription for this product"
      );
    } catch (error) {
      lastError = error;

      // Retry sandbox only for Apple's documented
      // environment mismatch response.
      if (environment === Environment.PRODUCTION) {
        const code = (error as any)?.apiError;

        if (code === 4040010) {
          continue;
        }
      }

      break;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(
        "Apple subscription verification failed"
      );
};
