import { createHash, randomBytes, randomUUID } from "crypto";

import { prisma } from "../../../../prisma/prismaClient";

import {
  OrganizerAboutYouInput,
  OrganizerOnboardingError,
  ConsentDocument,
  VerifyPanInput,
  GridlinesPanResponse,
  GridlinesPanData,
  PartnerGovernmentIdError,
  InitPartnerGovernmentIdInput,
  CompletePartnerGovernmentIdInput,
  normalizeIndianMobile,
} from "./organizer.types";
import {
  GovernmentIdType,
  PartnerGovernmentIdAttemptStatus as AttemptStatus,
  PartnerVerificationStatus,
  Prisma,
} from "@prisma/client";
import { hashState,  PanVerificationError } from "./organizer.helper";
import {
  getVerifiedGovernmentDocument,
  validateGovernmentIdentity,
} from "../../../verification/government_id/government-id.helper";
import axios from "axios";
import imagekit from "../../../../utils/imagekit";
import { verifyFaceWithGridlines } from "../../../verification/face_match/face-match.provider";
import { validateImage } from "../../../verification/government_id/government-id.storage";
import { verifyEventPartnerGstService } from "../../verification/orgnizer/gst/gst-verification.service";
import type { VerifyGstInput } from "../../verification/orgnizer/gst/gst-verification.types";

export const saveOrganizerGstService = async (input: VerifyGstInput) => {
  const verification = await verifyEventPartnerGstService(input);
  if (!verification.isGstActive) {
    throw new OrganizerOnboardingError(422, verification.verificationMessage);
  }

  const details = verification.gstDetails;
  return prisma.businessDetails.update({
    where: {
      id: input.businessId,
      partnerId: input.partnerId,
      partner: { accountStatus: "ACTIVE", deletedAt: null },
    },
    data: {
      hasGst: true,
      gstNumber: verification.gstNumber,
      gstStatus: details.registrationStatus,
      gstVerificationStatus: PartnerVerificationStatus.VERIFIED,
      gstVerifiedAt: verification.verifiedAt,
      legalName: details.legalName,
      tradeName: details.tradeName,
      constitution: details.constitution,
      registeredSince: details.registrationDate,
      principalPlace: details.address,
      registeredPincode: details.registeredPincode,
    },
    select: {
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
    },
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

    if (email !== undefined && email.trim().toLowerCase() !== partner.email) {
      throw new OrganizerOnboardingError(
        400,
        "Please verify the entered email address",
      );
    }

    // ========================================
    // GET EXISTING VERIFICATION CONSENT
    // ========================================

    const existingVerificationConsent = await tx.partnerConsent.findFirst({
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

          emailVerifiedAt: partner.emailVerifiedAt,
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

interface PanDetailsInput {
  panNumber: string;
  documentType: string;
  documentId: string;
  fullName: string;

  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;

  category?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;

  maskedAadhaarNumber?: string | null;
  isAadhaarLinked?: boolean | null;
  taxpayerProfile?: boolean | null;

  isPanNameMatched?: boolean;
  expectedName?: string;

  address?: {
    line1?: string | null;
    line2?: string | null;
    street?: string | null;
    city?: string | null;
    line5?: string | null;
    state?: string | null;
    pincode?: string | null;
    email?: string | null;
    phone?: string | null;
  };
}

interface SubmitPanInput {
  partnerId: string;
  businessId: string;
  consent: boolean;
  panDetails: PanDetailsInput;
}

const normalizeName = (name: string): string => {
  return name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
};

export const submitEventPartnerPanService = async ({
  partnerId,
  businessId,
  consent,
  panDetails,
}: SubmitPanInput) => {
  // 1. Validate consent

  if (consent !== true) {
    throw new PanVerificationError(
      400,
      "PAN verification consent is required",
    );
  }

  if (!panDetails || typeof panDetails !== "object") {
    throw new PanVerificationError(
      400,
      "PAN details are required",
    );
  }

  // 2. Validate PAN format

  const normalizedPan =
    typeof panDetails.panNumber === "string"
      ? panDetails.panNumber.trim().toUpperCase()
      : "";

  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(normalizedPan)) {
    throw new PanVerificationError(
      400,
      "Invalid PAN number format",
    );
  }

  if (
    panDetails.documentType?.toUpperCase() !== "PAN" ||
    panDetails.documentId?.toUpperCase() !== normalizedPan
  ) {
    throw new PanVerificationError(
      400,
      "PAN document details do not match",
    );
  }

  // 3. Validate business ownership

  const business = await prisma.businessDetails.findFirst({
    where: {
      id: businessId,
      partnerId,
    },
    select: {
      id: true,
      partner: {
        select: {
          fullName: true,
          accountStatus: true,
        },
      },
    },
  });

  if (!business) {
    throw new PanVerificationError(
      404,
      "Business not found or access denied",
    );
  }

  if (business.partner.accountStatus !== "ACTIVE") {
    throw new PanVerificationError(
      403,
      "Partner account is not active",
    );
  }

  // 4. Compare PAN name

  const partnerName = business.partner.fullName?.trim();

  if (!partnerName) {
    throw new PanVerificationError(
      400,
      "Partner full name is required",
    );
  }

  const panName =
    typeof panDetails.fullName === "string"
      ? panDetails.fullName.trim()
      : "";

  if (!panName) {
    throw new PanVerificationError(
      400,
      "PAN holder name is required",
    );
  }

  const isPanNameMatched =
    normalizeName(panName) === normalizeName(partnerName);

  const verificationStatus = isPanNameMatched
    ? PartnerVerificationStatus.VERIFIED
    : PartnerVerificationStatus.REJECTED;

  const verifiedAt = isPanNameMatched
    ? new Date()
    : null;

  const failureReason = isPanNameMatched
    ? null
    : "PAN name does not match registered partner name";

  // 5. Save to VerifyId

  const panSaveData = {
    panLastFour: normalizedPan.slice(-4),
    panName,
    isPanNameMatched,
    panStatus: verificationStatus,
    panVerifiedAt: verifiedAt,
    panProvider: "GRIDLINES",
    panFailureReason: failureReason,
    isAadhaarLinked:
      typeof panDetails.isAadhaarLinked === "boolean"
        ? panDetails.isAadhaarLinked
        : null,
  };

  const savedVerification = await prisma.verifyId.upsert({
    where: {
      businessId: business.id,
    },

    create: {
      businessId: business.id,
      ...panSaveData,
    },

    update: {
      ...panSaveData,
    },

    select: {
      id: true,
      businessId: true,
      panLastFour: true,
      panName: true,
      isPanNameMatched: true,
      panStatus: true,
      panVerifiedAt: true,
      panProvider: true,
      panFailureReason: true,
      isAadhaarLinked: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // 6. Return response

  const message = isPanNameMatched
    ? "PAN details saved successfully"
    : "PAN details saved, but name does not match";

  return {
    isVerified: isPanNameMatched,
    verificationStatus,
    isSaved: true,
    message,
    businessId: business.id,
    verificationId: savedVerification.id,

    panName,
    partnerName,
    isPanNameMatched,

    savedVerification,
  };
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
} as const;

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

  if (verification.faceStatus === PartnerVerificationStatus.VERIFIED) {
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
      documentType: GovernmentIdType.AADHAAR,
      status: AttemptStatus.VERIFIED,
    },
    select: { referenceId: true },
  });
  if (!attempt) {
    throw new PartnerGovernmentIdError(409, "Verified Aadhaar transaction is unavailable");
  }

  const document = await getVerifiedGovernmentDocument({
    transactionId: verification.aadhaarReferenceId,
    referenceId: attempt.referenceId,
    documentType: GovernmentIdType.AADHAAR,
  }).catch(() => {
    throw new PartnerGovernmentIdError(502, "Unable to retrieve the verified Aadhaar portrait");
  });
  if (!document.portraitBuffer?.length) {
    throw new PartnerGovernmentIdError(422, "The verified Aadhaar document has no usable portrait");
  }

  const match = await verifyFaceWithGridlines(document.portraitBuffer, selfie).catch(() => {
    throw new PartnerGovernmentIdError(502, "Face match provider is unavailable");
  });

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

  /* ------------------------------------------------------------------------ */
  /*                      CHECK ACTIVE ATTEMPT                                */
  /* ------------------------------------------------------------------------ */

  const now = new Date();

  const activeAttempt = await prisma.partnerGovernmentIdAttempt.findFirst({
    where: {
      partnerId,
      businessId,
      status: {
        in: [
          AttemptStatus.INITIATING,
          AttemptStatus.PENDING,
          AttemptStatus.AUTHORIZED,
        ],
      },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });

  if (activeAttempt) {
    throw new PartnerGovernmentIdError(
      409,
      "Aadhaar verification is already in progress",
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                       GENERATE SECURE REFERENCES                         */
  /* ------------------------------------------------------------------------ */

  const referenceId = randomUUID();
  const callbackState = randomBytes(32).toString("hex");
  const callbackStateHash = hashState(callbackState);

  const callbackBase = process.env.GRIDLINES_PARTNER_CALLBACK_URL;

  if (!callbackBase) {
    throw new Error("GRIDLINES_PARTNER_CALLBACK_URL is missing");
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
  const attemptWhere = { id: attemptId, partnerId, businessId };
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

  const verifiedName = normalizeName(identity.verifiedName);
  if (!verifiedName || verifiedName !== normalizeName(business.partner.fullName ?? "")) {
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
