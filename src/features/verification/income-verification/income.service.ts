import {
  randomUUID,
} from "crypto";

import {
  IncomeProofType,
  VerificationStatus,
  VerificationType,
} from "@prisma/client";

import {
  prisma,
} from "../../../prisma/prismaClient";

import imagekit from "../../../utils/imagekit";

import {
  recalculateTrustScore,
} from "../trust-score/trust-score.service";

import {
  IncomeFile,
  IncomeFiles,
  IncomeVerificationInput,
} from "./income.type";

import {
  validateAnnualIncome,
  validateCurrency,
  validateFinancialYear,
  validateIncomeFile,
} from "./income.validation";

const INCOME_VERIFICATION_POINTS =
  10;

const REVIEWED_BY =
  "Welvors Admin";

// ======================================================
// UPLOAD INCOME DOCUMENT
// ======================================================

const uploadIncomeDocument =
  async (
    userId: string,
    file: IncomeFile,
    documentType:
      | "primary"
      | "secondary"
  ) => {
    const buffer =
      validateIncomeFile(
        file,
        documentType ===
          "primary"
          ? "PRIMARY"
          : "SECONDARY"
      );

    const originalName =
      file.originalname ||
      file.name ||
      `${documentType}.pdf`;

    const extension =
      originalName
        .split(".")
        .pop()
        ?.toLowerCase() ||
      "pdf";

    const result =
      await imagekit.upload({
        file: buffer,

        fileName:
          `${documentType}-${randomUUID()}.${extension}`,

        folder:
          `/income-verification/${userId}`,

        useUniqueFileName:
          true,

        isPrivateFile:
          true,
      });

    return {
      fileId:
        result.fileId,

      filePath:
        result.filePath,

      url:
        result.url,
    };
  };

// ======================================================
// USER - SUBMIT INCOME VERIFICATION
// ======================================================

export const submitIncomeVerificationService =
  async (
    userId: string,
    input: IncomeVerificationInput,
    files: IncomeFiles
  ) => {
    // ================================================
    // 1. Primary document compulsory
    // ================================================

    const primaryFile =
      files.primaryDocument;

    if (!primaryFile) {
      throw new Error(
        "INCOME_PRIMARY_DOCUMENT_REQUIRED"
      );
    }

    // ================================================
    // 2. Validate values
    // ================================================

    const annualIncome =
      validateAnnualIncome(
        input.annualIncome
      );

    const currency =
      validateCurrency(
        input.currency
      );

    const financialYear =
      validateFinancialYear(
        input.financialYear
      );

    // ================================================
    // 3. User exists
    // ================================================

    const user =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          id: true,
        },
      });

    if (!user) {
      throw new Error(
        "USER_NOT_FOUND"
      );
    }

    // ================================================
    // 4. Existing UserVerification
    // ================================================

    const existingVerification =
      await prisma
        .userVerification
        .findUnique({
          where: {
            userId_type: {
              userId,

              type:
                VerificationType.INCOME_VERIFICATION,
            },
          },

          include: {
            incomeVerification:
              true,
          },
        });

    // ================================================
    // 5. Already verified
    // ================================================

    if (
      existingVerification
        ?.status ===
      VerificationStatus.VERIFIED
    ) {
      throw new Error(
        "INCOME_ALREADY_VERIFIED"
      );
    }

    // ================================================
    // 6. Already under review
    // ================================================

    if (
      existingVerification
        ?.status ===
        VerificationStatus.IN_PROGRESS &&
      existingVerification
        .incomeVerification
    ) {
      throw new Error(
        "INCOME_VERIFICATION_ALREADY_IN_PROGRESS"
      );
    }

    // ================================================
    // 7. Upload primary document
    // ================================================

    const primaryDocument =
      await uploadIncomeDocument(
        userId,
        primaryFile,
        "primary"
      );

    // ================================================
    // 8. Upload optional secondary
    // ================================================

    let secondaryDocument:
      | Awaited<
          ReturnType<
            typeof uploadIncomeDocument
          >
        >
      | null = null;

    if (
      files.secondaryDocument
    ) {
      secondaryDocument =
        await uploadIncomeDocument(
          userId,
          files.secondaryDocument,
          "secondary"
        );
    }

    // ================================================
    // 9. Create/update UserVerification
    // ================================================

    const verification =
      await prisma
        .userVerification
        .upsert({
          where: {
            userId_type: {
              userId,

              type:
                VerificationType.INCOME_VERIFICATION,
            },
          },

          create: {
            userId,

            type:
              VerificationType.INCOME_VERIFICATION,

            provider:
              "MANUAL",

            status:
              VerificationStatus.IN_PROGRESS,

            points: 0,

            maxPoints:
              INCOME_VERIFICATION_POINTS,

            startedAt:
              new Date(),

            verifiedAt:
              null,

            rejectionReason:
              null,
          },

          update: {
            provider:
              "MANUAL",

            status:
              VerificationStatus.IN_PROGRESS,

            points: 0,

            maxPoints:
              INCOME_VERIFICATION_POINTS,

            startedAt:
              new Date(),

            verifiedAt:
              null,

            rejectionReason:
              null,
          },
        });

    // ================================================
    // 10. IncomeVerification
    // ================================================

    const incomeVerification =
      await prisma
        .incomeVerification
        .upsert({
          where: {
            userId,
          },

          create: {
            userId,

            verificationId:
              verification.id,

            annualIncome:
              annualIncome ??
              null,

            currency,

            proofType:
              input.proofType,

            employerName:
              input.employerName
                ?.trim() ||
              null,

            financialYear:
              financialYear ||
              null,

            primaryDocumentUrl:
              primaryDocument.filePath,

            secondaryDocumentUrl:
              secondaryDocument
                ?.filePath ||
              null,

            status:
              VerificationStatus.IN_PROGRESS,
          },

          update: {
            verificationId:
              verification.id,

            annualIncome:
              annualIncome ??
              null,

            currency,

            proofType:
              input.proofType,

            employerName:
              input.employerName
                ?.trim() ||
              null,

            financialYear:
              financialYear ||
              null,

            primaryDocumentUrl:
              primaryDocument.filePath,

            secondaryDocumentUrl:
              secondaryDocument
                ?.filePath ||
              null,

            status:
              VerificationStatus.IN_PROGRESS,

            reviewedBy:
              null,

            reviewedAt:
              null,

            verifiedAt:
              null,

            rejectionReason:
              null,
          },
        });

    // ================================================
    // 11. Response
    // ================================================

    return {
      id:
        incomeVerification.id,

      verificationId:
        incomeVerification.verificationId,

      annualIncome:
        incomeVerification
          .annualIncome,

      currency:
        incomeVerification
          .currency,

      proofType:
        incomeVerification
          .proofType,

      employerName:
        incomeVerification
          .employerName,

      financialYear:
        incomeVerification
          .financialYear,

      status:
        incomeVerification
          .status,

      createdAt:
        incomeVerification
          .createdAt,
    };
  };

// ======================================================
// USER - GET MY INCOME VERIFICATION
// ======================================================

export const getMyIncomeVerificationService =
  async (
    userId: string
  ) => {
    const result =
      await prisma
        .incomeVerification
        .findUnique({
          where: {
            userId,
          },

          select: {
            id: true,

            verificationId:
              true,

            annualIncome:
              true,

            currency:
              true,

            proofType:
              true,

            employerName:
              true,

            financialYear:
              true,

            status:
              true,

            rejectionReason:
              true,

            reviewedBy:
              true,

            reviewedAt:
              true,

            verifiedAt:
              true,

            createdAt:
              true,

            updatedAt:
              true,
          },
        });

    return result;
  };

// ======================================================
// ADMIN - GET ALL INCOME VERIFICATIONS
// ======================================================

export const getIncomeVerificationsService =
  async (
    status?: VerificationStatus,
    proofType?: IncomeProofType
  ) => {
    return prisma
      .incomeVerification
      .findMany({
        where: {
          ...(status
            ? {
                status,
              }
            : {}),

          ...(proofType
            ? {
                proofType,
              }
            : {}),
        },

        select: {
          id: true,

          userId:
            true,

          annualIncome:
            true,

          currency:
            true,

          proofType:
            true,

          employerName:
            true,

          financialYear:
            true,

          status:
            true,

          rejectionReason:
            true,

          reviewedBy:
            true,

          reviewedAt:
            true,

          verifiedAt:
            true,

          createdAt:
            true,

          user: {
            select: {
              id: true,

              full_name:
                true,

              email:
                true,

              phone_number:
                true,
            },
          },
        },

        orderBy: {
          createdAt:
            "desc",
        },
      });
  };

// ======================================================
// ADMIN - GET DETAILS
// ======================================================

export const getIncomeVerificationDetailsService =
  async (
    incomeId: string
  ) => {
    const result =
      await prisma
        .incomeVerification
        .findUnique({
          where: {
            id: incomeId,
          },

          include: {
            user: {
              select: {
                id: true,

                full_name:
                  true,

                email:
                  true,

                phone_number:
                  true,
              },
            },

            verification: {
              select: {
                id: true,

                type: true,

                status:
                  true,

                points:
                  true,

                maxPoints:
                  true,

                provider:
                  true,

                startedAt:
                  true,

                verifiedAt:
                  true,

                rejectionReason:
                  true,
              },
            },
          },
        });

    if (!result) {
      throw new Error(
        "INCOME_VERIFICATION_NOT_FOUND"
      );
    }

    // Same signed-URL pattern currently used
    // by your education verification service.
    const expires =
      Math.floor(
        Date.now() / 1000
      ) +
      15 * 60;

    const primaryDocumentUrl =
      imagekit.url({
        path:
          result
            .primaryDocumentUrl,

        signed:
          true,

        expireSeconds:
          expires,
      });

    const secondaryDocumentUrl =
      result
        .secondaryDocumentUrl
        ? imagekit.url({
            path:
              result
                .secondaryDocumentUrl,

            signed:
              true,

            expireSeconds:
              expires,
          })
        : null;

    return {
      id:
        result.id,

      userId:
        result.userId,

      user:
        result.user,

      annualIncome:
        result.annualIncome,

      currency:
        result.currency,

      proofType:
        result.proofType,

      employerName:
        result.employerName,

      financialYear:
        result.financialYear,

      documents: {
        primaryDocumentUrl,
        secondaryDocumentUrl,
      },

      verification:
        result.verification,

      status:
        result.status,

      reviewedBy:
        result.reviewedBy,

      reviewedAt:
        result.reviewedAt,

      verifiedAt:
        result.verifiedAt,

      rejectionReason:
        result.rejectionReason,

      createdAt:
        result.createdAt,

      updatedAt:
        result.updatedAt,
    };
  };

// ======================================================
// ADMIN - APPROVE / REJECT
// ======================================================

export const reviewIncomeVerificationService =
  async (
    incomeId: string,
    action:
      | "APPROVE"
      | "REJECT",
    rejectionReason?: string
  ) => {
    // ================================================
    // 1. Find verification
    // ================================================

    const income =
      await prisma
        .incomeVerification
        .findUnique({
          where: {
            id: incomeId,
          },

          include: {
            verification:
              true,
          },
        });

    if (!income) {
      throw new Error(
        "INCOME_VERIFICATION_NOT_FOUND"
      );
    }

    // ================================================
    // 2. Prevent duplicate review
    // ================================================

    if (
      income.status ===
      VerificationStatus.VERIFIED
    ) {
      throw new Error(
        "INCOME_VERIFICATION_ALREADY_REVIEWED"
      );
    }

    // ================================================
    // 3. Rejection reason compulsory
    // ================================================

    if (
      action === "REJECT" &&
      !rejectionReason
        ?.trim()
    ) {
      throw new Error(
        "REJECTION_REASON_REQUIRED"
      );
    }

    const approved =
      action ===
      "APPROVE";

    const now =
      new Date();

    // ================================================
    // 4. Transaction
    // ================================================

    return prisma.$transaction(
      async (tx) => {
        // ============================================
        // IncomeVerification
        // ============================================

        const updatedIncome =
          await tx
            .incomeVerification
            .update({
              where: {
                id:
                  incomeId,
              },

              data: {
                status:
                  approved
                    ? VerificationStatus.VERIFIED
                    : VerificationStatus.REJECTED,

                reviewedBy:
                  REVIEWED_BY,

                reviewedAt:
                  now,

                verifiedAt:
                  approved
                    ? now
                    : null,

                rejectionReason:
                  approved
                    ? null
                    : rejectionReason!
                        .trim(),
              },
            });

        // ============================================
        // UserVerification
        // ============================================

        await tx
          .userVerification
          .update({
            where: {
              id:
                income
                  .verificationId,
            },

            data: {
              status:
                approved
                  ? VerificationStatus.VERIFIED
                  : VerificationStatus.REJECTED,

              points:
                approved
                  ? INCOME_VERIFICATION_POINTS
                  : 0,

              verifiedAt:
                approved
                  ? now
                  : null,

              rejectionReason:
                approved
                  ? null
                  : rejectionReason!
                      .trim(),
            },
          });

        // ============================================
        // Recalculate trust score
        // ============================================

        const trustScore =
          await recalculateTrustScore(
            income.userId,
            tx
          );

        // ============================================
        // Response
        // ============================================

        return {
          ...updatedIncome,

          trustScore,
        };
      }
    );
  };