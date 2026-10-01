import {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  VerificationStatus,
} from "@prisma/client";

import {
  getManualAadhaarDetailsService,
  getManualAadhaarListService,
  getMyManualAadhaarService,
  ManualAadhaarFiles,
  reviewManualAadhaarService,
  submitManualAadhaarService,
} from "./manual-aadhaar.service";

// ======================================================
// SUBMIT MANUAL AADHAAR
// USER API
// ======================================================

export const submitManualAadhaarController =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId =
        (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // ----------------------------------------------
      // Required text fields
      // ----------------------------------------------

      const {
        aadhaarNumber,
        fullName,
        dateOfBirth,
        gender,
        address,
      } = req.body;

      if (!aadhaarNumber) {
        return res.status(400).json({
          success: false,
          message:
            "Aadhaar number is required",
        });
      }

      if (!fullName?.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Full name is required",
        });
      }

      if (!dateOfBirth) {
        return res.status(400).json({
          success: false,
          message:
            "Date of birth is required",
        });
      }

      // ----------------------------------------------
      // Get files from existing upload middleware
      // ----------------------------------------------

      const rawFiles =
        (req as any).files || {};

      const files:
        ManualAadhaarFiles = {
          aadhaarFrontPhoto:
            rawFiles.aadhaarFrontPhoto,

          aadhaarBackPhoto:
            rawFiles.aadhaarBackPhoto,
        };

      if (!files.aadhaarFrontPhoto) {
        return res.status(400).json({
          success: false,
          message:
            "Aadhaar front photo is required",
        });
      }

      if (!files.aadhaarBackPhoto) {
        return res.status(400).json({
          success: false,
          message:
            "Aadhaar back photo is required",
        });
      }

      // ----------------------------------------------
      // Service
      // ----------------------------------------------

      const result =
        await submitManualAadhaarService(
          userId,

          {
            aadhaarNumber,
            fullName,
            dateOfBirth,
            gender,
            address,
          },

          files
        );

      return res.status(201).json({
        success: true,

        message:
          "Manual Aadhaar verification submitted successfully",

        data: result,
      });
    } catch (error: any) {
      console.error(
        "Submit Manual Aadhaar Error:",
        error
      );

      const errorStatus:
        Record<string, number> = {
          USER_NOT_FOUND: 404,

          INVALID_AADHAAR_NUMBER:
            400,

          INVALID_DATE_OF_BIRTH:
            400,

          FULL_NAME_REQUIRED:
            400,

          AADHAAR_FRONT_PHOTO_REQUIRED:
            400,

          AADHAAR_BACK_PHOTO_REQUIRED:
            400,

          AADHAAR_FRONT_FILE_TOO_LARGE:
            400,

          AADHAAR_BACK_FILE_TOO_LARGE:
            400,

          AADHAAR_FRONT_INVALID_FILE_TYPE:
            400,

          AADHAAR_BACK_INVALID_FILE_TYPE:
            400,

          AADHAAR_FRONT_FILE_BUFFER_MISSING:
            400,

          AADHAAR_BACK_FILE_BUFFER_MISSING:
            400,

          GOVERNMENT_ID_ALREADY_VERIFIED:
            409,

          AADHAAR_VERIFICATION_ALREADY_IN_PROGRESS:
            409,
        };

      if (
        errorStatus[error.message]
      ) {
        return res
          .status(
            errorStatus[error.message]
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
// GET MY STATUS
// USER API
// ======================================================

export const getMyManualAadhaarController =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId =
        (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const result =
        await getMyManualAadhaarService(
          userId
        );

      if (!result) {
        return res.status(200).json({
          success: true,

          message:
            "Manual Aadhaar verification not submitted",

          data: {
            status:
              VerificationStatus.NOT_STARTED,
          },
        });
      }

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

// ======================================================
// ADMIN - GET ALL
// ======================================================

export const getManualAadhaarListController =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const status =
        req.query.status as
          | VerificationStatus
          | undefined;

      const allowedStatuses =
        Object.values(
          VerificationStatus
        );

      if (
        status &&
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid verification status",
        });
      }

      const result =
        await getManualAadhaarListService(
          status
        );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

// ======================================================
// ADMIN - GET DETAILS
// ======================================================

export const getManualAadhaarDetailsController =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const manualAadhaarId =
        req.params.id as string;

      if (!manualAadhaarId) {
        return res.status(400).json({
          success: false,
          message:
            "Manual Aadhaar verification ID is required",
        });
      }

      const result =
        await getManualAadhaarDetailsService(
          manualAadhaarId
        );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (
        error.message ===
        "MANUAL_AADHAAR_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Manual Aadhaar verification not found",
        });
      }

      next(error);
    }
  };

// ======================================================
// ADMIN - APPROVE / REJECT
// ======================================================

export const reviewManualAadhaarController =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const manualAadhaarId =
        req.params.id as string;

      const {
        action,
        rejectionReason,
      } = req.body;

      if (!manualAadhaarId) {
        return res.status(400).json({
          success: false,
          message:
            "Manual Aadhaar verification ID is required",
        });
      }

      if (
        action !== "APPROVE" &&
        action !== "REJECT"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Action must be APPROVE or REJECT",
        });
      }

      if (
        action === "REJECT" &&
        !rejectionReason?.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Rejection reason is required",
        });
      }

      const result =
        await reviewManualAadhaarService(
          manualAadhaarId,
          action,
          rejectionReason
        );

      return res.status(200).json({
        success: true,

        message:
          action === "APPROVE"
            ? "Manual Aadhaar verification approved successfully"
            : "Manual Aadhaar verification rejected successfully",

        data: result,
      });
    } catch (error: any) {
      console.error(
        "Review Manual Aadhaar Error:",
        error
      );

      const errorStatus:
        Record<string, number> = {
          MANUAL_AADHAAR_NOT_FOUND:
            404,

          AADHAAR_ALREADY_VERIFIED:
            409,

          REJECTION_REASON_REQUIRED:
            400,
        };

      if (
        errorStatus[error.message]
      ) {
        return res
          .status(
            errorStatus[error.message]
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