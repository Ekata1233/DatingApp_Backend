import {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt from "jsonwebtoken";

import { prisma } from "../prisma/prismaClient";

import {
  PartnerRequest,
  PartnerTokenPayload,
} from "../types/partnerAuth.types";

export const partnerAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader =
      req.headers.authorization;

    // ==========================================
    // CHECK AUTHORIZATION TOKEN
    // ==========================================

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,

        message:
          "Authorization token is required",
      });
    }

    const token = authHeader.slice(7).trim();

    const secret =
      process.env.PARTNER_JWT_SECRET;

    if (!secret) {
      throw new Error(
        "PARTNER_JWT_SECRET is not configured",
      );
    }

    // ==========================================
    // VERIFY JWT
    // ==========================================

    const decoded = jwt.verify(
      token,
      secret,
      {
        algorithms: ["HS256"],
      },
    ) as PartnerTokenPayload;

    // ==========================================
    // VALIDATE TOKEN DATA
    // ==========================================

    if (
      decoded.tokenType !== "PARTNER" ||
      typeof decoded.partnerId !== "string" ||
      typeof decoded.sessionId !== "string" ||
      !decoded.partnerId ||
      !decoded.sessionId
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid partner token",
      });
    }

    if (
      decoded.role !== undefined &&
      decoded.role !== "ORGANIZER" &&
      decoded.role !== "HOST"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid partner role",
      });
    }

    if (
      Boolean(decoded.role) !==
      Boolean(decoded.businessId)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid account context",
      });
    }

    if (
      decoded.businessId !== undefined &&
      (
        typeof decoded.businessId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          decoded.businessId,
        )
      )
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid business ID",
      });
    }

    // ==========================================
    // FIND PARTNER
    // ==========================================

    const partner =
      await prisma.eventPartner.findUnique({
        where: {
          id: decoded.partnerId,
        },

        select: {
          id: true,
          sessionId: true,
          accountStatus: true,
          isPhoneVerified: true,
          deletedAt: true,
        },
      });

    if (!partner || partner.deletedAt) {
      return res.status(401).json({
        success: false,
        message: "Partner account not found",
      });
    }

    // ==========================================
    // CHECK ACCOUNT STATUS
    // ==========================================

    if (partner.accountStatus !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Your partner account is not active",
      });
    }

    // ==========================================
    // PHONE VERIFICATION
    // ==========================================

    if (!partner.isPhoneVerified) {
      return res.status(403).json({
        success: false,
        message: "Phone verification is required",
      });
    }

    // ==========================================
    // SINGLE DEVICE SESSION
    // ==========================================

    // if (
    //   !partner.sessionId ||
    //   partner.sessionId !== decoded.sessionId
    // ) {
    //   return res.status(401).json({
    //     success: false,

    //     code: "SESSION_EXPIRED",

    //     message:
    //       "Session expired. Please login again",
    //   });
    // }

    // ==========================================
    // ATTACH PARTNER TO REQUEST
    // ==========================================

    (req as PartnerRequest).partner = {
      id: partner.id,

      sessionId: decoded.sessionId,

      role: decoded.role,

      businessId: decoded.businessId,
    };

    return next();

  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        code: "TOKEN_EXPIRED",
        message: "Token expired. Please login again",
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization token",
      });
    }

    console.error(
      "Partner authentication error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Partner authentication failed",
    });
  }
};