import {
  Response,
  NextFunction,
} from "express";

import { HostStatus } from "@prisma/client";

import { prisma } from "../prisma/prismaClient";
import { HostOnboardingRequest } from "../features/event-partner/onboarding/host-onboarding/host-onboarding.types";


/* -------------------------------------------------------------------------- */
/*                         HOST ONBOARDING MIDDLEWARE                         */
/* -------------------------------------------------------------------------- */

export const hostOnboardingMiddleware = async (
  req: HostOnboardingRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const partner = req.partner;

    /* ---------------------------------------------------------------------- */
    /*                         VALIDATE AUTHENTICATION                        */
    /* ---------------------------------------------------------------------- */

    if (!partner?.id) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    if (partner.role !== "HOST") {
      res.status(403).json({
        success: false,
        message: "Host access required",
      });

      return;
    }

    if (!partner.businessId) {
      res.status(403).json({
        success: false,
        message: "Host organization is not selected",
      });

      return;
    }

    /* ---------------------------------------------------------------------- */
    /*                              VALIDATE HOST                             */
    /* ---------------------------------------------------------------------- */

    const host = await prisma.host.findFirst({
      where: {
        partnerId: partner.id,

        businessId: partner.businessId,

        ...(partner.hostId
          ? { id: partner.hostId }
          : {}),

        status: {
          in: [
            HostStatus.INVITED,
            HostStatus.ONBOARDING,
            HostStatus.ACTIVE,
          ],
        },

        removedAt: null,

        declinedAt: null,

        business: {
          status: "ACTIVE",
          onboardingCompleted: true,

          partner: {
            accountStatus: "ACTIVE",
            deletedAt: null,
          },
        },

        partner: {
          accountStatus: "ACTIVE",
          isPhoneVerified: true,
          deletedAt: null,
        },
      },

      select: {
        id: true,
        partnerId: true,
        businessId: true,
        status: true,
        phoneNumber: true,
        invitationExpiresAt: true,

        partner: {
          select: {
            phoneNumber: true,
          },
        },
      },
    });

    if (!host || !host.partnerId) {
      res.status(403).json({
        success: false,
        message: "Valid host invitation not found",
      });

      return;
    }

    if (
      host.phoneNumber !== host.partner?.phoneNumber
    ) {
      res.status(403).json({
        success: false,
        message: "Verified mobile number does not match invitation",
      });

      return;
    }

    /* ---------------------------------------------------------------------- */
    /*                            INVITATION EXPIRY                           */
    /* ---------------------------------------------------------------------- */

    if (
      host.status === HostStatus.INVITED &&
      (!host.invitationExpiresAt ||
        host.invitationExpiresAt <= new Date())
    ) {
      res.status(410).json({
        success: false,
        message:
          "Invitation expired. Please contact your organizer.",
      });

      return;
    }

    /* ---------------------------------------------------------------------- */
    /*                              HOST CONTEXT                              */
    /* ---------------------------------------------------------------------- */

    req.hostContext = {
      hostId: host.id,
      partnerId: host.partnerId,
      businessId: host.businessId,
    };

    next();
  } catch (error) {
    console.error(
      "Host onboarding middleware error:",
      error instanceof Error ? error.name : "Unknown",
    );

    res.status(500).json({
      success: false,
      message: "Unable to validate host access",
    });
  }
};