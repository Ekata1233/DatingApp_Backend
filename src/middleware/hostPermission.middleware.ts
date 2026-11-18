import {
  Request,
  Response,
  NextFunction,
} from "express";

import { prisma } from "../prisma/prismaClient";

import {
  PartnerRequest,
} from "../types/partnerAuth.types";

type HostPermission =
  | "canViewGuestList"
  | "canCheckInGuests"
  | "canUpdateRunSheetProgress"
  | "canViewRoomList"
  | "canReportIncidentSOS"
  | "canMessageGuests"
  | "canReplyToReviews"
  | "canCreateSubmitEvent"
  | "canEditEvent"
  | "canCancelEventRefund"
  | "canManagePayouts";

export const requireHostPermission = (
  permission: HostPermission,
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const partner =
        (req as PartnerRequest).partner;

      if (
        !partner ||
        partner.role !== "HOST" ||
        !partner.hostId ||
        !partner.businessId
      ) {
        return res.status(403).json({
          success: false,
          message: "Host access required",
        });
      }

      const host = await prisma.host.findFirst({
        where: {
          id: partner.hostId,

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
          canViewGuestList: true,

          canCheckInGuests: true,

          canUpdateRunSheetProgress: true,

          canViewRoomList: true,

          canReportIncidentSOS: true,

          canMessageGuests: true,

          canReplyToReviews: true,

          canCreateSubmitEvent: true,

          canEditEvent: true,

          canCancelEventRefund: true,

          canManagePayouts: true,
        },
      });

      if (!host || !host[permission]) {
        return res.status(403).json({
          success: false,

          message:
            "You do not have permission for this action",
        });
      }

      return next();

    } catch (error) {
      console.error(
        "Host permission error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message: "Host permission validation failed",
      });
    }
  };
};