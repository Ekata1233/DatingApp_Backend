
import axios from "axios";
import { prisma } from "../../../../../prisma/prismaClient";

/* -------------------------------------------------------------------------- */
/*                                  TYPES                                     */
/* -------------------------------------------------------------------------- */

export interface VerifyPanInput {
  partnerId: string;
  businessId: string;
  panNumber: string;
  consent: boolean;
}

interface GridlinesPanAddress {
  line_1?: string | null;
  line_2?: string | null;
  street?: string | null;
  city?: string | null;
  line_5?: string | null;
  state?: string | null;
  pincode?: string | null;
  email?: string | null;
  phone?: string | null;
  gender?: string | null;
  aadhaar_linked?: boolean | null;
}

interface GridlinesPanData {
  document_type?: string;
  document_id?: string;

  name?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;

  category?: string | null;
  date_of_birth?: string | null;

  masked_aadhaar_number?: string | null;
  taxpayer_profile?: boolean | null;

  address_data?: GridlinesPanAddress | null;
}

interface GridlinesPanPayload {
  code?: string;
  message?: string;
  pan_data?: GridlinesPanData;
}

interface GridlinesPanResponse extends GridlinesPanPayload {
  data?: GridlinesPanPayload;
}

/* -------------------------------------------------------------------------- */
/*                              CUSTOM ERROR                                  */
/* -------------------------------------------------------------------------- */

export class PanVerificationError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "PanVerificationError";
  }
}

/* -------------------------------------------------------------------------- */
/*                            NORMALIZE NAME                                  */
/* -------------------------------------------------------------------------- */

const normalizeName = (name: string): string => {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .replace(/\s+/g, " ");
};

/* -------------------------------------------------------------------------- */
/*                     FETCH PAN DETAILS - NO DATABASE SAVE                   */
/* -------------------------------------------------------------------------- */

export const verifyEventPartnerPanService = async ({
  partnerId,
  businessId,
  panNumber,
  consent,
}: VerifyPanInput) => {
  /* ------------------------------------------------------------------------ */
  /*                          1. VALIDATE INPUT                               */
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
  /*                      2. VALIDATE BUSINESS OWNERSHIP                      */
  /* ------------------------------------------------------------------------ */

  const business = await prisma.businessDetails.findFirst({
    where: {
      id: businessId,
      partnerId,
    },
    select: {
      id: true,
      partnerId: true,
      representativeName: true,
      legalName: true,
      tradeName: true,

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

  // No "already verified" check here.
  // This API only fetches details and can be called again.

  /* ------------------------------------------------------------------------ */
  /*                       3. GRIDLINES CONFIGURATION                         */
  /* ------------------------------------------------------------------------ */

  const apiKey = process.env.GRIDLINES_API_KEY?.trim();

  const apiUrl =
    process.env.GRIDLINES_PAN_URL ||
    "https://api.gridlines.io/pan-api/fetch-detailed";

  if (!apiKey) {
    throw new Error("GRIDLINES_API_KEY is missing");
  }

  /* ------------------------------------------------------------------------ */
  /*                           4. CALL GRIDLINES                              */
  /* ------------------------------------------------------------------------ */

  let panData: GridlinesPanData;

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
    /*                       5. VALIDATE PAN RESPONSE                         */
    /* ---------------------------------------------------------------------- */

    if (
      !verifiedPan ||
      verifiedPan.document_type?.toUpperCase() !== "PAN" ||
      verifiedPan.document_id?.toUpperCase() !== normalizedPan ||
      providerData.message?.trim().toLowerCase() !== "valid pan."
    ) {
      throw new PanVerificationError(
        422,
        "PAN verification was not successful",
      );
    }

    panData = verifiedPan;
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
  /*                         6. PREPARE PAN DETAILS                           */
  /* ------------------------------------------------------------------------ */

  const panName = panData.name?.trim() || null;

  // For personal PAN, compare against representative or partner name.
  // For business PAN, compare against business legal/trade name.
  const isIndividualPan =
    panData.category?.toUpperCase() === "P";

  const expectedName = isIndividualPan
    ? business.representativeName ||
      business.partner.fullName
    : business.legalName ||
      business.tradeName;

  const isPanNameMatched = Boolean(
    panName &&
    expectedName &&
    normalizeName(panName) === normalizeName(expectedName),
  );

  const address = panData.address_data ?? {};

  /* ------------------------------------------------------------------------ */
  /*                     7. RETURN DETAILS - NO DATABASE SAVE                 */
  /* ------------------------------------------------------------------------ */

  return {
    isVerified: true,
    verificationStatus: "VERIFIED",

    isSaved: false,

    message: "PAN details fetched successfully",

    businessId: business.id,

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

      expectedName: expectedName ?? null,

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
  };
};
