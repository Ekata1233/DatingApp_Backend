import {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  educationVerificationSchema,
  educationIdSchema,
  educationReviewSchema,
  
} from "./education.validation";

import {
  submitEducationVerificationService,
  getMyEducationVerificationService,
  getEducationVerificationsService,
  getEducationVerificationDetailsService,
  reviewEducationVerificationService,
} from "./education.service";
import { VerificationStatus } from "@prisma/client";
import { EducationFiles } from "./education.type";

export const submitEducationVerificationController =
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

      const parsed =
        educationVerificationSchema.safeParse(
          req.body
        );

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message:
            parsed.error.issues[0]?.message ||
            "Invalid education details",
        });
      }

      const rawFiles =
        (req as any).files || {};

      const files: EducationFiles = {
        certificate:
          rawFiles.certificate,
        marksheet:
          rawFiles.marksheet,
      };

      if (!files.certificate) {
        return res.status(400).json({
          success: false,
          message:
            "Education certificate is required",
        });
      }

      const result =
        await submitEducationVerificationService(
          userId,
          parsed.data,
          files
        );

      return res.status(201).json({
        success: true,
        message:
          "Education verification submitted successfully",
        data: result,
      });
    } catch (error: any) {
      const errorStatus:
        Record<string, number> = {
        CERTIFICATE_REQUIRED: 400,

        EDUCATION_ALREADY_VERIFIED:
          409,

        EDUCATION_VERIFICATION_ALREADY_IN_PROGRESS:
          409,

        CERTIFICATE_FILE_TOO_LARGE:
          400,

        CERTIFICATE_INVALID_FILE_TYPE:
          400,

        CERTIFICATE_FILE_BUFFER_MISSING:
          400,

        MARKSHEET_FILE_TOO_LARGE:
          400,

        MARKSHEET_INVALID_FILE_TYPE:
          400,

        MARKSHEET_FILE_BUFFER_MISSING:
          400,
      };

      if (errorStatus[error.message]) {
        return res
          .status(
            errorStatus[error.message]
          )
          .json({
            success: false,
            message: error.message,
          });
      }

      next(error);
    }
  };

  export const getMyEducationVerificationController =
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
        await getMyEducationVerificationService(
          userId
        );

      if (!result) {
        return res.status(200).json({
          success: true,
          message:
            "Education verification not submitted",
          data: {
            status: "NOT_STARTED",
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

  export const getEducationVerificationsController =
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

      const result =
        await getEducationVerificationsService(
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

  export const getEducationVerificationDetailsController =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const educationId =
        req.params.id as string;

      const parsed =
        educationIdSchema.safeParse(
          educationId
        );

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid education verification ID",
        });
      }

      const result =
        await getEducationVerificationDetailsService(
          parsed.data
        );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (
        error.message ===
        "EDUCATION_VERIFICATION_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Education verification not found",
        });
      }

      next(error);
    }
  };

  export const reviewEducationVerificationController =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const educationId =
        req.params.id as string;

      const parsedId =
        educationIdSchema.safeParse(
          educationId
        );

      if (!parsedId.success) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid education verification ID",
        });
      }

      const parsed =
        educationReviewSchema.safeParse(
          req.body
        );

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message:
            parsed.error.issues[0]?.message ||
            "Invalid review request",
        });
      }

      const result =
        await reviewEducationVerificationService(
          parsedId.data,
          parsed.data.action,
          parsed.data.rejectionReason
        );

      return res.status(200).json({
        success: true,

        message:
          parsed.data.action ===
          "APPROVE"
            ? "Education verification approved successfully"
            : "Education verification rejected successfully",

        data: result,
      });
    } catch (error: any) {
      const errorStatus:
        Record<string, number> = {
        EDUCATION_VERIFICATION_NOT_FOUND:
          404,

        EDUCATION_VERIFICATION_ALREADY_REVIEWED:
          409,

        REJECTION_REASON_REQUIRED:
          400,
      };

      if (errorStatus[error.message]) {
        return res
          .status(
            errorStatus[error.message]
          )
          .json({
            success: false,
            message: error.message,
          });
      }

      next(error);
    }
  };