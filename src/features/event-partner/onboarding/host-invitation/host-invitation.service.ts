import {
  BusinessStatus,
  HostStatus,
  HostStep,
  PartnerStatus,
} from "@prisma/client";
import { HostInvitationLookupInput, HostInvitationLookupResponse } from "./host-invitation.types";
import { prisma } from "../../../../prisma/prismaClient";



/* -------------------------------------------------------------------------- */
/*                              GET HOST INVITATIONS                          */
/* -------------------------------------------------------------------------- */

export const getHostInvitationsService = async (
  payload: HostInvitationLookupInput,
): Promise<HostInvitationLookupResponse> => {
  const { phoneNumber } = payload;

  const now = new Date();

  /* ------------------------------------------------------------------------ */
  /*                         FETCH VALID INVITATIONS                          */
  /* ------------------------------------------------------------------------ */

  const hosts = await prisma.host.findMany({
    where: {
      phoneNumber,

      OR: [
        {
          status: HostStatus.INVITED,
          onboardingStep: HostStep.INVITE_ACCEPTANCE,
          onboardingCompleted: false,
          invitationExpiresAt: { gt: now },
          acceptedAt: null,
        },
        {
          acceptedAt: { not: null },
          status: {
            in: [HostStatus.ONBOARDING, HostStatus.ACTIVE, HostStatus.PAUSED],
          },
        },
      ],

      declinedAt: null,

      removedAt: null,

      business: {
        status: BusinessStatus.ACTIVE,

        onboardingCompleted: true,

        partner: {
          accountStatus: PartnerStatus.ACTIVE,

          deletedAt: null,
        },
      },
    },

    select: {
      id: true,
      acceptedAt: true,

      businessId: true,

      business: {
        select: {
          id: true,

          brandName: true,

          tradeName: true,

          legalName: true,

          logoUrl: true,

          representativeName: true,

          partner: {
            select: {
              fullName: true,
            },
          },

          yourEvents: {
            select: {
              baseCity: true,
            },
          },
        },
      },
    },

    orderBy: [
      {
        invitedAt: "desc",
      },
      {
        id: "desc",
      },
    ],
  });

  /* ------------------------------------------------------------------------ */
  /*                            FORMAT RESPONSE                               */
  /* ------------------------------------------------------------------------ */

  const invitations = hosts.map((host) => {
    const business = host.business;

    const organizationName =
      business.brandName?.trim() ||
      business.tradeName?.trim() ||
      business.legalName?.trim() ||
      "Event Organizer";

    return {
      hostId: host.id,
      isInvitationAccepted: host.acceptedAt !== null,

      businessId: business.id,

      organizationName,

      organizerName:
        business.partner.fullName ||
        business.representativeName ||
        null,

      city: business.yourEvents?.baseCity ?? null,

      logoUrl: business.logoUrl,

      initial: organizationName
        .charAt(0)
        .toUpperCase(),

      role: "CO_HOST" as const,

      roleLabel: "Co-host",
    };
  });

  /* ------------------------------------------------------------------------ */
  /*                             FINAL RESPONSE                               */
  /* ------------------------------------------------------------------------ */

  return {
    invitations,

    totalInvitations: invitations.length,
  };
};
