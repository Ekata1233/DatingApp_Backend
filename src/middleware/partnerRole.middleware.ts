import {
  Request,
  Response,
  NextFunction,
} from "express";

import { prisma } from "../prisma/prismaClient";

import {
  PartnerRequest,
  PartnerRole,
} from "../types/partnerAuth.types";

export const requirePartnerRole = (
  requiredRole: PartnerRole,
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const partner =
        (req as PartnerRequest).partner;

      // ========================================
      // AUTHENTICATION VALIDATION
      // ========================================

      if (!partner) {
        return res.status(401).json({
          success: false,
          message: "Partner authentication required",
        });
      }

      // ========================================
      // ROLE VALIDATION
      // ========================================

      if (partner.role !== requiredRole) {
        return res.status(403).json({
          success: false,

          message:
            `${requiredRole} access required`,
        });
      }

      if (!partner.businessId) {
        return res.status(403).json({
          success: false,
          message: "Business selection is required",
        });
      }

      // ========================================
      // ORGANIZER ACCESS
      // ========================================

      if (requiredRole === "ORGANIZER") {
        const business =
          await prisma.businessDetails.findFirst({
            where: {
              id: partner.businessId,

              partnerId: partner.id,
            },

            select: {
              id: true,
              status: true,
              onboardingCompleted: true,
            },
          });

        if (!business) {
          return res.status(403).json({
            success: false,

            message:
              "You are not the organizer of this business",
          });
        }

        if (
          business.status !== "ACTIVE" ||
          !business.onboardingCompleted
        ) {
          return res.status(403).json({
            success: false,

            message:
              "Business onboarding or approval is pending",
          });
        }

        return next();
      }

      // ========================================
      // HOST ACCESS
      // ========================================

      if (requiredRole === "HOST") {
        const host = await prisma.host.findFirst({
          where: {
            partnerId: partner.id,

            businessId: partner.businessId,

            status: "ACTIVE",

            acceptedAt: {
              not: null,
            },

            declinedAt: null,

            removedAt: null,

            onboardingCompleted: true,

            business: {
              status: "ACTIVE",

              onboardingCompleted: true,
            },
          },

          select: {
            id: true,
            businessId: true,
          },
        });

        if (!host) {
          return res.status(403).json({
            success: false,

            message:
              "You are not an active host of this business",
          });
        }

        // Attach verified host ID

        partner.hostId = host.id;

        return next();
      }

      return res.status(403).json({
        success: false,
        message: "Invalid partner role",
      });

    } catch (error) {
      console.error(
        "Partner role validation error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message: "Partner role validation failed",
      });
    }
  };
};