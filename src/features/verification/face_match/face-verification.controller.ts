
import {
  Request,
  Response,
  NextFunction,
} from "express";

import { prisma } from "../../../prisma/prismaClient";

import { VerificationType } from "@prisma/client";

import {
  verifyUserFaceService,
} from "./face-verification.service";
import { UploadedFile } from "express-fileupload";

export const verifyFaceController = async (
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

    const consent =
      req.body.consent === true ||
      req.body.consent === "true";

    if (!consent) {
      return res.status(400).json({
        success: false,
        message:
          "Face verification consent is required",
      });
    }

    const result =
      await verifyUserFaceService(
        userId,
        consent
      );

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


// Get current face verification status
export const getFaceVerificationStatusController =
  async (
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
              type:
                VerificationType.FACE_VERIFICATION,
            },
          },

          select: {
            id: true,
            type: true,
            status: true,
            points: true,
            maxPoints: true,
            verifiedAt: true,
            expiresAt: true,
            rejectionReason: true,
          },
        });

      return res.status(200).json({
        success: true,

        data: verification || {
          type: "FACE_VERIFICATION",
          status: "NOT_STARTED",
          points: 0,
          maxPoints: 5,
          verifiedAt: null,
        },
      });

    } catch (error) {
      next(error);
    }
  };