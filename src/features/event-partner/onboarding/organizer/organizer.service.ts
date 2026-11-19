import { createHash } from "crypto";

import { prisma } from "../../../../prisma/prismaClient";

import {
  OrganizerAboutYouInput,
  OrganizerOnboardingError,
  ConsentDocument,
} from "./organizer.types";

// ======================================================
// CONSENT DOCUMENT CONFIGURATION
// ======================================================

const createConsentDocument = (
  content: string,
  version: string,
): ConsentDocument => {
  return {
    version,

    content,

    hash: createHash("sha256")
      .update(content)
      .digest("hex"),
  };
};

const getConsentDocuments = () => {
  return {
    verification: createConsentDocument(
      "Welvors may use my and my business's ID, PAN, GST and bank details only to verify and run this partner account, as per the DPDP Act, 2023.",
      "1.0",
    ),

    whatsapp: createConsentDocument(
      "I agree to receive booking, review and payout updates on WhatsApp or SMS. This preference is optional and can be changed anytime in settings.",
      "1.0",
    ),
  };
};

// ======================================================
// EVENT PARTNER SELECT
// ======================================================

const organizerSelect = {
  id: true,

  fullName: true,

  phoneNumber: true,
  isPhoneVerified: true,
  phoneVerifiedAt: true,

  email: true,
  isEmailVerified: true,
  emailVerifiedAt: true,

  whatsappUpdates: true,
} as const;

// ======================================================
// 1. GET ORGANIZER ABOUT YOU DETAILS
// ======================================================

export const getOrganizerAboutYouService = async (
  partnerId: string,
  sessionId: string,
  businessId: string,
) => {
  // ==========================================
  // GET EVENT PARTNER
  // ==========================================

  const partner = await prisma.eventPartner.findFirst({
    where: {
      id: partnerId,

      sessionId,

      accountStatus: "ACTIVE",

      deletedAt: null,

      isPhoneVerified: true,
    },

    select: organizerSelect,
  });

  if (!partner) {
    throw new OrganizerOnboardingError(
      401,
      "Invalid partner session",
    );
  }

  // ==========================================
  // GET ORGANIZER BUSINESS
  // ==========================================

  const business =
    await prisma.businessDetails.findFirst({
      where: {
        id: businessId,

        partnerId,
      },

      select: {
        id: true,

        onboardingStep: true,

        onboardingCompleted: true,
      },
    });

  if (!business) {
    throw new OrganizerOnboardingError(
      404,
      "Organizer business not found",
    );
  }

  // ==========================================
  // GET CONSENT DOCUMENTS
  // ==========================================

  const documents = getConsentDocuments();

  // ==========================================
  // GET VERIFICATION CONSENT
  // ==========================================

  const verificationConsent =
    await prisma.partnerConsent.findFirst({
      where: {
        partnerId,

        businessId,

        hostId: null,

        consentType: "VERIFICATION_CONSENT",
      },

      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],
    });

  const isVerificationConsentAccepted =
    verificationConsent?.isAccepted === true &&
    verificationConsent.revokedAt === null &&
    verificationConsent.documentVersion ===
      documents.verification.version &&
    verificationConsent.documentHash ===
      documents.verification.hash;

  // ==========================================
  // RETURN ABOUT YOU DETAILS
  // ==========================================

  return {
    ...partner,

    businessId: business.id,

    verificationConsent:
      isVerificationConsentAccepted,

    consentDocuments: documents,

    onboardingStep: business.onboardingStep,

    onboardingCompleted:
      business.onboardingCompleted,
  };
};

// ======================================================
// 2. SAVE ORGANIZER ABOUT YOU DETAILS
// ======================================================

export const saveOrganizerAboutYouService = async (
  partnerId: string,
  sessionId: string,
  payload: OrganizerAboutYouInput,
  ipAddress?: string,
  userAgent?: string,
) => {
  const {
    businessId,

    fullName,

    email,

    verificationConsent,

    whatsappUpdates,

    verificationDocumentHash,

    whatsappDocumentHash,

    action,
  } = payload;

  // ==========================================
  // VALIDATE ACTION
  // ==========================================

  if (
    action !== "SAVE" &&
    action !== "CONTINUE"
  ) {
    throw new OrganizerOnboardingError(
      400,
      "Invalid action. Use SAVE or CONTINUE",
    );
  }

  // ==========================================
  // VALIDATE FULL NAME
  // ==========================================

  if (
    fullName !== undefined &&
    (
      typeof fullName !== "string" ||
      fullName.trim().length > 100
    )
  ) {
    throw new OrganizerOnboardingError(
      400,
      "Invalid full name",
    );
  }

  // ==========================================
  // VALIDATE EMAIL
  // ==========================================

  if (
    email !== undefined &&
    typeof email !== "string"
  ) {
    throw new OrganizerOnboardingError(
      400,
      "Invalid email address",
    );
  }

  // ==========================================
  // VALIDATE CONSENT VALUES
  // ==========================================

  if (
    verificationConsent !== undefined &&
    typeof verificationConsent !== "boolean"
  ) {
    throw new OrganizerOnboardingError(
      400,
      "Invalid verification consent",
    );
  }

  if (
    whatsappUpdates !== undefined &&
    typeof whatsappUpdates !== "boolean"
  ) {
    throw new OrganizerOnboardingError(
      400,
      "Invalid WhatsApp updates preference",
    );
  }

  const documents = getConsentDocuments();

  // ==========================================
  // START TRANSACTION
  // ==========================================

  return prisma.$transaction(async (tx) => {
    const now = new Date();

    // Prevent concurrent onboarding updates.

    await tx.$queryRaw`
      SELECT pg_advisory_xact_lock(
        hashtext(${partnerId})::bigint
      )::text
    `;

    // ========================================
    // GET PARTNER DETAILS
    // ========================================

    const partner = await tx.eventPartner.findFirst({
      where: {
        id: partnerId,

        sessionId,

        accountStatus: "ACTIVE",

        deletedAt: null,

        isPhoneVerified: true,
      },
    });

    if (!partner) {
      throw new OrganizerOnboardingError(
        401,
        "Invalid partner session",
      );
    }

    // ========================================
    // CHECK ORGANIZER BUSINESS
    // ========================================

    const business =
      await tx.businessDetails.findFirst({
        where: {
          id: businessId,

          partnerId,
        },
      });

    if (!business) {
      throw new OrganizerOnboardingError(
        404,
        "Organizer business not found",
      );
    }
// ========================================
// CHECK ONBOARDING COMPLETION
// ========================================

if (business.onboardingCompleted) {
  throw new OrganizerOnboardingError(
    409,
    "Organizer onboarding is already completed",
  );
}

    // ========================================
    // FINAL FULL NAME
    // ========================================

    const finalFullName =
      fullName !== undefined
        ? fullName.trim()
        : partner.fullName;

    // ========================================
    // CHECK EMAIL MATCH
    // ========================================

    if (
      email !== undefined &&
      email.trim().toLowerCase() !== partner.email
    ) {
      throw new OrganizerOnboardingError(
        400,
        "Please verify the entered email address",
      );
    }

    // ========================================
    // GET EXISTING VERIFICATION CONSENT
    // ========================================

    const existingVerificationConsent =
      await tx.partnerConsent.findFirst({
        where: {
          partnerId,

          businessId,

          hostId: null,

          consentType: "VERIFICATION_CONSENT",
        },

        orderBy: [
          { createdAt: "desc" },
          { id: "desc" },
        ],
      });

    const existingConsentAccepted =
      existingVerificationConsent?.isAccepted === true &&
      existingVerificationConsent.revokedAt === null &&
      existingVerificationConsent.documentVersion ===
        documents.verification.version &&
      existingVerificationConsent.documentHash ===
        documents.verification.hash;

    const finalVerificationConsent =
      verificationConsent ??
      existingConsentAccepted;

    // ========================================
    // VALIDATE CONSENT DOCUMENT HASH
    // ========================================

    if (
      verificationConsent === true &&
      verificationDocumentHash !==
        documents.verification.hash
    ) {
      throw new OrganizerOnboardingError(
        400,
        "Please read the latest verification notice",
      );
    }

    if (
      whatsappUpdates === true &&
      whatsappDocumentHash !==
        documents.whatsapp.hash
    ) {
      throw new OrganizerOnboardingError(
        400,
        "Please read the latest communication notice",
      );
    }

  // ========================================
// CONTINUE BUTTON VALIDATION
// ========================================

if (action === "CONTINUE") {
  // Full name is mandatory.

  if (
    !finalFullName ||
    finalFullName.trim().length < 2
  ) {
    throw new OrganizerOnboardingError(
      400,
      "Full name is required",
    );
  }

  // Mobile must already be verified.

  if (
    !partner.phoneNumber ||
    !partner.isPhoneVerified ||
    !partner.phoneVerifiedAt
  ) {
    throw new OrganizerOnboardingError(
      400,
      "Please verify your mobile number",
    );
  }

  // Email must already be verified.

  if (
    !partner.email ||
    !partner.isEmailVerified ||
    !partner.emailVerifiedAt
  ) {
    throw new OrganizerOnboardingError(
      400,
      "Please verify your work email",
    );
  }

  // Verification consent is mandatory.

  if (!finalVerificationConsent) {
    throw new OrganizerOnboardingError(
      400,
      "Verification consent is required",
    );
  }

  // WhatsApp updates are optional.
  // Both true and false are allowed.
}

    // ========================================
    // UPDATE EVENT PARTNER
    // ========================================

    const updated = await tx.eventPartner.updateMany({
      where: {
        id: partnerId,

        sessionId,

        accountStatus: "ACTIVE",

        deletedAt: null,

        isPhoneVerified: true,

        ...(action === "CONTINUE" && {
          email: partner.email,

          isEmailVerified: true,

          emailVerifiedAt:
            partner.emailVerifiedAt,
        }),
      },

      data: {
        ...(fullName !== undefined && {
          fullName: finalFullName,
        }),

        ...(whatsappUpdates !== undefined && {
          whatsappUpdates,
        }),
      },
    });

    if (updated.count !== 1) {
      throw new OrganizerOnboardingError(
        409,
        "Partner details changed. Please try again",
      );
    }

    // ========================================
    // SAVE VERIFICATION CONSENT
    // ========================================

    if (
      verificationConsent !== undefined &&
      (
        !existingVerificationConsent ||

        existingVerificationConsent.isAccepted !==
          verificationConsent ||

        existingVerificationConsent.documentVersion !==
          documents.verification.version ||

        existingVerificationConsent.documentHash !==
          documents.verification.hash ||

        (
          verificationConsent &&
          existingVerificationConsent.revokedAt !== null
        )
      )
    ) {
      // Revoke previous active consent.

      await tx.partnerConsent.updateMany({
        where: {
          partnerId,

          businessId,

          hostId: null,

          consentType: "VERIFICATION_CONSENT",

          isAccepted: true,

          revokedAt: null,
        },

        data: {
          revokedAt: now,
        },
      });

      // Create new consent history record.

      await tx.partnerConsent.create({
        data: {
          partnerId,

          businessId,

          consentType: "VERIFICATION_CONSENT",

          isAccepted: verificationConsent,

          documentVersion:
            documents.verification.version,

          documentHash:
            documents.verification.hash,

          acceptedAt:
            verificationConsent ? now : null,

          ipAddress,

          userAgent,
        },
      });
    }

    // ========================================
    // SAVE WHATSAPP UPDATES CONSENT
    // ========================================

    if (whatsappUpdates !== undefined) {
      const existingWhatsappConsent =
        await tx.partnerConsent.findFirst({
          where: {
            partnerId,

            businessId: null,

            hostId: null,

            consentType: "WHATSAPP_UPDATES",
          },

          orderBy: [
            { createdAt: "desc" },
            { id: "desc" },
          ],
        });

      if (
        !existingWhatsappConsent ||

        existingWhatsappConsent.isAccepted !==
          whatsappUpdates ||

        existingWhatsappConsent.documentVersion !==
          documents.whatsapp.version ||

        existingWhatsappConsent.documentHash !==
          documents.whatsapp.hash ||

        (
          whatsappUpdates &&
          existingWhatsappConsent.revokedAt !== null
        )
      ) {
        // Revoke previous consent.

        await tx.partnerConsent.updateMany({
          where: {
            partnerId,

            businessId: null,

            hostId: null,

            consentType: "WHATSAPP_UPDATES",

            isAccepted: true,

            revokedAt: null,
          },

          data: {
            revokedAt: now,
          },
        });

        // Create new WhatsApp consent.

        await tx.partnerConsent.create({
          data: {
            partnerId,

            consentType: "WHATSAPP_UPDATES",

            isAccepted: whatsappUpdates,

            documentVersion:
              documents.whatsapp.version,

            documentHash:
              documents.whatsapp.hash,

            acceptedAt:
              whatsappUpdates ? now : null,

            ipAddress,

            userAgent,
          },
        });
      }
    }

// ========================================
// UPDATE ONBOARDING STEP
// ========================================

if (
  action === "CONTINUE" &&
  business.onboardingStep === "PERSONAL_DETAILS"
) {
  const advanced =
    await tx.businessDetails.updateMany({
      where: {
        id: businessId,
        partnerId,
        onboardingStep: "PERSONAL_DETAILS",
        onboardingCompleted: false,
      },

      data: {
        onboardingStep: "BUSINESS_DETAILS",
      },
    });

  if (advanced.count !== 1) {
    throw new OrganizerOnboardingError(
      409,
      "Onboarding step changed. Please refresh",
    );
  }
}

    // ========================================
    // GET UPDATED EVENT PARTNER
    // ========================================

    const updatedPartner =
      await tx.eventPartner.findUniqueOrThrow({
        where: {
          id: partnerId,
        },

        select: organizerSelect,
      });

    // ========================================
    // GET UPDATED BUSINESS
    // ========================================

    const updatedBusiness =
      await tx.businessDetails.findUniqueOrThrow({
        where: {
          id: businessId,
        },

        select: {
          id: true,

          onboardingStep: true,

          onboardingCompleted: true,
        },
      });

    // ========================================
    // FINAL RESPONSE
    // ========================================

    return {
      ...updatedPartner,

      businessId: updatedBusiness.id,

      verificationConsent:
        finalVerificationConsent,

      onboardingStep:
        updatedBusiness.onboardingStep,

      onboardingCompleted:
        updatedBusiness.onboardingCompleted,

      nextScreen:
        action === "CONTINUE"
          ? "BUSINESS_DETAILS"
          : "ABOUT_YOU",
    };
  });
};