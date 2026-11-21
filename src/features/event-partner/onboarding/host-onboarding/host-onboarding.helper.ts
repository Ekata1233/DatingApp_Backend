import {
  HostStatus,
  HostStep,
  Prisma,
} from "@prisma/client";

import { createHash } from "crypto";


import {
  PersonalDetailsInput,
  CodeOfConductInput,
  HostOnboardingError,
  HOST_STEP_NUMBER,
  HOST_TOTAL_STEPS,
  HOST_PERMISSION_OPTIONS,
  HOST_CODE_OF_CONDUCT_VERSION,
  HOST_CODE_OF_CONDUCT_RULES,
  HOST_CODE_OF_CONDUCT_DECLARATIONS,
} from "./host-onboarding.types";
import { prisma } from "../../../../prisma/prismaClient";

/* -------------------------------------------------------------------------- */
/*                              HOST CONTEXT TYPE                             */
/* -------------------------------------------------------------------------- */

export type HostContext = {
  hostId: string;
  partnerId: string;
  businessId: string;
};

export type DatabaseClient =
  | Prisma.TransactionClient
  | typeof prisma;

/* -------------------------------------------------------------------------- */
/*                               GET VALID HOST                               */
/* -------------------------------------------------------------------------- */

export const getValidHost = async (
  db: DatabaseClient,
  context: HostContext,
) => {
  const host = await db.host.findFirst({
    where: {
      id: context.hostId,
      partnerId: context.partnerId,
      businessId: context.businessId,

      removedAt: null,
      declinedAt: null,

      status: {
        in: [
          HostStatus.INVITED,
          HostStatus.ONBOARDING,
          HostStatus.ACTIVE,
        ],
      },

      business: {
        status: "ACTIVE",
        onboardingCompleted: true,

        partner: {
          accountStatus: "ACTIVE",
          deletedAt: null,
        },
      },

      partner: {
        isPhoneVerified: true,
        accountStatus: "ACTIVE",
        deletedAt: null,
      },
    },

    include: {
      business: {
        include: {
          partner: {
            select: {
              fullName: true,
            },
          },
        },
      },

      partner: {
        select: {
          phoneNumber: true,
          isPhoneVerified: true,
        },
      },

      verifyId: true,

      _count: {
        select: {
          assignedEvents: true,
        },
      },
    },
  });

  if (!host) {
    throw new HostOnboardingError(
      404,
      "Host invitation not found",
    );
  }

  if (
    host.phoneNumber !== host.partner?.phoneNumber
  ) {
    throw new HostOnboardingError(
      403,
      "Mobile number does not match invitation",
    );
  }

  if (
    host.status === HostStatus.INVITED &&
    (!host.invitationExpiresAt ||
      host.invitationExpiresAt <= new Date())
  ) {
    throw new HostOnboardingError(
      410,
      "Host invitation has expired",
    );
  }

  return host;
};

/* -------------------------------------------------------------------------- */
/*                             FORMAT STEP RESPONSE                           */
/* -------------------------------------------------------------------------- */

export const formatOnboardingStep = (
  onboardingStep: HostStep,
) => {
  return {
    onboardingStep,

    currentStep:
      HOST_STEP_NUMBER[onboardingStep],

    totalSteps: HOST_TOTAL_STEPS,

    onboardingCompleted:
      onboardingStep === HostStep.COMPLETED,
  };
};

/* -------------------------------------------------------------------------- */
/*                         VALIDATE ACCEPTED INVITATION                       */
/* -------------------------------------------------------------------------- */

export const validateAcceptedInvitation = (
  host: Awaited<ReturnType<typeof getValidHost>>,
) => {
  if (
    !host.acceptedAt ||
    host.status === HostStatus.INVITED ||
    host.onboardingStep === HostStep.INVITE_ACCEPTANCE
  ) {
    throw new HostOnboardingError(
      409,
      "Please accept the host invitation first",
    );
  }
};

/* -------------------------------------------------------------------------- */
/*                            VALIDATE VERIFICATION                           */
/* -------------------------------------------------------------------------- */

export const validateHostVerification = (
  host: Awaited<ReturnType<typeof getValidHost>>,
) => {
  const verification = host.verifyId;

  if (!verification) {
    throw new HostOnboardingError(
      409,
      "Host verification is not completed",
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                             AADHAAR CHECK                                */
  /* ------------------------------------------------------------------------ */

  if (
    verification.aadhaarStatus !== "VERIFIED"
  ) {
    throw new HostOnboardingError(
      409,
      "Please complete Aadhaar verification",
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                              FACE MATCH                                  */
  /* ------------------------------------------------------------------------ */

  if (
    verification.faceStatus !== "VERIFIED"
  ) {
    throw new HostOnboardingError(
      409,
      "Please complete face verification",
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                             LIVENESS CHECK                               */
  /* ------------------------------------------------------------------------ */

  if (
    verification.livenessStatus !== "VERIFIED"
  ) {
    throw new HostOnboardingError(
      409,
      "Please complete live selfie verification",
    );
  }
};