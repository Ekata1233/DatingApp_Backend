import {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  IncomeProofType,
  VerificationStatus,
} from "@prisma/client";

import {
  getIncomeVerificationDetailsService,
  getIncomeVerificationsService,
  getMyIncomeVerificationService,
  reviewIncomeVerificationService,
  submitIncomeVerificationService,
} from "./income.service";

import {
  IncomeFiles,
} from "./income.type";

import {
  validateIncomeProofType,
} from "./income.validation";

// ======================================================
// USER - SUBMIT
// ======================================================

export const submitIncomeVerificationController =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId =
        (req as any)
          .user?.id;

      if (!userId) {
        return res
          .status(401)
          .json({
            success:
              false,

            message:
              "Unauthorized",
          });
      }

      const {
        annualIncome,
        currency,
        proofType,
        employerName,
        financialYear,
      } = req.body;

      // ==============================================
      // Proof type compulsory
      // ==============================================

      if (!proofType) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Income proof type is required",
          });
      }

      const validatedProofType =
        validateIncomeProofType(
          proofType
        );

      // ==============================================
      // Files
      // ==============================================

      const rawFiles =
        (req as any)
          .files ||
        {};

      const files:
        IncomeFiles = {
          primaryDocument:
            rawFiles
              .primaryDocument,

          secondaryDocument:
            rawFiles
              .secondaryDocument,
        };

      // ==============================================
      // Primary compulsory
      // ==============================================

      if (
        !files
          .primaryDocument
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Primary income proof document is required",
          });
      }

      // ==============================================
      // Submit
      // ==============================================

      const result =
        await submitIncomeVerificationService(
          userId,

          {
            annualIncome:
              annualIncome !==
                undefined &&
              annualIncome !==
                ""
                ? Number(
                    annualIncome
                  )
                : undefined,

            currency,

            proofType:
              validatedProofType,

            employerName,

            financialYear,
          },

          files
        );

      return res
        .status(201)
        .json({
          success:
            true,

          message:
            "Income verification submitted successfully",

          data:
            result,
        });
    } catch (
      error: any
    ) {
      console.error(
        "Submit Income Verification Error:",
        error
      );

      const errorStatus:
        Record<
          string,
          number
        > = {
          USER_NOT_FOUND:
            404,

          INVALID_INCOME_PROOF_TYPE:
            400,

          INVALID_ANNUAL_INCOME:
            400,

          INVALID_CURRENCY:
            400,

          INVALID_FINANCIAL_YEAR:
            400,

          INCOME_PRIMARY_DOCUMENT_REQUIRED:
            400,

          INCOME_PRIMARY_DOCUMENT_TOO_LARGE:
            400,

          INCOME_SECONDARY_DOCUMENT_TOO_LARGE:
            400,

          INCOME_PRIMARY_DOCUMENT_INVALID_FILE_TYPE:
            400,

          INCOME_SECONDARY_DOCUMENT_INVALID_FILE_TYPE:
            400,

          INCOME_PRIMARY_DOCUMENT_BUFFER_MISSING:
            400,

          INCOME_SECONDARY_DOCUMENT_BUFFER_MISSING:
            400,

          INCOME_ALREADY_VERIFIED:
            409,

          INCOME_VERIFICATION_ALREADY_IN_PROGRESS:
            409,
        };

      if (
        errorStatus[
          error.message
        ]
      ) {
        return res
          .status(
            errorStatus[
              error.message
            ]
          )
          .json({
            success:
              false,

            message:
              error.message,
          });
      }

      next(error);
    }
  };

// ======================================================
// USER - STATUS
// ======================================================

export const getMyIncomeVerificationController =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId =
        (req as any)
          .user?.id;

      if (!userId) {
        return res
          .status(401)
          .json({
            success:
              false,

            message:
              "Unauthorized",
          });
      }

      const result =
        await getMyIncomeVerificationService(
          userId
        );

      if (!result) {
        return res
          .status(200)
          .json({
            success:
              true,

            message:
              "Income verification not submitted",

            data: {
              status:
                VerificationStatus.NOT_STARTED,
            },
          });
      }

      return res
        .status(200)
        .json({
          success:
            true,

          data:
            result,
        });
    } catch (
      error
    ) {
      next(error);
    }
  };

// ======================================================
// ADMIN - LIST
// ======================================================

export const getIncomeVerificationsController =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      let status:
        | VerificationStatus
        | undefined;

      let proofType:
        | IncomeProofType
        | undefined;

      // ==============================================
      // Status filter
      // ==============================================

      if (
        req.query.status
      ) {
        const value =
          req.query
            .status as string;

        if (
          !Object
            .values(
              VerificationStatus
            )
            .includes(
              value as VerificationStatus
            )
        ) {
          return res
            .status(400)
            .json({
              success:
                false,

              message:
                "Invalid verification status",
            });
        }

        status =
          value as VerificationStatus;
      }

      // ==============================================
      // Proof type filter
      // ==============================================

      if (
        req.query
          .proofType
      ) {
        proofType =
          validateIncomeProofType(
            req.query
              .proofType as string
          );
      }

      const result =
        await getIncomeVerificationsService(
          status,
          proofType
        );

      return res
        .status(200)
        .json({
          success:
            true,

          data:
            result,
        });
    } catch (
      error: any
    ) {
      if (
        error.message ===
        "INVALID_INCOME_PROOF_TYPE"
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              error.message,
          });
      }

      next(error);
    }
  };

// ======================================================
// ADMIN - DETAILS
// ======================================================

export const getIncomeVerificationDetailsController =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const incomeId =
        req.params
          .id as string;

      if (!incomeId) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Income verification ID is required",
          });
      }

      const result =
        await getIncomeVerificationDetailsService(
          incomeId
        );

      return res
        .status(200)
        .json({
          success:
            true,

          data:
            result,
        });
    } catch (
      error: any
    ) {
      if (
        error.message ===
        "INCOME_VERIFICATION_NOT_FOUND"
      ) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Income verification not found",
          });
      }

      next(error);
    }
  };

// ======================================================
// ADMIN - REVIEW
// ======================================================

export const reviewIncomeVerificationController =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const incomeId =
        req.params
          .id as string;

      const {
        action,
        rejectionReason,
      } = req.body;

      if (!incomeId) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Income verification ID is required",
          });
      }

      if (
        action !==
          "APPROVE" &&
        action !==
          "REJECT"
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Action must be APPROVE or REJECT",
          });
      }

      if (
        action ===
          "REJECT" &&
        !rejectionReason
          ?.trim()
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Rejection reason is required",
          });
      }

      const result =
        await reviewIncomeVerificationService(
          incomeId,
          action,
          rejectionReason
        );

      return res
        .status(200)
        .json({
          success:
            true,

          message:
            action ===
            "APPROVE"
              ? "Income verification approved successfully"
              : "Income verification rejected successfully",

          data:
            result,
        });
    } catch (
      error: any
    ) {
      console.error(
        "Review Income Verification Error:",
        error
      );

      const errorStatus:
        Record<
          string,
          number
        > = {
          INCOME_VERIFICATION_NOT_FOUND:
            404,

          INCOME_VERIFICATION_ALREADY_REVIEWED:
            409,

          REJECTION_REASON_REQUIRED:
            400,
        };

      if (
        errorStatus[
          error.message
        ]
      ) {
        return res
          .status(
            errorStatus[
              error.message
            ]
          )
          .json({
            success:
              false,

            message:
              error.message,
          });
      }

      next(error);
    }
  };