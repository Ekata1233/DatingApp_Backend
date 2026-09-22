import {
  Request,
  Response,
  NextFunction,
} from "express";

import { GovernmentIdType, VerificationType } from "@prisma/client";

import {
  completeGovernmentIdService,
  handleGovernmentIdCallback,
  initGovernmentIdService,
} from "./government-id.service";
import { prisma } from "../../../prisma/prismaClient";
import axios from "axios";

export const initGovernmentIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // -----------------------------------------
    // 1. Get authenticated user
    // -----------------------------------------

    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // -----------------------------------------
    // 2. Validate request body
    // -----------------------------------------

    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        success: false,
        message: "Request body is required",
        example: {
          documentType: "AADHAAR",
          consent: true,
        },
      });
    }

    const { documentType, consent } = req.body;

    // -----------------------------------------
    // 3. Validate Government ID type
    // -----------------------------------------

    if (
      typeof documentType !== "string" ||
      !Object.values(GovernmentIdType).includes(
        documentType as GovernmentIdType
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Government ID type",
        allowedTypes: Object.values(GovernmentIdType),
      });
    }

    // -----------------------------------------
    // 4. Validate user consent
    // -----------------------------------------

    if (consent !== true) {
      return res.status(400).json({
        success: false,
        message: "Verification consent is required",
      });
    }

    // -----------------------------------------
    // 5. Initialize Government ID verification
    // -----------------------------------------

    const result = await initGovernmentIdService(
      userId,
      documentType as GovernmentIdType,
      consent
    );

    // -----------------------------------------
    // 6. Return successful response
    // -----------------------------------------

    return res.status(200).json({
      success: true,
      message: "DigiLocker authorization URL generated",
      data: result,
    });

  } catch (error: unknown) {

    // -----------------------------------------
    // 7. Handle external API errors
    // -----------------------------------------

    if (axios.isAxiosError(error)) {

      const providerStatus = error.response?.status;

      console.error("Government ID Provider Error:", {
        status: providerStatus,
        data: error.response?.data,
      });

      return res.status(502).json({
        success: false,
        message:
          "Government ID verification provider rejected the request",
        errorCode: "GOVERNMENT_ID_PROVIDER_ERROR",
      });
    }

    // -----------------------------------------
    // 8. Handle other errors
    // -----------------------------------------

    console.error(
      "Government ID Initialization Error:",
      error
    );

    return next(error);
  }
};

export const governmentIdCallbackController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code, transaction_id, state } = req.query;

    if (
      typeof code !== "string" ||
      typeof transaction_id !== "string" ||
      typeof state !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid callback parameters",
      });
    }

    const result = await handleGovernmentIdCallback(
      transaction_id,
      state,
      code
    );

    const frontendUrl =
      process.env.FRONTEND_KYC_RETURN_URL;

    if (!frontendUrl) {
      return res.status(200).json({
        success: true,
        data: result,
      });
    }

    const returnUrl = new URL(frontendUrl);

    returnUrl.searchParams.set(
      "attemptId",
      result.attemptId
    );

    returnUrl.searchParams.set(
      "status",
      result.status
    );

    return res.redirect(303, returnUrl.toString());

  } catch (error) {
    next(error);
  }
};

export const completeGovernmentIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { attemptId } = req.body;

    if (
      typeof attemptId !== "string" ||
      !attemptId
    ) {
      return res.status(400).json({
        success: false,
        message: "attemptId is required",
      });
    }

    const result = await completeGovernmentIdService(
      userId,
      attemptId
    );

    return res.status(200).json({
      success: true,
      message: "Government ID verification completed",
      data: result,
    });

  } catch (error) {
    next(error);
  }
};

export const getGovernmentIdStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const verification =
      await prisma.userVerification.findUnique({
        where: {
          userId_type: {
            userId,
            type: VerificationType.GOVERNMENT_ID,
          },
        },
        select: {
          id: true,
          type: true,
          status: true,
          points: true,
          maxPoints: true,
          governmentIdType: true,
          verifiedAt: true,
          expiresAt: true,
          rejectionReason: true,
        },
      });

    const latestAttempt =
      await prisma.governmentIdAttempt.findFirst({
        where: {
          userId,
          verification: {
            type: VerificationType.GOVERNMENT_ID,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          status: true,
          documentType: true,
        },
      });

    return res.status(200).json({
      success: true,
      data: {
        verification: verification || {
          type: "GOVERNMENT_ID",
          status: "NOT_STARTED",
          points: 0,
          maxPoints: 10,
        },
        latestAttempt,
      },
    });

  } catch (error) {
    next(error);
  }
};