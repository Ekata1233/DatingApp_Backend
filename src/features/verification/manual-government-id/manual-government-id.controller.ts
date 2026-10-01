import {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  GovernmentIdType,
  VerificationStatus,
} from "@prisma/client";

import {
  getManualGovernmentIdDetailsService,
  getManualGovernmentIdListService,
  getMyManualGovernmentIdService,
  reviewManualGovernmentIdService,
  submitManualGovernmentIdService,
} from "./manual-government-id.service";

import {
  GovernmentIdFiles,
} from "./manual-government-id.types";

import {
  validateGovernmentIdType,
} from "./manual-government-id.validation";

// ======================================================
// USER - SUBMIT
// ======================================================

export const submitManualGovernmentIdController =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId =
        (req as any).user?.id;

      if (!userId) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Unauthorized",
          });
      }

      const {
        documentType,
        documentNumber,
        fullName,
        dateOfBirth,
      } = req.body;

      if (!documentType) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Document type is required",
          });
      }

      if (!documentNumber) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Document number is required",
          });
      }

      if (!fullName?.trim()) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Full name is required",
          });
      }

      const validatedType =
        validateGovernmentIdType(
          documentType
        );

      // Existing upload middleware
      const rawFiles =
        (req as any).files ||
        {};

      const files:
        GovernmentIdFiles = {
          frontPhoto:
            rawFiles.frontPhoto,

          backPhoto:
            rawFiles.backPhoto,
        };

      const result =
        await submitManualGovernmentIdService(
          userId,

          {
            documentType:
              validatedType,

            documentNumber,

            fullName,

            dateOfBirth,
          },

          files
        );

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Government ID submitted successfully for manual verification",

          data: result,
        });
    } catch (error: any) {
      console.error(
        "Submit Manual Government ID Error:",
        error
      );

      const errors:
        Record<
          string,
          number
        > = {
          USER_NOT_FOUND: 404,

          INVALID_GOVERNMENT_ID_TYPE:
            400,

          DOCUMENT_NUMBER_REQUIRED:
            400,

          FULL_NAME_REQUIRED:
            400,

          INVALID_AADHAAR_NUMBER:
            400,

          INVALID_PAN_NUMBER:
            400,

          INVALID_DRIVING_LICENSE_NUMBER:
            400,

          INVALID_DATE_OF_BIRTH:
            400,

          GOVERNMENT_ID_FRONT_PHOTO_REQUIRED:
            400,

          GOVERNMENT_ID_BACK_PHOTO_REQUIRED:
            400,

          GOVERNMENT_ID_FRONT_FILE_TOO_LARGE:
            400,

          GOVERNMENT_ID_BACK_FILE_TOO_LARGE:
            400,

          GOVERNMENT_ID_FRONT_INVALID_FILE_TYPE:
            400,

          GOVERNMENT_ID_BACK_INVALID_FILE_TYPE:
            400,

          GOVERNMENT_ID_FRONT_FILE_BUFFER_MISSING:
            400,

          GOVERNMENT_ID_BACK_FILE_BUFFER_MISSING:
            400,

          GOVERNMENT_ID_ALREADY_VERIFIED:
            409,

          GOVERNMENT_ID_VERIFICATION_ALREADY_IN_PROGRESS:
            409,
        };

      if (
        errors[error.message]
      ) {
        return res
          .status(
            errors[
              error.message
            ]
          )
          .json({
            success: false,
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

export const getMyManualGovernmentIdController =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId =
        (req as any).user?.id;

      if (!userId) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Unauthorized",
          });
      }

      const result =
        await getMyManualGovernmentIdService(
          userId
        );

      if (!result) {
        return res
          .status(200)
          .json({
            success: true,

            data: {
              status:
                VerificationStatus.NOT_STARTED,
            },
          });
      }

      return res
        .status(200)
        .json({
          success: true,
          data: result,
        });
    } catch (error) {
      next(error);
    }
  };

// ======================================================
// ADMIN - LIST
// ======================================================

export const getManualGovernmentIdListController =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      let status:
        | VerificationStatus
        | undefined;

      let documentType:
        | GovernmentIdType
        | undefined;

      if (req.query.status) {
        const value =
          req.query
            .status as string;

        if (
          !Object.values(
            VerificationStatus
          ).includes(
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

      if (
        req.query.documentType
      ) {
        documentType =
          validateGovernmentIdType(
            req.query
              .documentType as string
          );
      }

      const result =
        await getManualGovernmentIdListService(
          status,
          documentType
        );

      return res
        .status(200)
        .json({
          success: true,
          data: result,
        });
    } catch (error: any) {
      if (
        error.message ===
        "INVALID_GOVERNMENT_ID_TYPE"
      ) {
        return res
          .status(400)
          .json({
            success: false,
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

export const getManualGovernmentIdDetailsController =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id =
        req.params.id as string;

      if (!id) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Verification ID is required",
          });
      }

      const result =
        await getManualGovernmentIdDetailsService(
          id
        );

      return res
        .status(200)
        .json({
          success: true,
          data: result,
        });
    } catch (error: any) {
      if (
        error.message ===
        "MANUAL_GOVERNMENT_ID_NOT_FOUND"
      ) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Manual government ID verification not found",
          });
      }

      next(error);
    }
  };

// ======================================================
// ADMIN - REVIEW
// ======================================================

export const reviewManualGovernmentIdController =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id =
        req.params.id as string;

      const {
        action,
        rejectionReason,
      } = req.body;

      if (
        action !== "APPROVE" &&
        action !== "REJECT"
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Action must be APPROVE or REJECT",
          });
      }

      if (
        action === "REJECT" &&
        !rejectionReason
          ?.trim()
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Rejection reason is required",
          });
      }

      const result =
        await reviewManualGovernmentIdService(
          id,
          action,
          rejectionReason
        );

      return res
        .status(200)
        .json({
          success: true,

          message:
            action ===
            "APPROVE"
              ? "Government ID verification approved successfully"
              : "Government ID verification rejected successfully",

          data: result,
        });
    } catch (error: any) {
      const errors:
        Record<
          string,
          number
        > = {
          MANUAL_GOVERNMENT_ID_NOT_FOUND:
            404,

          GOVERNMENT_ID_ALREADY_VERIFIED:
            409,

          REJECTION_REASON_REQUIRED:
            400,
        };

      if (
        errors[error.message]
      ) {
        return res
          .status(
            errors[
              error.message
            ]
          )
          .json({
            success: false,
            message:
              error.message,
          });
      }

      next(error);
    }
  };