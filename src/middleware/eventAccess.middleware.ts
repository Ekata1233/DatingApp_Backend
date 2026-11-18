import {
  Request,
  Response,
  NextFunction,
} from "express";

import { prisma } from "../prisma/prismaClient";

import {
  PartnerRequest,
} from "../types/partnerAuth.types";

export const validateEventAccess = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const partner =
      (req as PartnerRequest).partner;

    const { eventId } = req.params;

    if (!partner) {
      return res.status(401).json({
        success: false,
        message: "Partner authentication required",
      });
    }

    if (
      typeof eventId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        eventId,
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid event ID is required",
      });
    }

    if (!partner.businessId) {
      return res.status(403).json({
        success: false,
        message: "Business access required",
      });
    }

    // ==========================================
    // ORGANIZER EVENT ACCESS
    // ==========================================

    if (partner.role === "ORGANIZER") {
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,

          businessDetailsId: partner.businessId,

          business: {
            partnerId: partner.id,

            status: "ACTIVE",

            onboardingCompleted: true,
          },
        },

        select: {
          id: true,

          businessDetailsId: true,
        },
      });

      if (!event || !event.businessDetailsId) {
        return res.status(404).json({
          success: false,
          message: "Event not found or access denied",
        });
      }

      (req as PartnerRequest).eventAccess = {
        eventId: event.id,

        businessDetailsId:
          event.businessDetailsId,
      };

      return next();
    }

    // ==========================================
    // HOST EVENT ACCESS
    // ==========================================

    if (partner.role === "HOST") {
      if (!partner.hostId) {
        return res.status(403).json({
          success: false,
          message: "Host role validation required",
        });
      }

      const assignment =
        await prisma.eventHost.findFirst({
          where: {
            eventId,

            hostId: partner.hostId,

            status: "ACTIVE",

            host: {
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

            event: {
              businessDetailsId:
                partner.businessId,
            },
          },

          select: {
            id: true,
            eventId: true,
          },
        });

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Event not found or access denied",
        });
      }

      (req as PartnerRequest).eventAccess = {
        eventId: assignment.eventId,

        businessDetailsId:
          partner.businessId,
      };

      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Event access denied",
    });

  } catch (error) {
    console.error(
      "Event access validation error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Event access validation failed",
    });
  }
};