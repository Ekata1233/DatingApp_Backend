import { createHash, randomBytes, randomUUID } from "crypto";

import { prisma } from "../../../../prisma/prismaClient";
import { encryptText } from "../../../../utils/encryption";
import { verifyEmailOtpService } from "../../../email-verification/email-verification.service";

import {
  OrganizerAboutYouInput,
  OrganizerOnboardingError,
  ConsentDocument,
  PartnerGovernmentIdError,
  InitPartnerGovernmentIdInput,
  CompletePartnerGovernmentIdInput,
  normalizeIndianMobile,
} from "./organizer.types";
import {
  BusinessConstitution,
  GovernmentIdType,
  PartnerGovernmentIdAttemptStatus as AttemptStatus,
  PartnerVerificationStatus,
  Prisma,
  RepresentativeDesignation,
} from "@prisma/client";
import { hashState } from "./organizer.helper";
import { cacheBusinessPan, getCachedBusinessPan } from "./pan-verification-cache";
import {
  PanVerificationError,
  verifyEventPartnerPanService,
  type VerifyPanInput,
} from "../../verification/orgnizer/pan/pan-verification.service";
import {
  getVerifiedGovernmentDocument,
  validateGovernmentIdentity,
} from "../../../verification/government_id/government-id.helper";
import axios from "axios";
import imagekit from "../../../../utils/imagekit";
import { verifyFaceWithGridlines } from "../../../verification/face_match/face-match.provider";
import { verifyLivenessWithGridlines } from "../../../verification/liveness/liveness.provider";
import { validateImage } from "../../../verification/government_id/government-id.storage";
import { readGstVerification } from "../../verification/orgnizer/gst/gst-verification-proof";
import { eventsInclude } from "./your-events.service";

const gstConstitutionAliases: Readonly<Record<string, BusinessConstitution>> = {
  PROPRIETORSHIP: BusinessConstitution.SOLE_PROPRIETORSHIP,
  PARTNERSHIP_FIRM: BusinessConstitution.PARTNERSHIP,
  LIMITED_LIABILITY_PARTNERSHIP: BusinessConstitution.LLP,
  LIMITED_LIABILITY_PARTNERSHIP_LLP: BusinessConstitution.LLP,
  PRIVATE_LIMITED_COMPANY: BusinessConstitution.PRIVATE_LIMITED,
  PUBLIC_LIMITED_COMPANY: BusinessConstitution.PUBLIC_LIMITED,
  ONE_PERSON_COMPANY_OPC: BusinessConstitution.ONE_PERSON_COMPANY,
  HINDU_UNDIVIDED_FAMILY: BusinessConstitution.HUF,
  HINDU_UNDIVIDED_FAMILY_HUF: BusinessConstitution.HUF,
};

const mapGstConstitution = (value: string | null): BusinessConstitution | null => {
  const key = value?.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (!key) {
    return null;
  }
  if (Object.prototype.hasOwnProperty.call(BusinessConstitution, key)) {
    return BusinessConstitution[key as keyof typeof BusinessConstitution];
  }
  return gstConstitutionAliases[key] ?? BusinessConstitution.OTHER;
};

const organizerGstSelect = {
  id: true,
  hasGst: true,
  gstNumber: true,
  gstStatus: true,
  gstVerificationStatus: true,
  gstVerifiedAt: true,
  legalName: true,
  tradeName: true,
  constitution: true,
  registeredSince: true,
  principalPlace: true,
  registeredPincode: true,
} satisfies Prisma.BusinessDetailsSelect;

export const saveOrganizerGstService = async (
  partnerId: string,
  businessId: string,
  verificationId: string,
) => {
  const verification = readGstVerification(verificationId);
  if (verification?.partnerId !== partnerId || verification.businessId !== businessId.toLowerCase()) {
    throw new OrganizerOnboardingError(409, "Fetch and verify this GSTIN before saving");
  }

  const details = verification.gstDetails;
  const registrationDate = details.registrationDate?.replace(
    /^(\d{2})[/-](\d{2})[/-](\d{4})$/,
    "$3-$2-$1",
  );
  const registeredSince = registrationDate ? new Date(registrationDate) : null;
  return prisma.businessDetails.update({
    where: {
      id: businessId,
      partnerId,
      partner: { accountStatus: "ACTIVE", deletedAt: null },
    },
    data: {
      hasGst: true,
      gstNumber: verification.gstNumber,
      gstStatus: verification.gstStatus,
      gstVerificationStatus: PartnerVerificationStatus.VERIFIED,
      gstVerifiedAt: new Date(verification.verifiedAt),
      legalName: details.legalName,
      tradeName: details.tradeName,
      constitution: mapGstConstitution(details.constitution),
      registeredSince: registeredSince && Number.isFinite(registeredSince.getTime()) ? registeredSince : null,
      principalPlace: details.principalAddress,
      registeredPincode: details.principalAddress?.match(/\b\d{6}\s*$/)?.[0].trim() ?? null,
    },
    select: organizerGstSelect,
  }).catch((error: unknown) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new OrganizerOnboardingError(404, "Business not found or access denied");
    }
    throw error;
  });
};

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

    hash: createHash("sha256").update(content).digest("hex"),
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

const gstNonRegistrationDocument = createConsentDocument(
  "I'm not required to register for GST. My yearly turnover from services is below ₹20 lakh (₹10 lakh in special-category states). I'll register and tell Welvors within 30 days if I cross it.",
  "1.0",
);

export const saveOrganizerBusinessDetailsService = async (input: {
  partnerId: string;
  businessId: string;
  brandName: string;
  gstNonRegistrationConsent?: boolean;
  gstNonRegistrationDocumentHash?: string;
  ipAddress?: string;
  userAgent?: string;
}) => {
  const { partnerId, businessId, brandName } = input;
  try {
    return await prisma.$transaction(async (tx) => {
      const business = await tx.businessDetails.findFirst({
        where: { id: businessId, partnerId, partner: { accountStatus: "ACTIVE", deletedAt: null } },
        select: {
          status: true,
          onboardingStep: true,
          gstVerificationStatus: true,
          panVerificationStatus: true,
        },
      });
      if (!business) {
        throw new OrganizerOnboardingError(404, "Organizer business not found");
        
      }
      if (
        (business.status !== "DRAFT" && business.status !== "CHANGES_REQUIRED") ||
        business.onboardingStep === "PERSONAL_DETAILS"

      ) {
                console.log(business.status , business.onboardingStep);

        throw new OrganizerOnboardingError(409, "Business details cannot be confirmed at the current onboarding step");
      }

      const hasGst = business.gstVerificationStatus === PartnerVerificationStatus.VERIFIED;
      const now = new Date();
      if (!hasGst) {
        if (business.panVerificationStatus !== PartnerVerificationStatus.VERIFIED) {
          throw new OrganizerOnboardingError(409, "Verify GST or business PAN before confirming business details");
        }
        if (input.gstNonRegistrationConsent !== true) {
          throw new OrganizerOnboardingError(400, "Accept the GST non-registration declaration");
        }
        if (input.gstNonRegistrationDocumentHash !== gstNonRegistrationDocument.hash) {
          throw new OrganizerOnboardingError(400, "Please read the latest GST non-registration declaration");
        }
      }

      const declarationWhere = {
        partnerId,
        businessId,
        hostId: null,
        consentType: "GST_NON_REGISTRATION_DECLARATION",
        revokedAt: null,
        isAccepted: true,
      } satisfies Prisma.PartnerConsentWhereInput;
      const currentDocument = {
        documentVersion: gstNonRegistrationDocument.version,
        documentHash: gstNonRegistrationDocument.hash,
      };
      await tx.partnerConsent.updateMany({
        where: { ...declarationWhere, ...(hasGst ? {} : { NOT: currentDocument }) },
        data: { revokedAt: now },
      });
      if (!hasGst && !(await tx.partnerConsent.findFirst({
        where: { ...declarationWhere, ...currentDocument },
        select: { id: true },
      }))) {
        await tx.partnerConsent.create({
          data: {
            partnerId,
            businessId,
            consentType: declarationWhere.consentType,
            isAccepted: true,
            ...currentDocument,
            acceptedAt: now,
            ipAddress: input.ipAddress,
            userAgent: input.userAgent,
          },
          select: { id: true },
        });
      }

      const saved = await tx.businessDetails.update({
        where: { id: businessId },
        data: {
          brandName,
          hasGst,
          businessConfirmedAt: now,
          onboardingStep: business.onboardingStep === "BUSINESS_DETAILS" ? "VERIFY_ID" : undefined,
        },
        select: { id: true, brandName: true, hasGst: true, businessConfirmedAt: true, onboardingStep: true },
      });
      return { ...saved, gstNonRegistrationConsent: !hasGst };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      throw new OrganizerOnboardingError(409, "Business details changed. Please retry.");
    }
    throw error;
  }
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

const organizerConsentSelect = {
  isAccepted: true,
  revokedAt: true,
  documentVersion: true,
  documentHash: true,
} satisfies Prisma.PartnerConsentSelect;

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
    throw new OrganizerOnboardingError(401, "Invalid partner session");
  }

  // ==========================================
  // GET ORGANIZER BUSINESS
  // ==========================================

  const business = await prisma.businessDetails.findFirst({
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
    throw new OrganizerOnboardingError(404, "Organizer business not found");
  }

  // ==========================================
  // GET CONSENT DOCUMENTS
  // ==========================================

  const documents = getConsentDocuments();

  // ==========================================
  // GET VERIFICATION CONSENT
  // ==========================================

  const verificationConsent = await prisma.partnerConsent.findFirst({
    select: organizerConsentSelect,
    where: {
      partnerId,

      businessId,

      hostId: null,

      consentType: "VERIFICATION_CONSENT",
    },

    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  const isVerificationConsentAccepted =
    verificationConsent?.isAccepted === true &&
    verificationConsent.revokedAt === null &&
    verificationConsent.documentVersion === documents.verification.version &&
    verificationConsent.documentHash === documents.verification.hash;

  // ==========================================
  // RETURN ABOUT YOU DETAILS
  // ==========================================

  return {
    ...partner,

    businessId: business.id,

    verificationConsent: isVerificationConsentAccepted,

    consentDocuments: documents,

    onboardingStep: business.onboardingStep,

    onboardingCompleted: business.onboardingCompleted,
  };
};

export const getOrganizerOnboardingService = async (
  partnerId: string,
  sessionId: string,
  businessId: string,
) => {
  const aboutYou = await getOrganizerAboutYouService(partnerId, sessionId, businessId);
  const [onboarding, aadhaarAttempt, categories] = await Promise.all([
    prisma.businessDetails.findFirst({
      where: { id: businessId, partnerId },
      select: {
        ...organizerGstSelect,
        brandName: true,
        businessConfirmedAt: true,
        representativeName: true,
        designation: true,
        isMcaNameMatched: true,
        panLastFour: true,
        panName: true,
        panCategory: true,
        panStatus: true,
        isAadhaarLinked: true,
        panVerificationStatus: true,
        panVerifiedAt: true,
        status: true,
        onboardingStep: true,
        onboardingCompleted: true,
        submittedAt: true,
        rejectionReason: true,
        verifyId: {
          select: {
            aadhaarStatus: true,
            aadhaarVerifiedAt: true,
            aadhaarFailureReason: true,
            aadhaarLastFour: true,
            city: true,
            state: true,
            isNameMatched: true,
            panStatus: true,
            panLastFour: true,
            panName: true,
            isPanNameMatched: true,
            isAadhaarLinked: true,
            panVerifiedAt: true,
            panFailureReason: true,
            faceStatus: true,
            faceMatchScore: true,
            isFaceMatched: true,
            faceVerifiedAt: true,
            faceFailureReason: true,
            livenessStatus: true,
            livenessFailureReason: true,
          },
        },
        yourEvents: { include: eventsInclude },
      },
    }),
    prisma.partnerGovernmentIdAttempt.findFirst({
      where: { partnerId, businessId, documentType: GovernmentIdType.AADHAAR },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { id: true, status: true, expiresAt: true },
    }),
    prisma.eventCategory.findMany({
      where: { isActive: true },
      ...eventsInclude.categories,
    }),
  ]);

  if (!onboarding) {
    throw new OrganizerOnboardingError(404, "Organizer business not found");
  }

  const { verifyId, yourEvents, ...business } = onboarding;
  return {
    aboutYou: {
      ...aboutYou,
      onboardingStep: business.onboardingStep,
      onboardingCompleted: business.onboardingCompleted,
    },
    business,
    gstNonRegistrationDocument,
    verification: verifyId,
    aadhaarAttempt,
    yourEvents,
    categories,
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
    otp,

    verificationConsent,

    whatsappUpdates,

    verificationDocumentHash,

    whatsappDocumentHash,

    action,
  } = payload;

  // ==========================================
  // VALIDATE ACTION
  // ==========================================

  if (action !== "SAVE" && action !== "CONTINUE") {
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
    (typeof fullName !== "string" || fullName.trim().length > 100)
  ) {
    throw new OrganizerOnboardingError(400, "Invalid full name");
  }

  // ==========================================
  // VALIDATE EMAIL
  // ==========================================

  if (email !== undefined && typeof email !== "string") {
    throw new OrganizerOnboardingError(400, "Invalid email address");
  }
  const requestedEmail = email?.trim().toLowerCase();
  if (otp !== undefined) {
    if (!requestedEmail || requestedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestedEmail)) {
      throw new OrganizerOnboardingError(400, "Valid email address is required with OTP");
    }
    if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
      throw new OrganizerOnboardingError(400, "Valid 6-digit OTP is required");
    }
  }

  // ==========================================
  // VALIDATE CONSENT VALUES
  // ==========================================

  if (
    verificationConsent !== undefined &&
    typeof verificationConsent !== "boolean"
  ) {
    throw new OrganizerOnboardingError(400, "Invalid verification consent");
  }

  if (whatsappUpdates !== undefined && typeof whatsappUpdates !== "boolean") {
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
      throw new OrganizerOnboardingError(401, "Invalid partner session");
    }

    // ========================================
    // CHECK ORGANIZER BUSINESS
    // ========================================

    const business = await tx.businessDetails.findFirst({
      where: {
        id: businessId,

        partnerId,
      },
    });

    if (!business) {
      throw new OrganizerOnboardingError(404, "Organizer business not found");
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
      fullName !== undefined ? fullName.trim() : partner.fullName;

    // ========================================
    // CHECK EMAIL MATCH
    // ========================================

    if (otp === undefined && (
      !partner.email || !partner.isEmailVerified || !partner.emailVerifiedAt ||
      (requestedEmail !== undefined && requestedEmail !== partner.email)
    )) {
      throw new OrganizerOnboardingError(
        400,
        "Verify your work email with OTP before saving About You",
      );
    }

    // ========================================
    // GET EXISTING VERIFICATION CONSENT
    // ========================================

    const existingVerificationConsent = await tx.partnerConsent.findFirst({
      select: organizerConsentSelect,
      where: {
        partnerId,

        businessId,

        hostId: null,

        consentType: "VERIFICATION_CONSENT",
      },

      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    const existingConsentAccepted =
      existingVerificationConsent?.isAccepted === true &&
      existingVerificationConsent.revokedAt === null &&
      existingVerificationConsent.documentVersion ===
        documents.verification.version &&
      existingVerificationConsent.documentHash === documents.verification.hash;

    const finalVerificationConsent =
      verificationConsent ?? existingConsentAccepted;

    // ========================================
    // VALIDATE CONSENT DOCUMENT HASH
    // ========================================

    if (
      verificationConsent === true &&
      verificationDocumentHash !== documents.verification.hash
    ) {
      throw new OrganizerOnboardingError(
        400,
        "Please read the latest verification notice",
      );
    }

    if (
      whatsappUpdates === true &&
      whatsappDocumentHash !== documents.whatsapp.hash
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

      if (!finalFullName || finalFullName.trim().length < 2) {
        throw new OrganizerOnboardingError(400, "Full name is required");
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

    const verifiedEmail = otp !== undefined && requestedEmail
      ? await verifyEmailOtpService(partnerId, { email: requestedEmail, otp }, tx).catch((error: unknown) => {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            throw new OrganizerOnboardingError(409, "Email address is already in use");
          }
          throw error;
        })
      : partner;

    const updated = await tx.eventPartner.updateMany({
      where: {
        id: partnerId,

        sessionId,

        accountStatus: "ACTIVE",

        deletedAt: null,

        isPhoneVerified: true,

        email: verifiedEmail.email,
        isEmailVerified: true,
        emailVerifiedAt: verifiedEmail.emailVerifiedAt,
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
      (!existingVerificationConsent ||
        existingVerificationConsent.isAccepted !== verificationConsent ||
        existingVerificationConsent.documentVersion !==
          documents.verification.version ||
        existingVerificationConsent.documentHash !==
          documents.verification.hash ||
        (verificationConsent && existingVerificationConsent.revokedAt !== null))
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
        select: { id: true },
        data: {
          partnerId,

          businessId,

          consentType: "VERIFICATION_CONSENT",

          isAccepted: verificationConsent,

          documentVersion: documents.verification.version,

          documentHash: documents.verification.hash,

          acceptedAt: verificationConsent ? now : null,

          ipAddress,

          userAgent,
        },
      });
    }

    // ========================================
    // SAVE WHATSAPP UPDATES CONSENT
    // ========================================

    if (whatsappUpdates !== undefined) {
      const existingWhatsappConsent = await tx.partnerConsent.findFirst({
        select: organizerConsentSelect,
        where: {
          partnerId,

          businessId: null,

          hostId: null,

          consentType: "WHATSAPP_UPDATES",
        },

        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      });

      if (
        !existingWhatsappConsent ||
        existingWhatsappConsent.isAccepted !== whatsappUpdates ||
        existingWhatsappConsent.documentVersion !==
          documents.whatsapp.version ||
        existingWhatsappConsent.documentHash !== documents.whatsapp.hash ||
        (whatsappUpdates && existingWhatsappConsent.revokedAt !== null)
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
          select: { id: true },
          data: {
            partnerId,

            consentType: "WHATSAPP_UPDATES",

            isAccepted: whatsappUpdates,

            documentVersion: documents.whatsapp.version,

            documentHash: documents.whatsapp.hash,

            acceptedAt: whatsappUpdates ? now : null,

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
      const advanced = await tx.businessDetails.updateMany({
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

    const updatedPartner = await tx.eventPartner.findUniqueOrThrow({
      where: {
        id: partnerId,
      },

      select: organizerSelect,
    });

    // ========================================
    // GET UPDATED BUSINESS
    // ========================================

    const updatedBusiness = await tx.businessDetails.findUniqueOrThrow({
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

      verificationConsent: finalVerificationConsent,

      onboardingStep: updatedBusiness.onboardingStep,

      onboardingCompleted: updatedBusiness.onboardingCompleted,

      nextScreen: action === "CONTINUE" ? "BUSINESS_DETAILS" : "ABOUT_YOU",
    };
  });
};

/* -------------------------------------------------------------------------- */
/*                            VERIFY PAN SERVICE                              */
/* -------------------------------------------------------------------------- */

const normalizeName = (name: string) =>
  name.trim().toUpperCase().replace(/\s+/g, " ");

export const organizerNamesMatch = (actual: string, expected: string) => {
  const actualName = normalizeName(actual);
  const expectedName = normalizeName(expected);
  if (actualName === expectedName) {
    return actualName.length > 0;
  }

  const actualParts = actualName.split(" ");
  const expectedParts = expectedName.split(" ");
  return actualParts.length >= 2 &&
    expectedParts.length >= 2 &&
    actualParts[0] === expectedParts[0] &&
    actualParts[actualParts.length - 1] === expectedParts[expectedParts.length - 1];
};

export const saveOrganizerIdentityDetails = async (
  partnerId: string,
  businessId: string,
  fullName: string,
  designation: RepresentativeDesignation,
  action: "SAVE" | "CONTINUE",
) => prisma.$transaction(async (tx) => {
  const business = await tx.businessDetails.findFirst({
    where: { id: businessId, partnerId, partner: { accountStatus: "ACTIVE", deletedAt: null } },
    select: {
      status: true,
      onboardingStep: true,
      representativeName: true,
      designation: true,
      partner: { select: { fullName: true } },
      verifyId: {
        select: {
          aadhaarStatus: true,
          aadhaarName: true,
          panStatus: true,
          panName: true,
          faceStatus: true,
          livenessStatus: true,
        },
      },
    },
  });
  if (!business) {
    throw new OrganizerOnboardingError(404, "Organizer business not found");
  }
  if (
    (business.status !== "DRAFT" && business.status !== "CHANGES_REQUIRED") ||
    (business.onboardingStep !== "VERIFY_ID" && business.onboardingStep !== "YOUR_EVENTS")
  ) {
    throw new OrganizerOnboardingError(409, "Complete business details before saving identity details");
  }
  
  const name = normalizeName(fullName);
  if (action === "CONTINUE") {
    const verification = business.verifyId;
    if (verification?.aadhaarStatus !== "VERIFIED" || !organizerNamesMatch(verification.aadhaarName ?? "", fullName)) {
      throw new OrganizerOnboardingError(409, "Complete Aadhaar verification for this name");
    }
    if (verification.panStatus !== "VERIFIED" || !organizerNamesMatch(verification.panName ?? "", fullName)) {
      throw new OrganizerOnboardingError(409, "Complete personal PAN verification for this name");
    }
    if (verification.faceStatus !== "VERIFIED" || verification.livenessStatus !== "VERIFIED") {
      throw new OrganizerOnboardingError(409, "Complete live selfie verification");
    }
  }

  const representativeChanged = normalizeName(business.representativeName ?? "") !== name ||
    business.designation !== designation;
  return tx.businessDetails.update({
    where: { id: businessId },
    data: {
      representativeName: fullName,
      designation,
      isMcaNameMatched: representativeChanged ? null : undefined,
      onboardingStep: action === "CONTINUE" ? "YOUR_EVENTS" : undefined,
    },
    select: { id: true, representativeName: true, designation: true, isMcaNameMatched: true, onboardingStep: true },
  });
}, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }).catch((error: unknown) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
    throw new OrganizerOnboardingError(409, "Identity details changed. Please retry.");
  }
  throw error;
});

export const fetchOrganizerBusinessPan = async (input: VerifyPanInput) => {
  const result = await verifyEventPartnerPanService(input);
  const { panNumber, fullName, isAadhaarLinked } = result.panDetails;
  if (!fullName) {
    throw new PanVerificationError(422, "PAN holder name is unavailable");
  }

  const verificationId = await cacheBusinessPan({
    partnerId: input.partnerId,
    businessId: input.businessId,
    panNumberEncrypted: encryptText(panNumber),
    panLastFour: panNumber.slice(-4),
    panName: fullName,
    panCategory: panNumber.charAt(3),
    panStatus: "VALID",
    isAadhaarLinked,
    verifiedAt: new Date().toISOString(),
  });
  return { ...result, verificationId };
};

export const saveOrganizerBusinessPan = async (
  partnerId: string,
  businessId: string,
  verificationId: string,
) => {
  const verification = await getCachedBusinessPan(verificationId);
  if (verification?.partnerId !== partnerId || verification.businessId !== businessId || !verification.panNumberEncrypted) {
    throw new PanVerificationError(409, "Fetch business PAN details again before saving");
  }

  const { panNumberEncrypted, panLastFour, panName, panCategory, panStatus, isAadhaarLinked, verifiedAt } = verification;
  const panVerifiedAt = new Date(verifiedAt);
  return prisma.businessDetails.update({
    where: {
      id: businessId,
      partnerId,
      partner: { accountStatus: "ACTIVE", deletedAt: null },
      status: { in: ["DRAFT", "CHANGES_REQUIRED"] },
      OR: [{ panVerifiedAt: null }, { panVerifiedAt: { lte: panVerifiedAt } }],
    },
    data: {
      panNumberEncrypted,
      panLastFour,
      panName,
      panCategory,
      panStatus,
      legalName: panName,
      tradeName: panName,
      isAadhaarLinked,
      panVerificationStatus: PartnerVerificationStatus.VERIFIED,
      panVerifiedAt,
    },
    select: {
      id: true,
      panLastFour: true,
      panName: true,
      panCategory: true,
      panStatus: true,
      legalName: true,
      tradeName: true,
      isAadhaarLinked: true,
      panVerificationStatus: true,
      panVerifiedAt: true,
    },
  }).catch((error: unknown) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new PanVerificationError(409, "Business PAN cannot be saved. Refresh onboarding details.");
    }
    throw error;
  });
};

export const verifyOrganizerIdentityPan = async (input: VerifyPanInput) => {
  const result = await verifyEventPartnerPanService(input);
  const { panNumber, fullName, isAadhaarLinked } = result.panDetails;
  if (panNumber.charAt(3) !== "P" || !fullName) {
    throw new PanVerificationError(422, "A valid individual PAN is required");
  }

  const business = await prisma.businessDetails.findFirst({
    where: {
      id: input.businessId,
      partnerId: input.partnerId,
      status: { in: ["DRAFT", "CHANGES_REQUIRED"] },
      partner: { accountStatus: "ACTIVE", deletedAt: null },
    },
    select: { partner: { select: { fullName: true } } },
  });
  if (!business?.partner.fullName) {
    throw new PanVerificationError(409, "Complete organizer personal details before verifying identity PAN");
  }
  if (!organizerNamesMatch(fullName, business.partner.fullName)) {
    throw new PanVerificationError(422, "PAN name does not match the organizer name");
  }

  const data = {
    panNumberEncrypted: encryptText(panNumber),
    panLastFour: panNumber.slice(-4),
    panName: fullName,
    isPanNameMatched: true,
    panStatus: PartnerVerificationStatus.VERIFIED,
    panVerifiedAt: new Date(),
    panProvider: "GRIDLINES",
    panFailureReason: null,
    isAadhaarLinked,
  };
  return prisma.verifyId.upsert({
    where: { businessId: input.businessId },
    create: { businessId: input.businessId, ...data },
    update: data,
    select: {
      businessId: true,
      panLastFour: true,
      panName: true,
      isPanNameMatched: true,
      panStatus: true,
      panVerifiedAt: true,
      isAadhaarLinked: true,
    },
  });
};

const gridlinesClient = axios.create({
  baseURL: process.env.GRIDLINES_BASE_URL || "https://api.gridlines.io",

  timeout: 30000,

  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-API-Key": process.env.GRIDLINES_API_KEY,
    "X-Auth-Type": "API-Key",
  },
});

/* -------------------------------------------------------------------------- */
/*                           VALIDATE PARTNER BUSINESS                        */
/* -------------------------------------------------------------------------- */

const getPartnerBusiness = async (partnerId: string, businessId: string) => {
  const business = await prisma.businessDetails.findFirst({
    where: {
      id: businessId,
      partnerId,
    },
    select: {
      id: true,
      partner: {
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
          isPhoneVerified: true,
          accountStatus: true,
        },
      },
    },
  });

  if (!business) {
    throw new PartnerGovernmentIdError(
      404,
      "Business not found or access denied",
    );
  }

  if (business.partner.accountStatus !== "ACTIVE") {
    throw new PartnerGovernmentIdError(403, "Partner account is not active");
  }

  if (!business.partner.fullName?.trim()) {
    throw new PartnerGovernmentIdError(400, "Partner full name is required");
  }

  return business;
};

const organizerFaceSelect = {
  id: true,
  businessId: true,
  faceStatus: true,
  faceMatchScore: true,
  isFaceMatched: true,
  faceProvider: true,
  faceReferenceId: true,
  faceVerifiedAt: true,
  faceFailureReason: true,
  livenessStatus: true,
  livenessFailureReason: true,
} as const;

export const checkOnboardingSelfie = async (
  transactionId: string,
  referenceId: string,
  selfie: Buffer,
) => {
  const document = await getVerifiedGovernmentDocument({
    transactionId,
    referenceId,
    documentType: GovernmentIdType.AADHAAR,
  }).catch(() => {
    throw new PartnerGovernmentIdError(502, "Unable to retrieve the verified Aadhaar portrait");
  });
  if (!document.portraitBuffer?.length) {
    throw new PartnerGovernmentIdError(422, "The verified Aadhaar document has no usable portrait");
  }

  const liveness = await verifyLivenessWithGridlines(selfie).catch(() => {
    throw new PartnerGovernmentIdError(502, "Liveness provider is unavailable");
  });
  if (!liveness.isLive) {
    throw new PartnerGovernmentIdError(422, "Live selfie check failed. Take a new selfie.");
  }
  const match = await verifyFaceWithGridlines(document.portraitBuffer, selfie).catch(() => {
    throw new PartnerGovernmentIdError(502, "Face match provider is unavailable");
  });
  return { liveness, match };
};

export const verifyOrganizerFaceService = async (
  partnerId: string,
  businessId: string,
  selfie: Buffer,
) => {
  let mimeType: ReturnType<typeof validateImage>;
  try {
    mimeType = validateImage(selfie);
  } catch {
    throw new PartnerGovernmentIdError(400, "Selfie must be a JPEG or PNG up to 5 MB");
  }

  await getPartnerBusiness(partnerId, businessId);
  const verification = await prisma.verifyId.findUnique({
    where: { businessId },
    select: {
      ...organizerFaceSelect,
      aadhaarStatus: true,
      aadhaarReferenceId: true,
      selfieKey: true,
    },
  });

  if (
    verification?.aadhaarStatus !== PartnerVerificationStatus.VERIFIED ||
    !verification.aadhaarReferenceId
  ) {
    throw new PartnerGovernmentIdError(409, "Complete Aadhaar verification first");
  }

  if (verification.faceStatus === PartnerVerificationStatus.VERIFIED &&
      verification.livenessStatus === PartnerVerificationStatus.VERIFIED) {
    return prisma.verifyId.findUniqueOrThrow({
      where: { businessId },
      select: organizerFaceSelect,
    });
  }

  const attempt = await prisma.partnerGovernmentIdAttempt.findUnique({
    where: {
      transactionId: verification.aadhaarReferenceId,
      businessId,
      partnerId,
      hostId: null,
      documentType: GovernmentIdType.AADHAAR,
      status: AttemptStatus.VERIFIED,
    },
    select: { referenceId: true },
  });
  if (!attempt) {
    throw new PartnerGovernmentIdError(409, "Verified Aadhaar transaction is unavailable");
  }

  const { liveness, match } = await checkOnboardingSelfie(
    verification.aadhaarReferenceId,
    attempt.referenceId,
    selfie,
  );

  const extension = mimeType === "image/png" ? "png" : "jpg";
  const { fileId } = await imagekit.upload({
    file: selfie,
    fileName: `${randomUUID()}.${extension}`,
    folder: `/event-partner/selfies/${businessId}`,
    isPrivateFile: true,
  }).catch(() => {
    throw new PartnerGovernmentIdError(502, "Unable to store the selfie");
  });

  const saved = await prisma.verifyId.update({
    where: {
      businessId,
      aadhaarStatus: PartnerVerificationStatus.VERIFIED,
      aadhaarReferenceId: verification.aadhaarReferenceId,
      faceStatus: verification.faceStatus,
      livenessStatus: verification.livenessStatus,
      selfieKey: verification.selfieKey,
    },
    data: {
      selfieKey: fileId,
      faceMatchScore: match.confidence,
      isFaceMatched: match.isMatch,
      faceStatus: match.isMatch
        ? PartnerVerificationStatus.VERIFIED
        : PartnerVerificationStatus.REJECTED,
      faceVerifiedAt: match.isMatch ? new Date() : null,
      faceReferenceId: match.providerRequestId ?? null,
      faceProvider: "GRIDLINES",
      faceFailureReason: match.isMatch ? null : "FACE_NOT_MATCHED",
      isLivenessPassed: true,
      livenessScore: liveness.confidence,
      livenessStatus: PartnerVerificationStatus.VERIFIED,
      livenessVerifiedAt: new Date(),
      livenessReferenceId: liveness.referenceId,
      livenessProvider: "GRIDLINES",
      livenessFailureReason: null,
    },
    select: organizerFaceSelect,
  }).catch(async (error: unknown) => {
    await imagekit.deleteFile(fileId).catch(() => {
      console.error("Unable to delete an unsaved organizer selfie");
    });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new PartnerGovernmentIdError(409, "Face verification changed. Please retry.");
    }
    throw error;
  });

  if (verification.selfieKey) {
    await imagekit.deleteFile(verification.selfieKey).catch(() => {
      console.error("Unable to delete a replaced organizer selfie");
    });
  }

  return saved;
};

/* -------------------------------------------------------------------------- */
/*                       INIT GOVERNMENT ID SERVICE                           */
/* -------------------------------------------------------------------------- */

export const initPartnerGovernmentIdService = async ({
  partnerId,
  businessId,
  documentType,
  consent,
}: InitPartnerGovernmentIdInput) => {
  if (documentType !== "AADHAAR") {
    throw new PartnerGovernmentIdError(
      400,
      "Only AADHAAR verification is supported",
    );
  }

  if (consent !== true) {
    throw new PartnerGovernmentIdError(400, "Verification consent is required");
  }

  const business = await getPartnerBusiness(partnerId, businessId);

  if (!business.partner.isPhoneVerified) {
    throw new PartnerGovernmentIdError(
      403,
      "Partner phone number must be verified",
    );
  }

  const mobileNumber = normalizeIndianMobile(business.partner.phoneNumber);

  /* ------------------------------------------------------------------------ */
  /*                     CHECK EXISTING VERIFICATION                          */
  /* ------------------------------------------------------------------------ */

  const existing = await prisma.verifyId.findUnique({
    where: {
      businessId,
    },
    select: {
      aadhaarStatus: true,
    },
  });

  if (existing?.aadhaarStatus === PartnerVerificationStatus.VERIFIED) {
    throw new PartnerGovernmentIdError(409, "Aadhaar is already verified");
  }

  return createOnboardingGovernmentIdAttempt(partnerId, businessId, mobileNumber, null);
};

export const createOnboardingGovernmentIdAttempt = async (
  partnerId: string,
  businessId: string,
  mobileNumber: string,
  hostId: string | null,
) => {
  const documentType = GovernmentIdType.AADHAAR;
  const referenceId = randomUUID();
  const callbackState = randomBytes(32).toString("hex");
  const callbackStateHash = hashState(callbackState);

  const callbackBase = hostId ? process.env.GRIDLINES_HOST_CALLBACK_URL : process.env.GRIDLINES_PARTNER_CALLBACK_URL;

  if (!callbackBase) {
    throw new Error("DigiLocker callback URL is missing");
  }

  const callbackUrl = new URL(callbackBase);

  callbackUrl.searchParams.set("state", callbackState);

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  /* ------------------------------------------------------------------------ */
  /*                          CREATE ATTEMPT                                  */
  /* ------------------------------------------------------------------------ */

  const attempt = await prisma.partnerGovernmentIdAttempt.create({
    data: {
      partnerId,
      businessId,
      hostId,
      referenceId,
      callbackStateHash,
      documentType,
      consentGivenAt: new Date(),
      expiresAt,
      status: AttemptStatus.INITIATING,
    },
  });

  try {
    /* ---------------------------------------------------------------------- */
    /*                          GRIDLINES INIT                                */
    /* ---------------------------------------------------------------------- */

    const response = await gridlinesClient.post(
      "/digilocker/init",
      {
        redirect_uri: callbackUrl.toString(),
        mobile_number: mobileNumber,
        check_account_linked: "true",
        sign_up_preference: "PIN",
        consent: "Y",
      },
      {
        headers: {
          "X-Reference-ID": referenceId,
        },
      },
    );

    const result = response.data;

    if (
      String(result?.data?.code) !== "1000" ||
      !result?.data?.transaction_id ||
      !result?.data?.authorization_url
    ) {
      throw new Error("DIGILOCKER_INIT_FAILED");
    }

    /* ---------------------------------------------------------------------- */
    /*                     SAVE TRANSACTION DETAILS                           */
    /* ---------------------------------------------------------------------- */

    await prisma.partnerGovernmentIdAttempt.update({
      where: {
        id: attempt.id,
      },
      data: {
        transactionId: result.data.transaction_id,
        providerRequestId: result.request_id ?? null,
        status: AttemptStatus.PENDING,
      },
    });

    /* ---------------------------------------------------------------------- */
    /*                           RETURN RESPONSE                              */
    /* ---------------------------------------------------------------------- */

    return {
      businessId,
      attemptId: attempt.id,
      documentType: "AADHAAR",
      status: "PENDING",
      authorizationUrl: result.data.authorization_url,
      expiresAt,
    };
  } catch (error: unknown) {
    const providerError = axios.isAxiosError(error)
      ? error.response?.data
      : null;

    const failureReason =
      providerError?.error?.code ??
      (error instanceof Error ? error.message : "DIGILOCKER_INIT_FAILED");

    await prisma.partnerGovernmentIdAttempt.update({
      where: {
        id: attempt.id,
      },
      data: {
        status: AttemptStatus.FAILED,
        failureReason,
      },
    });

    if (axios.isAxiosError(error)) {
      console.error("Partner DigiLocker Init Error:", {
        status: error.response?.status,
        code: providerError?.error?.code,
      });

      throw new PartnerGovernmentIdError(
        502,
        "Unable to initialize DigiLocker verification",
      );
    }

    throw error;
  }
};

export const completePartnerGovernmentIdService = async ({
  partnerId,
  businessId,
  attemptId,
}: CompletePartnerGovernmentIdInput) => {
  const business = await getPartnerBusiness(partnerId, businessId);
  const attemptWhere = { id: attemptId, partnerId, businessId, hostId: null };
  const attempt = await prisma.partnerGovernmentIdAttempt.findUnique({
    where: attemptWhere,
  });

  if (!attempt) {
    throw new PartnerGovernmentIdError(404, "Verification attempt not found");
  }

  const result = {
    businessId,
    attemptId,
    documentType: GovernmentIdType.AADHAAR,
    status: AttemptStatus.VERIFIED,
    message: "Aadhaar verification completed",
  };

  if (attempt.status === AttemptStatus.VERIFIED) {
    return result;
  }

  if (attempt.expiresAt && attempt.expiresAt <= new Date()) {
    throw new PartnerGovernmentIdError(410, "Verification attempt expired");
  }

  if (attempt.status !== AttemptStatus.AUTHORIZED) {
    throw new PartnerGovernmentIdError(409, "DigiLocker authorization is required");
  }

  if (!attempt.transactionId || attempt.documentType !== GovernmentIdType.AADHAAR) {
    throw new PartnerGovernmentIdError(409, "Invalid Aadhaar verification attempt");
  }

  const document = await getVerifiedGovernmentDocument({
    transactionId: attempt.transactionId,
    referenceId: attempt.referenceId,
    documentType: GovernmentIdType.AADHAAR,
  }).catch(() => {
    throw new PartnerGovernmentIdError(502, "Unable to retrieve Aadhaar from DigiLocker");
  });

  let identity: ReturnType<typeof validateGovernmentIdentity>;
  try {
    identity = validateGovernmentIdentity(document, GovernmentIdType.AADHAAR);
  } catch {
    throw new PartnerGovernmentIdError(422, "Aadhaar identity validation failed");
  }

  if (!organizerNamesMatch(identity.verifiedName, business.partner.fullName ?? "")) {
    throw new PartnerGovernmentIdError(422, "Aadhaar name does not match the partner name");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const now = new Date();
      const claimed = await tx.partnerGovernmentIdAttempt.updateMany({
        where: {
          ...attemptWhere,
          status: AttemptStatus.AUTHORIZED,
          transactionId: attempt.transactionId,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        data: {
          status: AttemptStatus.VERIFIED,
          completedAt: now,
          failureReason: null,
        },
      });

      if (claimed.count !== 1) {
        throw new PartnerGovernmentIdError(409, "Verification attempt state changed");
      }

      const current = await tx.verifyId.findUnique({
        where: { businessId },
        select: { aadhaarStatus: true },
      });

      if (current?.aadhaarStatus === PartnerVerificationStatus.VERIFIED) {
        throw new PartnerGovernmentIdError(409, "Aadhaar is already verified");
      }

      const aadhaar = {
        aadhaarLastFour: document.aadhaarLastFour ?? null,
        city: document.address?.city ?? null,
        state: document.address?.state ?? null,
        aadhaarName: identity.verifiedName,
        dateOfBirth: identity.birthDate,
        isAdult: true,
        isNameMatched: true,
        aadhaarStatus: PartnerVerificationStatus.VERIFIED,
        aadhaarVerifiedAt: now,
        aadhaarReferenceId: attempt.transactionId,
        aadhaarProvider: "GRIDLINES",
        aadhaarFailureReason: null,
      };

      await tx.verifyId.upsert({
        where: { businessId },
        create: { businessId, ...aadhaar },
        update: aadhaar,
      });

      return result;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2034" || error.code === "P2002")
    ) {
      const current = await prisma.partnerGovernmentIdAttempt.findUnique({
        where: attemptWhere,
        select: { status: true },
      });
      if (current?.status === AttemptStatus.VERIFIED) {
        return result;
      }
      throw new PartnerGovernmentIdError(409, "Verification state changed. Please retry.");
    }
    throw error;
  }
};
