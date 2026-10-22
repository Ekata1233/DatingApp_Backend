import {
  PaymentPurpose,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import { createHash } from "crypto";

import {
  VerifyPurchaseInput,
} from "./purchaseVerification.schema";

import {
  verifyGooglePurchase,
  verifyApplePurchase,
} from "./purchaseVerification.provider";
import { prisma } from "../../../prisma/prismaClient";

const getTokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const verifyPurchaseService = async (
  userId: string,
  data: VerifyPurchaseInput,
) => {
  // ==========================================
  // 1. VALIDATE PACKAGE PRICE
  // ==========================================

  const packagePrice = await prisma.packagePrice.findUnique({
    where: {
      id: data.priceId,
    },
    include: {
      package: true,
    },
  });

  if (!packagePrice) {
    throw new Error("Package price not found");
  }

  if (!packagePrice.active || !packagePrice.package.active) {
    throw new Error("Selected package is inactive");
  }

  if (packagePrice.billingCycle === "LIFETIME") {
    throw new Error(
      "Lifetime purchases require a separate non-consumable verification flow",
    );
  }

  // ==========================================
  // 2. VALIDATE STORE PRODUCT MAPPING
  // ==========================================

  const platform =
    data.platform === "android" ? "ANDROID" : "IOS";

  const storeProduct = await prisma.inAppProduct.findUnique({
    where: {
      platform_productId: {
        platform,
        productId: data.productId,
      },
    },
  });

  if (
    !storeProduct ||
    !storeProduct.active ||
    storeProduct.priceId !== data.priceId
  ) {
    throw new Error(
      "Product ID does not match the selected package price",
    );
  }

  // ==========================================
  // 3. VERIFY PURCHASE WITH STORE
  // ==========================================

  const verified =
    data.platform === "android"
      ? await verifyGooglePurchase(
          data.purchaseToken,
          data.productId,
        )
      : await verifyApplePurchase(
          data.transactionId,
          data.productId,
        );

  // ==========================================
  // 4. PREPARE STORE IDENTIFIERS
  // ==========================================

  const tokenHash =
    data.platform === "android"
      ? getTokenHash(data.purchaseToken)
      : null;

  const originalTransactionId =
    verified.originalTransactionId ?? null;

  // ==========================================
  // 5. SAVE ATOMICALLY
  // ==========================================

  return prisma.$transaction(
    async (tx) => {
      // Check Android purchase-token ownership.
      const byToken = tokenHash
        ? await tx.inAppPurchase.findUnique({
            where: {
              purchaseTokenHash: tokenHash,
            },
          })
        : null;

      // Check Apple subscription-chain ownership.
      const byOriginal =
        originalTransactionId
          ? await tx.inAppPurchase.findFirst({
              where: {
                platform: "IOS",
                originalTransactionId,
              },
            })
          : null;

      // Check individual store transaction.
      const byTransaction =
        await tx.inAppPurchase.findUnique({
          where: {
            platform_transactionId: {
              platform,
              transactionId: verified.transactionId,
            },
          },
        });

      const existing =
        byToken ?? byOriginal ?? byTransaction;

      // Never transfer a verified purchase to
      // a different Welvors user.
      for (const record of [
        byToken,
        byOriginal,
        byTransaction,
      ]) {
        if (record && record.userId !== userId) {
          throw new Error(
            "This purchase belongs to another account",
          );
        }

        if (
          record &&
          existing &&
          record.id !== existing.id
        ) {
          throw new Error(
            "Conflicting store purchase records detected",
          );
        }
      }

      if (
        existing &&
        (existing.priceId !== data.priceId ||
          existing.productId !== data.productId ||
          existing.platform !== platform)
      ) {
        throw new Error(
          "Existing purchase does not match the selected product",
        );
      }

      // ==========================================
      // 6. CREATE OR UPDATE PAYMENT
      // ==========================================

      const payment = existing
        ? await tx.payment.update({
            where: {
              id: existing.paymentId,
            },
            data: {
              transactionId: verified.transactionId,
              status: PaymentStatus.COMPLETED,
              gatewayResponse:
                verified.rawResponse as Prisma.InputJsonValue,
              paidAt: verified.purchaseDate,
            },
          })
        : await tx.payment.create({
            data: {
              userId,
              amount: packagePrice.price,
              currency: "INR",
              transactionId: verified.transactionId,
              status: PaymentStatus.COMPLETED,
              purpose: PaymentPurpose.PURCHASE_STORE,
              packagePriceId: data.priceId,
              gatewayResponse:
                verified.rawResponse as Prisma.InputJsonValue,
              paidAt: verified.purchaseDate,
            },
          });

      // ==========================================
      // 7. CREATE OR UPDATE USER PACKAGE
      // ==========================================

      let userPackage;

      if (existing?.userPackageId) {
        userPackage = await tx.userPackage.update({
          where: {
            id: existing.userPackageId,
          },
          data: {
            endDate: verified.expiryDate,
            autoRenew: verified.autoRenew,
            status: "ACTIVE",
          },
        });
      } else {
        userPackage = await tx.userPackage.create({
          data: {
            user_id: userId,
            packageId: packagePrice.packageId,
            priceId: packagePrice.id,
            purchasePrice: packagePrice.price,
            startDate: verified.purchaseDate,
            endDate: verified.expiryDate,
            autoRenew: verified.autoRenew,
            status: "ACTIVE",
            paymentId: payment.id,
          },
        });
      }

      // ==========================================
      // 8. CREATE OR UPDATE STORE PURCHASE
      // ==========================================

      const storeData = {
        userPackageId: userPackage.id,
        transactionId: verified.transactionId,
        originalTransactionId,
        storeStatus: verified.storeStatus,
        environment: verified.environment,
        purchaseDate: verified.purchaseDate,
        expiryDate: verified.expiryDate,
        autoRenew: verified.autoRenew,
        rawResponse:
          verified.rawResponse as Prisma.InputJsonValue,
        verifiedAt: new Date(),
      };

      if (existing) {
        await tx.inAppPurchase.update({
          where: {
            id: existing.id,
          },
          data: storeData,
        });
      } else {
        await tx.inAppPurchase.create({
          data: {
            userId,
            paymentId: payment.id,
            platform,
            productId: data.productId,
            priceId: data.priceId,
            purchaseTokenHash: tokenHash,
            ...storeData,
          },
        });
      }

      // ==========================================
      // 9. RETURN RESPONSE
      // ==========================================

      return {
        membership: {
          id: userPackage.id,
          name: packagePrice.package.name,
          status: "ACTIVE",
          isActive: true,
          startDate: userPackage.startDate,
          endDate: userPackage.endDate,
          autoRenew: verified.autoRenew,
        },
        payment: {
          id: payment.id,
          status: payment.status,
          purpose: payment.purpose,
        },
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000,
    },
  );
};