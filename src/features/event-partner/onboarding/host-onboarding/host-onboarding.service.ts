/* -------------------------------------------------------------------------- */
/*                           GET INVITATION DETAILS                           */
/* -------------------------------------------------------------------------- */

import { HostStatus, HostStep, PartnerConsentType, Prisma } from "@prisma/client";
import { prisma } from "../../../../prisma/prismaClient";
import { formatOnboardingStep, getValidHost, HostContext, validateAcceptedInvitation, validateHostVerification } from "./host-onboarding.helper";
import { CodeOfConductInput, HOST_CODE_OF_CONDUCT_DECLARATIONS, HOST_CODE_OF_CONDUCT_RULES, HOST_CODE_OF_CONDUCT_VERSION, HOST_PERMISSION_OPTIONS, HostOnboardingError, PersonalDetailsInput } from "./host-onboarding.types";
import { createHash } from "node:crypto";

const isHostPermissionEnabled = (
  host: Awaited<ReturnType<typeof getValidHost>>,
  permission: (typeof HOST_PERMISSION_OPTIONS)[number],
) => !permission.ownerOnly &&
  (permission.key === "canReportIncidentSOS" || host[permission.key]);

export const getHostDetailsService = async (context: HostContext) =>
  prisma.$transaction(async (tx) => {
    const host = await getValidHost(tx, context);
    const governmentIdAttempts = await tx.partnerGovernmentIdAttempt.findMany({
      where: context,
      orderBy: { createdAt: "desc" },
      select: {
        documentType: true,
        status: true,
        consentGivenAt: true,
        authorizedAt: true,
        completedAt: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    const consents = await tx.partnerConsent.findMany({
      where: context,
      orderBy: { createdAt: "desc" },
      select: {
        consentType: true,
        isAccepted: true,
        documentVersion: true,
        acceptedAt: true,
        revokedAt: true,
      },
    });
    const verification = host.verifyId;

    return {
      hostId: host.id,
      businessId: host.businessId,
      status: host.status,
      ...formatOnboardingStep(host.onboardingStep),
      onboardingCompleted: host.onboardingCompleted,
      joinedAt: host.joinedAt,
      permissions: Object.fromEntries(
        HOST_PERMISSION_OPTIONS.map((permission) => [
          permission.key,
          isHostPermissionEnabled(host, permission),
        ]),
      ),
      invitation: {
        invitedAt: host.invitedAt,
        expiresAt: host.invitationExpiresAt,
        acceptedAt: host.acceptedAt,
      },
      personalDetails: {
        fullName: host.fullName,
        phoneNumber: host.phoneNumber,
        isPhoneVerified: host.partner?.isPhoneVerified ?? false,
        email: host.email,
        gender: host.gender,
        languages: host.languages,
        emergencyContactName: host.emergencyContactName,
        emergencyContactPhone: host.emergencyContactPhone,
      },
      governmentId: {
        attempts: governmentIdAttempts,
        aadhaar: verification && {
          lastFour: verification.aadhaarLastFour,
          name: verification.aadhaarName,
          dateOfBirth: verification.dateOfBirth,
          city: verification.city,
          state: verification.state,
          isAdult: verification.isAdult,
          isNameMatched: verification.isNameMatched,
          status: verification.aadhaarStatus,
          verifiedAt: verification.aadhaarVerifiedAt,
          failureReason: verification.aadhaarFailureReason,
        },
      },
      faceVerification: verification && {
        hasSelfie: Boolean(verification.selfieKey),
        status: verification.faceStatus,
        isFaceMatched: verification.isFaceMatched,
        faceMatchScore: verification.faceMatchScore,
        verifiedAt: verification.faceVerifiedAt,
        failureReason: verification.faceFailureReason,
        livenessStatus: verification.livenessStatus,
        isLivenessPassed: verification.isLivenessPassed,
        livenessScore: verification.livenessScore,
        livenessVerifiedAt: verification.livenessVerifiedAt,
        livenessFailureReason: verification.livenessFailureReason,
      },
      consents,
    };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });

export const getHostInvitationService = async (
  context: HostContext,
) => {
  const host = await getValidHost(prisma, context);

  const business = host.business;

  const organizationName =
    business.brandName?.trim() ||
    business.tradeName?.trim() ||
    business.legalName?.trim() ||
    "Event Organizer";

  const organizerName =
    business.partner.fullName ||
    business.representativeName ||
    "Your organizer";

  /* ------------------------------------------------------------------------ */
  /*                           FORMAT PERMISSIONS                             */
  /* ------------------------------------------------------------------------ */

  const permissions = HOST_PERMISSION_OPTIONS.map(
    (permission) => {
      return {
        key: permission.key,
        label: permission.label,
        enabled: isHostPermissionEnabled(host, permission),
        ownerOnly: permission.ownerOnly,
      };
    },
  );

  /* ------------------------------------------------------------------------ */
  /*                              FINAL RESPONSE                              */
  /* ------------------------------------------------------------------------ */

  return {
    ...formatOnboardingStep(host.onboardingStep),

    hostId: host.id,

    status: host.status,

    isInvitationAccepted: Boolean(host.acceptedAt),

    title: `${organizationName} invited you`,

    description:
      `${organizerName} wants you on the team as a Co-host. Here's what that means before you accept.`,

    organization: {
      businessId: business.id,

      name: organizationName,

      organizerName,

      city: business.yourEvents?.baseCity ?? null,

      initial: organizationName
        .charAt(0)
        .toUpperCase(),
    },

    role: {
      value: "CO_HOST",

      label: "Co-host",

      icon: "🎤",

      description:
        "Runs assigned events with the permissions granted by the organizer.",
    },

    events: {
      assignedCount: host._count.assignedEvents,

      message:
        host._count.assignedEvents === 0
          ? `You'll see an event once ${organizerName.split(" ")[0]} makes you its host`
          : "You can access your assigned events after onboarding.",
    },

    permissions: {
      allowed: permissions.filter(
        (permission) => permission.enabled,
      ),

      restricted: permissions.filter(
        (permission) => !permission.enabled,
      ),
    },
  };
};

/* -------------------------------------------------------------------------- */
/*                              ACCEPT INVITATION                             */
/* -------------------------------------------------------------------------- */

export const acceptHostInvitationService = async (
  context: HostContext,
) => {
  return prisma.$transaction(
    async (tx) => {
      const host = await getValidHost(tx, context);

      /* -------------------------------------------------------------------- */
      /*                       ALREADY ACCEPTED INVITATION                    */
      /* -------------------------------------------------------------------- */

      if (host.acceptedAt) {
        return {
          hostId: host.id,
          status: host.status,
          acceptedAt: host.acceptedAt,

          ...formatOnboardingStep(
            host.onboardingStep,
          ),
        };
      }

      /* -------------------------------------------------------------------- */
      /*                            VALIDATE STEP                             */
      /* -------------------------------------------------------------------- */

      if (
        host.status !== HostStatus.INVITED ||
        host.onboardingStep !==
          HostStep.INVITE_ACCEPTANCE
      ) {
        throw new HostOnboardingError(
          409,
          "Host invitation cannot be accepted",
        );
      }

      const now = new Date();

      /* -------------------------------------------------------------------- */
      /*                           ACCEPT INVITATION                          */
      /* -------------------------------------------------------------------- */

      const updated = await tx.host.updateMany({
        where: {
          id: host.id,

          partnerId: context.partnerId,

          businessId: context.businessId,

          status: HostStatus.INVITED,

          onboardingStep:
            HostStep.INVITE_ACCEPTANCE,

          acceptedAt: null,

          invitationExpiresAt: {
            gt: now,
          },

          removedAt: null,

          declinedAt: null,
        },

        data: {
          acceptedAt: now,

          status: HostStatus.ONBOARDING,

          onboardingStep: HostStep.PERSONAL_DETAILS,
        },
      });

      if (updated.count !== 1) {
        throw new HostOnboardingError(
          409,
          "Invitation has changed or expired",
        );
      }

      return {
        hostId: host.id,

        status: HostStatus.ONBOARDING,

        acceptedAt: now,

        ...formatOnboardingStep(
          HostStep.PERSONAL_DETAILS,
        ),
      };
    },

    {
      isolationLevel:
        Prisma.TransactionIsolationLevel.Serializable,
    },
  );
};

export const declineHostInvitationService = async (context: HostContext) => {
  return prisma.$transaction(async (tx) => {
    const host = await getValidHost(tx, context);
    if (
      host.status !== HostStatus.INVITED ||
      host.onboardingStep !== HostStep.INVITE_ACCEPTANCE ||
      host.acceptedAt
    ) {
      throw new HostOnboardingError(409, "Only a pending invitation can be declined");
    }

    const declinedAt = new Date();
    const declined = await tx.host.updateMany({
      where: {
        id: context.hostId,
        partnerId: context.partnerId,
        businessId: context.businessId,
        status: HostStatus.INVITED,
        onboardingStep: HostStep.INVITE_ACCEPTANCE,
        acceptedAt: null,
        declinedAt: null,
        removedAt: null,
        invitationExpiresAt: { gt: declinedAt },
      },
      data: {
        status: HostStatus.DECLINED,
        declinedAt,
        invitationTokenHash: null,
      },
    });

    if (declined.count !== 1) {
      throw new HostOnboardingError(409, "Invitation has changed or expired");
    }

    return { hostId: host.id, status: HostStatus.DECLINED, declinedAt };
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  });
};

/* -------------------------------------------------------------------------- */
/*                           GET PERSONAL DETAILS                             */
/* -------------------------------------------------------------------------- */

export const getHostPersonalDetailsService = async (
  context: HostContext,
) => {
  const host = await getValidHost(prisma, context);

  validateAcceptedInvitation(host);

  return {
    ...formatOnboardingStep(host.onboardingStep),
    screenStep: 2,
    hostId: host.id,
    fullName: host.fullName,
    firstName: host.fullName.trim().split(/\s+/)[0],

    phoneNumber: host.phoneNumber,

    isPhoneVerified:
      host.partner?.isPhoneVerified ?? false,

    isFullNameEditable: false,

    isPhoneNumberEditable: false,

    emergencyContactName:
      host.emergencyContactName ?? null,

    emergencyContactPhone:
      host.emergencyContactPhone ?? null,
  };
};

/* -------------------------------------------------------------------------- */
/*                           SAVE PERSONAL DETAILS                            */
/* -------------------------------------------------------------------------- */

export const updateHostPersonalDetailsService =
  async (
    context: HostContext,
    payload: PersonalDetailsInput,
  ) => {
    return prisma.$transaction(
      async (tx) => {
        const host = await getValidHost(
          tx,
          context,
        );

        validateAcceptedInvitation(host);

        /* ------------------------------------------------------------------ */
        /*                     VALIDATE EMERGENCY CONTACT                     */
        /* ------------------------------------------------------------------ */

        if (
          payload.emergencyContactPhone ===
          host.phoneNumber
        ) {
          throw new HostOnboardingError(
            400,
            "Emergency contact mobile cannot be the same as your mobile number",
          );
        }

        /* ------------------------------------------------------------------ */
        /*                       MANAGE ONBOARDING STEP                       */
        /* ------------------------------------------------------------------ */

        const nextStep =
          host.onboardingStep ===
          HostStep.PERSONAL_DETAILS
            ? HostStep.VERIFY_ID
            : host.onboardingStep;

        /* ------------------------------------------------------------------ */
        /*                        UPDATE PERSONAL DETAILS                     */
        /* ------------------------------------------------------------------ */

        const updated = await tx.host.update({
          where: {
            id: host.id,
          },

          data: {
            emergencyContactName:
              payload.emergencyContactName,

            emergencyContactPhone:
              payload.emergencyContactPhone,

            onboardingStep: nextStep,
          },

          select: {
            id: true,

            fullName: true,

            phoneNumber: true,

            emergencyContactName: true,

            emergencyContactPhone: true,

            onboardingStep: true,

            status: true,
          },
        });

        return {
          hostId: updated.id,

          fullName: updated.fullName,

          phoneNumber: updated.phoneNumber,

          emergencyContactName:
            updated.emergencyContactName,

          emergencyContactPhone:
            updated.emergencyContactPhone,

          status: updated.status,

          ...formatOnboardingStep(
            updated.onboardingStep,
          ),
        };
      },

      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  };

  /* -------------------------------------------------------------------------- */
/*                            GET CODE OF CONDUCT                             */
/* -------------------------------------------------------------------------- */

export const getHostCodeOfConductService = async (
  context: HostContext,
) => {
  const host = await getValidHost(prisma, context);

  validateAcceptedInvitation(host);

  /* ------------------------------------------------------------------------ */
  /*                             VALIDATE STEP                                */
  /* ------------------------------------------------------------------------ */

  if (
    host.onboardingStep !==
      HostStep.CODE_OF_CONDUCT &&
    host.onboardingStep !== HostStep.VERIFICATION &&
    host.onboardingStep !== HostStep.COMPLETED
  ) {
    throw new HostOnboardingError(
      409,
      "Please complete previous onboarding steps",
    );
  }

  validateHostVerification(host);

  return {
    ...formatOnboardingStep(
      host.onboardingCompleted ? HostStep.COMPLETED : HostStep.CODE_OF_CONDUCT,
    ),

    screenStep: 5,

    version: HOST_CODE_OF_CONDUCT_VERSION,

    title: "How Welvors hosts behave",

    description:
      "Five rules. Breaking one can end your access on every Welvors team.",

    rules: HOST_CODE_OF_CONDUCT_RULES,

    declarations:
      HOST_CODE_OF_CONDUCT_DECLARATIONS,

    footer:
      "Accepted electronically. We record the time and your number.",

    isAlreadyAccepted:
      host.onboardingCompleted,
  };
};

/* -------------------------------------------------------------------------- */
/*                           ACCEPT CODE OF CONDUCT                           */
/* -------------------------------------------------------------------------- */

export const acceptHostCodeOfConductService = async (
  context: HostContext,

  payload: CodeOfConductInput,

  metadata: {
    ipAddress?: string;
    userAgent?: string;
  },
) => {
  return prisma.$transaction(
    async (tx) => {
      const host = await getValidHost(
        tx,
        context,
      );

      validateAcceptedInvitation(host);

      /* -------------------------------------------------------------------- */
      /*                          ALREADY COMPLETED                           */
      /* -------------------------------------------------------------------- */

      if (
        host.onboardingCompleted &&
        host.status === HostStatus.ACTIVE &&
        host.onboardingStep === HostStep.COMPLETED
      ) {
        return {
          hostId: host.id,

          businessId: host.businessId,

          role: "HOST",

          status: host.status,

          ...formatOnboardingStep(
            host.onboardingStep,
          ),
        };
      }

      /* -------------------------------------------------------------------- */
      /*                            VALIDATE STEP                             */
      /* -------------------------------------------------------------------- */

      if (
        host.status !== HostStatus.ONBOARDING ||
        (host.onboardingStep !== HostStep.CODE_OF_CONDUCT &&
          host.onboardingStep !== HostStep.VERIFICATION)
      ) {
        throw new HostOnboardingError(
          409,
          "Please complete previous onboarding steps",
        );
      }

      /* -------------------------------------------------------------------- */
      /*                        VALIDATE PERSONAL DETAILS                     */
      /* -------------------------------------------------------------------- */

      if (
        !host.emergencyContactName?.trim() ||
        !host.emergencyContactPhone ||
        host.emergencyContactPhone ===
          host.phoneNumber
      ) {
        throw new HostOnboardingError(
          409,
          "Emergency contact details are required",
        );
      }

      /* -------------------------------------------------------------------- */
      /*                        VALIDATE HOST VERIFICATION                    */
      /* -------------------------------------------------------------------- */

      validateHostVerification(host);

      /* -------------------------------------------------------------------- */
      /*                          VALIDATE DECLARATIONS                       */
      /* -------------------------------------------------------------------- */

      if (
        !payload.codeOfConductAccepted ||
        !payload.guestPrivacyAccepted ||
        !payload.safetyRulesAccepted
      ) {
        throw new HostOnboardingError(
          400,
          "All declarations must be accepted",
        );
      }

      const now = new Date();

      /* -------------------------------------------------------------------- */
      /*                         GENERATE DOCUMENT HASH                       */
      /* -------------------------------------------------------------------- */

      const documentHash = createHash("sha256")
        .update(
          JSON.stringify({
            version:
              HOST_CODE_OF_CONDUCT_VERSION,

            rules:
              HOST_CODE_OF_CONDUCT_RULES,

            declarations:
              HOST_CODE_OF_CONDUCT_DECLARATIONS,
          }),
        )
        .digest("hex");

      /* -------------------------------------------------------------------- */
      /*                            ACTIVATE HOST                             */
      /* -------------------------------------------------------------------- */

      const updated = await tx.host.updateMany({
        where: {
          id: host.id,

          partnerId: context.partnerId,

          businessId: context.businessId,

          status: HostStatus.ONBOARDING,

          onboardingStep: host.onboardingStep,

          onboardingCompleted: false,

          removedAt: null,

          declinedAt: null,
        },

        data: {
          status: HostStatus.ACTIVE,

          onboardingStep: HostStep.COMPLETED,

          onboardingCompleted: true,

          joinedAt: host.joinedAt ?? now,
        },
      });

      if (updated.count !== 1) {
        throw new HostOnboardingError(
          409,
          "Host onboarding status has changed",
        );
      }

      /* -------------------------------------------------------------------- */
      /*                             SAVE CONSENTS                            */
      /* -------------------------------------------------------------------- */

      await tx.partnerConsent.createMany({
        data: [
          PartnerConsentType.HOST_CODE_OF_CONDUCT,
          PartnerConsentType.GUEST_DATA_PRIVACY,
          PartnerConsentType.SAFETY_AND_POSH_RULES,
        ].map((consentType) => ({
          partnerId: context.partnerId,

          businessId: context.businessId,

          hostId: context.hostId,

          consentType,

          isAccepted: true,

          documentVersion: HOST_CODE_OF_CONDUCT_VERSION,

          documentHash,

          acceptedAt: now,

          acceptedPhoneNumber: host.phoneNumber,

          ipAddress:
            metadata.ipAddress ?? null,

          userAgent:
            metadata.userAgent?.slice(0, 500) ??
            null,
        })),
      });

      /* -------------------------------------------------------------------- */
      /*                            FINAL RESPONSE                            */
      /* -------------------------------------------------------------------- */

      return {
        hostId: host.id,

        businessId: host.businessId,

        role: "HOST",

        status: HostStatus.ACTIVE,

        acceptedAt: now,

        ...formatOnboardingStep(
          HostStep.COMPLETED,
        ),
      };
    },

    {
      isolationLevel:
        Prisma.TransactionIsolationLevel.Serializable,
    },
  );
};
