import {
  PayoutMethodType,
} from "@prisma/client";


import {
  CreatePayoutMethodInput,
  UpdatePayoutMethodInput,
} from "./payout-method.types";

import {
  findPayoutMethodByIdRepository,
  getUserPayoutMethodsRepository,
  updatePayoutMethodRepository,
} from "./payout-method.repository";
import { encryptText } from "../../../utils/encryption";
import { prisma } from "../../../prisma/prismaClient";




// =====================================================
// CREATE PAYOUT METHOD
// =====================================================

export const createPayoutMethodService = async (
  userId: string,
  data: CreatePayoutMethodInput
) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  if (!data.type) {
    throw new Error("Payout method type is required");
  }

  // ===================================================
  // BANK ACCOUNT
  // ===================================================

  if (
    data.type ===
    PayoutMethodType.BANK_ACCOUNT
  ) {
    const {
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
    } = data;

    if (!accountHolderName?.trim()) {
      throw new Error(
        "Account holder name is required"
      );
    }

    if (!accountNumber?.trim()) {
      throw new Error(
        "Account number is required"
      );
    }

    if (!ifscCode?.trim()) {
      throw new Error(
        "IFSC code is required"
      );
    }

    if (!bankName?.trim()) {
      throw new Error(
        "Bank name is required"
      );
    }

    const cleanAccountNumber =
      accountNumber.replace(/\s+/g, "");

    if (!/^\d{6,20}$/.test(cleanAccountNumber)) {
      throw new Error(
        "Invalid account number"
      );
    }

    const cleanIfsc =
      ifscCode.trim().toUpperCase();

    const ifscRegex =
      /^[A-Z]{4}0[A-Z0-9]{6}$/;

    if (!ifscRegex.test(cleanIfsc)) {
      throw new Error(
        "Invalid IFSC code"
      );
    }

    const encryptedAccountNumber =
      encryptText(cleanAccountNumber);

    const accountNumberLast4 =
      cleanAccountNumber.slice(-4);

    const existingBanks =
      await prisma.userPayoutMethod.count({
        where: {
          userId,
          type:
            PayoutMethodType.BANK_ACCOUNT,
          deletedAt: null,
          bankIsActive: true,
        },
      });

    const shouldBePrimary =
      existingBanks === 0;

    return prisma.$transaction(
      async (tx) => {
        if (shouldBePrimary) {
          await tx.userPayoutMethod.updateMany({
            where: {
              userId,
              type:
                PayoutMethodType.BANK_ACCOUNT,
              bankIsPrimary: true,
              deletedAt: null,
            },
            data: {
              bankIsPrimary: false,
            },
          });
        }

        const payoutMethod =
          await tx.userPayoutMethod.create({
            data: {
              userId,
              type:
                PayoutMethodType.BANK_ACCOUNT,

              accountHolderName:
                accountHolderName.trim(),

              accountNumberEncrypted:
                encryptedAccountNumber,

              accountNumberLast4,

              ifscCode: cleanIfsc,

              bankName:
                bankName.trim(),

              bankIsPrimary:
                shouldBePrimary,

              bankIsVerified: false,
              bankIsActive: true,

              // UPI-specific values
              upiId: null,
              upiIsPrimary: false,
              upiIsVerified: false,
              upiIsActive: false,
            },
          });

        return formatPayoutMethod(
          payoutMethod
        );
      }
    );
  }

  // ===================================================
  // UPI
  // ===================================================

  if (
    data.type ===
    PayoutMethodType.UPI
  ) {
    if (!data.upiId?.trim()) {
      throw new Error(
        "UPI ID is required"
      );
    }

    const upiId =
      data.upiId
        .trim()
        .toLowerCase();

    const upiRegex =
      /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

    if (!upiRegex.test(upiId)) {
      throw new Error(
        "Invalid UPI ID"
      );
    }

    const duplicate =
      await prisma.userPayoutMethod.findFirst({
        where: {
          userId,
          type:
            PayoutMethodType.UPI,
          upiId,
          deletedAt: null,
        },
      });

    if (duplicate) {
      throw new Error(
        "UPI ID already exists"
      );
    }

    const existingUpis =
      await prisma.userPayoutMethod.count({
        where: {
          userId,
          type:
            PayoutMethodType.UPI,
          deletedAt: null,
          upiIsActive: true,
        },
      });

    const shouldBePrimary =
      existingUpis === 0;

    const payoutMethod =
      await prisma.userPayoutMethod.create({
        data: {
          userId,
          type:
            PayoutMethodType.UPI,

          upiId,

          upiIsPrimary:
            shouldBePrimary,

          upiIsVerified: false,
          upiIsActive: true,

          // BANK-specific values
          accountHolderName: null,
          accountNumberEncrypted: null,
          accountNumberLast4: null,
          ifscCode: null,
          bankName: null,

          bankIsPrimary: false,
          bankIsVerified: false,
          bankIsActive: false,
        },
      });

    return formatPayoutMethod(
      payoutMethod
    );
  }

  throw new Error(
    "Invalid payout method type"
  );
};


// =====================================================
// GET ALL
// =====================================================

export const getPayoutMethodsService =
  async (userId: string) => {
    if (!userId) {
      throw new Error(
        "User ID is required"
      );
    }

    const methods =
      await getUserPayoutMethodsRepository(
        userId
      );

    const bankAccounts = methods
      .filter(
        (item) =>
          item.type ===
            PayoutMethodType.BANK_ACCOUNT &&
          item.bankIsActive
      )
      .map(formatPayoutMethod);

    const upiIds = methods
      .filter(
        (item) =>
          item.type ===
            PayoutMethodType.UPI &&
          item.upiIsActive
      )
      .map(formatPayoutMethod);

    return {
      bankAccounts,
      upiIds,
    };
  };


// =====================================================
// GET ONE
// =====================================================

export const getPayoutMethodByIdService =
  async (
    userId: string,
    payoutMethodId: string
  ) => {
    const method =
      await findPayoutMethodByIdRepository(
        payoutMethodId,
        userId
      );

    if (!method) {
      throw new Error(
        "Payout method not found"
      );
    }

    return formatPayoutMethod(method);
  };


// =====================================================
// UPDATE
// =====================================================

export const updatePayoutMethodService =
  async (
    userId: string,
    payoutMethodId: string,
    data: UpdatePayoutMethodInput
  ) => {
    const existing =
      await findPayoutMethodByIdRepository(
        payoutMethodId,
        userId
      );

    if (!existing) {
      throw new Error(
        "Payout method not found"
      );
    }

    // ============================================
    // BANK
    // ============================================

    if (
      existing.type ===
      PayoutMethodType.BANK_ACCOUNT
    ) {
      const updateData: any = {};

      if (data.accountHolderName !== undefined) {
        if (!data.accountHolderName.trim()) {
          throw new Error(
            "Account holder name cannot be empty"
          );
        }

        updateData.accountHolderName =
          data.accountHolderName.trim();
      }

      if (data.bankName !== undefined) {
        if (!data.bankName.trim()) {
          throw new Error(
            "Bank name cannot be empty"
          );
        }

        updateData.bankName =
          data.bankName.trim();
      }

      if (data.ifscCode !== undefined) {
        const ifsc =
          data.ifscCode
            .trim()
            .toUpperCase();

        if (
          !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(
            ifsc
          )
        ) {
          throw new Error(
            "Invalid IFSC code"
          );
        }

        updateData.ifscCode = ifsc;

        // Re-verification may be needed
        updateData.bankIsVerified =
          false;
      }

      if (data.accountNumber !== undefined) {
        const accountNumber =
          data.accountNumber.replace(
            /\s+/g,
            ""
          );

        if (
          !/^\d{6,20}$/.test(
            accountNumber
          )
        ) {
          throw new Error(
            "Invalid account number"
          );
        }

        updateData.accountNumberEncrypted =
          encryptText(accountNumber);

        updateData.accountNumberLast4 =
          accountNumber.slice(-4);

        updateData.bankIsVerified =
          false;
      }

      const updated =
        await updatePayoutMethodRepository(
          payoutMethodId,
          updateData
        );

      return formatPayoutMethod(updated);
    }

    // ============================================
    // UPI
    // ============================================

    if (
      existing.type ===
      PayoutMethodType.UPI
    ) {
      if (!data.upiId?.trim()) {
        throw new Error(
          "UPI ID is required"
        );
      }

      const upiId =
        data.upiId
          .trim()
          .toLowerCase();

      const duplicate =
        await prisma.userPayoutMethod.findFirst({
          where: {
            userId,
            type:
              PayoutMethodType.UPI,
            upiId,

            id: {
              not: payoutMethodId,
            },

            deletedAt: null,
          },
        });

      if (duplicate) {
        throw new Error(
          "UPI ID already exists"
        );
      }

      const updated =
        await updatePayoutMethodRepository(
          payoutMethodId,
          {
            upiId,
            upiIsVerified: false,
          }
        );

      return formatPayoutMethod(updated);
    }

    throw new Error(
      "Invalid payout method"
    );
  };


// =====================================================
// SET PRIMARY
// =====================================================

export const setPrimaryPayoutMethodService =
  async (
    userId: string,
    payoutMethodId: string
  ) => {
    const method =
      await findPayoutMethodByIdRepository(
        payoutMethodId,
        userId
      );

    if (!method) {
      throw new Error(
        "Payout method not found"
      );
    }

    return prisma.$transaction(
      async (tx) => {
        if (
          method.type ===
          PayoutMethodType.BANK_ACCOUNT
        ) {
          if (!method.bankIsActive) {
            throw new Error(
              "Bank account is inactive"
            );
          }

          await tx.userPayoutMethod.updateMany({
            where: {
              userId,
              type:
                PayoutMethodType.BANK_ACCOUNT,
              deletedAt: null,
            },
            data: {
              bankIsPrimary: false,
            },
          });

          const updated =
            await tx.userPayoutMethod.update({
              where: {
                id: payoutMethodId,
              },
              data: {
                bankIsPrimary: true,
              },
            });

          return formatPayoutMethod(updated);
        }

        if (
          method.type ===
          PayoutMethodType.UPI
        ) {
          if (!method.upiIsActive) {
            throw new Error(
              "UPI ID is inactive"
            );
          }

          await tx.userPayoutMethod.updateMany({
            where: {
              userId,
              type:
                PayoutMethodType.UPI,
              deletedAt: null,
            },
            data: {
              upiIsPrimary: false,
            },
          });

          const updated =
            await tx.userPayoutMethod.update({
              where: {
                id: payoutMethodId,
              },
              data: {
                upiIsPrimary: true,
              },
            });

          return formatPayoutMethod(updated);
        }

        throw new Error(
          "Invalid payout method"
        );
      }
    );
  };


// =====================================================
// DELETE
// =====================================================

export const deletePayoutMethodService =
  async (
    userId: string,
    payoutMethodId: string
  ) => {
    const method =
      await findPayoutMethodByIdRepository(
        payoutMethodId,
        userId
      );

    if (!method) {
      throw new Error(
        "Payout method not found"
      );
    }

    await prisma.$transaction(
      async (tx) => {
        await tx.userPayoutMethod.update({
          where: {
            id: payoutMethodId,
          },

          data:
            method.type ===
            PayoutMethodType.BANK_ACCOUNT
              ? {
                  bankIsActive: false,
                  bankIsPrimary: false,
                  deletedAt: new Date(),
                }
              : {
                  upiIsActive: false,
                  upiIsPrimary: false,
                  deletedAt: new Date(),
                },
        });

        // ===========================================
        // If deleted bank was primary,
        // make another bank primary
        // ===========================================

        if (
          method.type ===
            PayoutMethodType.BANK_ACCOUNT &&
          method.bankIsPrimary
        ) {
          const nextBank =
            await tx.userPayoutMethod.findFirst({
              where: {
                userId,
                type:
                  PayoutMethodType.BANK_ACCOUNT,
                bankIsActive: true,
                deletedAt: null,
              },
              orderBy: {
                createdAt: "asc",
              },
            });

          if (nextBank) {
            await tx.userPayoutMethod.update({
              where: {
                id: nextBank.id,
              },
              data: {
                bankIsPrimary: true,
              },
            });
          }
        }

        // ===========================================
        // If deleted UPI was primary,
        // make another UPI primary
        // ===========================================

        if (
          method.type ===
            PayoutMethodType.UPI &&
          method.upiIsPrimary
        ) {
          const nextUpi =
            await tx.userPayoutMethod.findFirst({
              where: {
                userId,
                type:
                  PayoutMethodType.UPI,
                upiIsActive: true,
                deletedAt: null,
              },
              orderBy: {
                createdAt: "asc",
              },
            });

          if (nextUpi) {
            await tx.userPayoutMethod.update({
              where: {
                id: nextUpi.id,
              },
              data: {
                upiIsPrimary: true,
              },
            });
          }
        }
      }
    );

    return {
      message:
        "Payout method removed successfully",
    };
  };


// =====================================================
// RESPONSE FORMATTER
// =====================================================

const formatPayoutMethod = (
  method: any
) => {
  if (
    method.type ===
    PayoutMethodType.BANK_ACCOUNT
  ) {
    return {
      id: method.id,
      type: method.type,

      accountHolderName:
        method.accountHolderName,

      bankName:
        method.bankName,

      ifscCode:
        method.ifscCode,

      accountNumberLast4:
        method.accountNumberLast4,

      accountNumberMasked:
        method.accountNumberLast4
          ? `••••${method.accountNumberLast4}`
          : null,

      isPrimary:
        method.bankIsPrimary,

      isVerified:
        method.bankIsVerified,

      isActive:
        method.bankIsActive,

      createdAt:
        method.createdAt,
    };
  }

  return {
    id: method.id,
    type: method.type,

    upiId:
      method.upiId,

    isPrimary:
      method.upiIsPrimary,

    isVerified:
      method.upiIsVerified,

    isActive:
      method.upiIsActive,

    createdAt:
      method.createdAt,
  };
};