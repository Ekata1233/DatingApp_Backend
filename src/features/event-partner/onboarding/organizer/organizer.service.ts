import { createHash } from "crypto";

import { prisma } from "../../../../prisma/prismaClient";

import {
  OrganizerAboutYouInput,
  OrganizerOnboardingError,
  ConsentDocument,
  VerifyPanInput,
  GridlinesPanResponse,
  GridlinesPanData,
} from "./organizer.types";
import { PartnerVerificationStatus } from "@prisma/client";
import { normalizeName, PanVerificationError } from "./organizer.helper";
import axios from "axios";

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


/* -------------------------------------------------------------------------- */
/*                            VERIFY PAN SERVICE                              */
/* -------------------------------------------------------------------------- */

export const verifyEventPartnerPanService = async ({
  partnerId,
  businessId,
  panNumber,
  consent,
}: VerifyPanInput) => {
  /* ------------------------------------------------------------------------ */
  /*                            1. VALIDATE INPUT                             */
  /* ------------------------------------------------------------------------ */

  const normalizedPan = panNumber?.trim().toUpperCase();

  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

  if (!normalizedPan || !panRegex.test(normalizedPan)) {
    throw new PanVerificationError(
      400,
      "Invalid PAN number format",
    );
  }

  if (consent !== true) {
    throw new PanVerificationError(
      400,
      "PAN verification consent is required",
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                       2. VALIDATE BUSINESS OWNER                         */
  /* ------------------------------------------------------------------------ */

  const business = await prisma.businessDetails.findFirst({
    where: {
      id: businessId,
      partnerId,
    },
    select: {
      id: true,
      partnerId: true,

      partner: {
        select: {
          id: true,
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

  /* ------------------------------------------------------------------------ */
  /*                        3. VALIDATE PARTNER NAME                          */
  /* ------------------------------------------------------------------------ */

  const partnerName = business.partner.fullName?.trim();

  if (!partnerName) {
    throw new PanVerificationError(
      400,
      "Partner full name is required before PAN verification",
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                        4. GRIDLINES CONFIGURATION                        */
  /* ------------------------------------------------------------------------ */

  const apiKey = process.env.GRIDLINES_API_KEY?.trim();

  const apiUrl =
    process.env.GRIDLINES_PAN_URL ||
    "https://api.gridlines.io/pan-api/fetch-detailed";

  if (!apiKey) {
    throw new Error("GRIDLINES_API_KEY is missing");
  }

  /* ------------------------------------------------------------------------ */
  /*                           5. CALL GRIDLINES                              */
  /* ------------------------------------------------------------------------ */

  let panData: GridlinesPanData;
  let panReferenceId: string | null = null;

  try {
    const response = await axios.post<GridlinesPanResponse>(
      apiUrl,
      {
        pan_number: normalizedPan,
        consent: "Y",
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
          "X-Auth-Type": "API-Key",
        },
        timeout: 30000,
      },
    );

    const result = response.data;

    const providerData = result.data ?? result;

    const verifiedPan = providerData.pan_data;

    /* ---------------------------------------------------------------------- */
    /*                       6. VALIDATE PAN RESPONSE                         */
    /* ---------------------------------------------------------------------- */

    const isValidPan =
      verifiedPan?.document_type?.toUpperCase() === "PAN" &&
      verifiedPan?.document_id?.toUpperCase() === normalizedPan &&
      providerData.message?.trim().toLowerCase() === "valid pan.";

    if (!verifiedPan || !isValidPan) {
      throw new PanVerificationError(
        422,
        "PAN verification was not successful",
      );
    }

    panData = verifiedPan;

    panReferenceId =
      providerData.reference_id ??
      result.reference_id ??
      null;
  } catch (error: unknown) {
    if (error instanceof PanVerificationError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      console.error("Gridlines PAN Verification Error:", {
        status: error.response?.status,
        code: error.code,
        message: error.message,
      });

      throw new PanVerificationError(
        502,
        error.response
          ? "Unable to verify PAN with Gridlines"
          : "PAN verification provider is unavailable",
      );
    }

    throw error;
  }

  /* ------------------------------------------------------------------------ */
  /*                         7. EXTRACT PAN DETAILS                           */
  /* ------------------------------------------------------------------------ */

  const panName = panData.name?.trim() || null;

  const address = panData.address_data ?? {};

  /* ------------------------------------------------------------------------ */
  /*                          8. COMPARE NAMES                                */
  /* ------------------------------------------------------------------------ */

  const isPanNameMatched = Boolean(
    panName &&
    normalizeName(panName) === normalizeName(partnerName),
  );

  const nameMatchMessage = !panName
    ? "PAN name is missing from provider response"
    : isPanNameMatched
      ? "PAN name matches the registered partner name"
      : "PAN name does not match the registered partner name";

  /* ------------------------------------------------------------------------ */
  /*                      9. DETERMINE VERIFICATION STATUS                    */
  /* ------------------------------------------------------------------------ */

  const verificationStatus: PartnerVerificationStatus =
    isPanNameMatched
      ? PartnerVerificationStatus.VERIFIED
      : PartnerVerificationStatus.REJECTED;

  const verifiedAt = isPanNameMatched ? new Date() : null;

  const failureReason = isPanNameMatched
    ? null
    : nameMatchMessage;

  /* ------------------------------------------------------------------------ */
  /*                       10. SAVE DETAILS IN VERIFY ID                      */
  /* ------------------------------------------------------------------------ */

  const savedVerification = await prisma.verifyId.upsert({
    where: {
      businessId: business.id,
    },

    create: {
      businessId: business.id,

      panLastFour: normalizedPan.slice(-4),

      panName: panName,

      isPanNameMatched,

      panStatus: verificationStatus,

      panVerifiedAt: verifiedAt,

      panReferenceId,

      panProvider: "GRIDLINES",

      panFailureReason: failureReason,

      isAadhaarLinked:
        address.aadhaar_linked ?? null,
    },

    update: {
      panLastFour: normalizedPan.slice(-4),

      panName: panName,

      isPanNameMatched,

      panStatus: verificationStatus,

      panVerifiedAt: verifiedAt,

      panReferenceId,

      panProvider: "GRIDLINES",

      panFailureReason: failureReason,

      isAadhaarLinked:
        address.aadhaar_linked ?? null,
    },
    select: {
      id: true,
      businessId: true,

      panName: true,
      panLastFour: true,
      isPanNameMatched: true,

      panStatus: true,
      panVerifiedAt: true,

      panProvider: true,
      panReferenceId: true,
      panFailureReason: true,
    },
  });

  /* ------------------------------------------------------------------------ */
  /*                           11. FINAL MESSAGE                              */
  /* ------------------------------------------------------------------------ */

  const message = isPanNameMatched
    ? "PAN verified successfully. Name matched."
    : "PAN is valid, but the name does not match the registered partner name.";

  /* ------------------------------------------------------------------------ */
  /*                           12. RETURN RESPONSE                            */
  /* ------------------------------------------------------------------------ */

  return {
    isVerified: isPanNameMatched,

    verificationStatus,

    isSaved: true,

    message,

    businessId: business.id,

    verificationId: savedVerification.id,

    // TOP-LEVEL NAME DETAILS
    panName,
    partnerName,

    isPanNameMatched,

    nameMatchMessage,

    panDetails: {
      panNumber: normalizedPan,

      documentType: panData.document_type ?? null,
      documentId: panData.document_id ?? null,

      fullName: panName,

      firstName: panData.first_name ?? null,
      middleName: panData.middle_name ?? null,
      lastName: panData.last_name ?? null,

      category: panData.category ?? null,
      dateOfBirth: panData.date_of_birth ?? null,

      gender: address.gender ?? null,

      maskedAadhaarNumber:
        panData.masked_aadhaar_number ?? null,

      isAadhaarLinked:
        address.aadhaar_linked ?? null,

      taxpayerProfile:
        panData.taxpayer_profile ?? null,

      isPanNameMatched,

      expectedName: partnerName,

      address: {
        line1: address.line_1 ?? null,
        line2: address.line_2 ?? null,
        street: address.street ?? null,
        city: address.city ?? null,
        line5: address.line_5 ?? null,
        state: address.state ?? null,
        pincode: address.pincode ?? null,
        email: address.email ?? null,
        phone: address.phone ?? null,
      },
    },

    savedVerification,
  };
};


const hashState = (state: string) =>
  createHash("sha256").update(state).digest("hex");

const gridlinesClient = axios.create({
  baseURL:
    process.env.GRIDLINES_BASE_URL ||
    "https://api.gridlines.io",

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

const getPartnerBusiness = async (
  partnerId: string,
  businessId: string,
) => {
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
    throw new PartnerGovernmentIdError(
      403,
      "Partner account is not active",
    );
  }

  if (!business.partner.fullName?.trim()) {
    throw new PartnerGovernmentIdError(
      400,
      "Partner full name is required",
    );
  }

  return business;
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
    throw new PartnerGovernmentIdError(
      400,
      "Verification consent is required",
    );
  }

  const business = await getPartnerBusiness(
    partnerId,
    businessId,
  );

  if (!business.partner.isPhoneVerified) {
    throw new PartnerGovernmentIdError(
      403,
      "Partner phone number must be verified",
    );
  }

  const mobileNumber = normalizeIndianMobile(
    business.partner.phoneNumber,
  );

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

  if (
    existing?.aadhaarStatus ===
    PartnerVerificationStatus.VERIFIED
  ) {
    throw new PartnerGovernmentIdError(
      409,
      "Aadhaar is already verified",
    );
  }

  if (
    existing?.aadhaarStatus ===
    PartnerVerificationStatus.LOCKED
  ) {
    throw new PartnerGovernmentIdError(
      403,
      "Aadhaar verification is locked",
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                      CHECK ACTIVE ATTEMPT                                */
  /* ------------------------------------------------------------------------ */

  const now = new Date();

  const activeAttempt =
    await prisma.partnerGovernmentIdAttempt.findFirst({
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
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
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

  const callbackBase =
    process.env.GRIDLINES_PARTNER_CALLBACK_URL;

  if (!callbackBase) {
    throw new Error(
      "GRIDLINES_PARTNER_CALLBACK_URL is missing",
    );
  }

  const callbackUrl = new URL(callbackBase);

  callbackUrl.searchParams.set(
    "state",
    callbackState,
  );

  const expiresAt = new Date(
    Date.now() + 15 * 60 * 1000,
  );

  /* ------------------------------------------------------------------------ */
  /*                          CREATE ATTEMPT                                  */
  /* ------------------------------------------------------------------------ */

  const attempt =
    await prisma.partnerGovernmentIdAttempt.create({
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
        providerRequestId:
          result.request_id ?? null,
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
      authorizationUrl:
        result.data.authorization_url,
      expiresAt,
    };
  } catch (error: unknown) {
    const providerError = axios.isAxiosError(error)
      ? error.response?.data
      : null;

    const failureReason =
      providerError?.error?.code ??
      (error instanceof Error
        ? error.message
        : "DIGILOCKER_INIT_FAILED");

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