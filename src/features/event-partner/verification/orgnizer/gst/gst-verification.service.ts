
import axios from "axios";
import { randomUUID } from "crypto";
import { BusinessConstitution } from "@prisma/client";

import { prisma } from "../../../../../prisma/prismaClient";

import {
  VerifyGstInput,
  ApiBankingGstResponse,
} from "./gst-verification.types";

/* -------------------------------------------------------------------------- */
/* ERROR CLASS */
/* -------------------------------------------------------------------------- */

export class GstVerificationError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "GstVerificationError";
  }
}

/* -------------------------------------------------------------------------- */
/* HELPERS */
/* -------------------------------------------------------------------------- */

const cleanString = (
  value: unknown
): string | null => {
  if (typeof value !== "string") return null;

  const result = value.trim();

  if (!result || result.toUpperCase() === "NA") {
    return null;
  }

  return result;
};

const parseGstDate = (value: unknown): Date | null => {
  const text = cleanString(value);

  if (!text) return null;

  const match =
    /^(\d{2})[/-](\d{2})[/-](\d{4})$/.exec(text);

  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  if (
    date.getUTCDate() !== day ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCFullYear() !== year
  ) {
    return null;
  }

  return date;
};

const extractPincode = (
  address: string | null
): string | null => {
  if (!address) return null;

  return address.match(/\b[1-9][0-9]{5}\b/)?.[0] ?? null;
};

const mapBusinessConstitution = (
  value: unknown
): BusinessConstitution | null => {
  const text = cleanString(value)?.toLowerCase();

  if (!text) return null;

  switch (text) {
    case "proprietorship":
    case "sole proprietorship":
      return BusinessConstitution.SOLE_PROPRIETORSHIP;

    case "partnership":
    case "partnership firm":
      return BusinessConstitution.PARTNERSHIP;

    case "limited liability partnership":
    case "llp":
      return BusinessConstitution.LLP;

    case "private limited company":
      return BusinessConstitution.PRIVATE_LIMITED;

    case "public limited company":
      return BusinessConstitution.PUBLIC_LIMITED;

    case "one person company":
      return BusinessConstitution.ONE_PERSON_COMPANY;

    case "hindu undivided family":
      return BusinessConstitution.HUF;

    case "trust":
      return BusinessConstitution.TRUST;

    case "society":
      return BusinessConstitution.SOCIETY;

    default:
      return BusinessConstitution.OTHER;
  }
};

/* -------------------------------------------------------------------------- */
/* LP FINTECH CONFIG */
/* -------------------------------------------------------------------------- */

const getLpFintechConfig = () => {
  const baseUrl =
    process.env.LPFINTECH_BASE_URL?.trim();

  const path =
    process.env.LPFINTECH_GST_ADVANCED_PATH?.trim() ||
    "/apibanking/api/v1/gstinAuthenticationAdvanced";

  const authorization =
    process.env.LPFINTECH_AUTHORIZATION?.trim();

  const rawAccessToken =
    process.env.LPFINTECH_ACCESS_TOKEN?.trim();

  if (!baseUrl) {
    throw new GstVerificationError(
      500,
      "LPFINTECH_BASE_URL is missing"
    );
  }

  if (!authorization) {
    throw new GstVerificationError(
      500,
      "LPFINTECH_AUTHORIZATION is missing"
    );
  }

  if (!rawAccessToken) {
    throw new GstVerificationError(
      500,
      "LPFINTECH_ACCESS_TOKEN is missing"
    );
  }

  const accessToken =
    /^Bearer\s+/i.test(rawAccessToken)
      ? rawAccessToken
      : `Bearer ${rawAccessToken}`;

  const url =
    `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

  return {
    url,
    authorization,
    accessToken,
  };
};

/* -------------------------------------------------------------------------- */
/* VERIFY GST SERVICE */
/* -------------------------------------------------------------------------- */

export const verifyEventPartnerGstService = async ({
  partnerId,
  businessId,
  gstNumber,
}: VerifyGstInput) => {
  // 1. Validate GSTIN

  const normalizedGst = gstNumber
    ?.trim()
    .toUpperCase();

  const gstRegex =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

  if (
    !normalizedGst ||
    !gstRegex.test(normalizedGst)
  ) {
    throw new GstVerificationError(
      400,
      "Invalid GST number format"
    );
  }

  // 2. Validate business ownership

  const business = await prisma.businessDetails.findFirst({
    where: {
      id: businessId,
      partnerId,
      partner: {
        accountStatus: "ACTIVE",
      },
    },
    select: {
      id: true,
    },
  });

  if (!business) {
    throw new GstVerificationError(
      404,
      "Business not found or access denied"
    );
  }

  // 3. Get configuration

  const config = getLpFintechConfig();

  const clientTransactionId =
    `gst_${randomUUID()}`;

  console.log("LP FINTECH GST REQUEST:", {
    url: config.url,
    clientTransactionId,
    authorizationConfigured: true,
    accessTokenConfigured: true,
  });

  // 4. Call provider

  let providerResult: ApiBankingGstResponse;

  try {
    const response =
      await axios.post<ApiBankingGstResponse>(
        config.url,
        {
          clientTransactionId,
          gstin: normalizedGst,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: config.authorization,
            "X-Access-Token": config.accessToken,
          },
          timeout: 30000,
        }
      );

    providerResult = response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const providerError = error.response?.data as
        | {
            code?: string;
            status?: string;
            message?: string;
          }
        | undefined;

      console.error("LP FINTECH GST ERROR:", {
        httpStatus: error.response?.status,
        code: providerError?.code,
        message: providerError?.message,
      });

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        throw new GstVerificationError(
          502,
          "LP Fintech authentication failed. Check provider credentials and access token."
        );
      }

      if (error.code === "ECONNABORTED") {
        throw new GstVerificationError(
          504,
          "LP Fintech GST request timed out"
        );
      }

      throw new GstVerificationError(
        502,
        "LP Fintech GST API request failed"
      );
    }

    throw error;
  }

  // 5. Validate response

  const providerData = providerResult.data;

  if (
    String(providerResult.code) !== "200" ||
    providerResult.status?.toLowerCase() !== "success" ||
    providerData?.status?.toUpperCase() !== "SUCCESS"
  ) {
    throw new GstVerificationError(
      422,
      providerData?.responseMessage ||
        providerResult.message ||
        "GST verification failed"
    );
  }

  const details = providerData.details;
  const taxpayer = details?.taxpayerDetails;

  if (!taxpayer) {
    throw new GstVerificationError(
      502,
      "GST taxpayer details missing in provider response"
    );
  }

  const returnedGstin =
    cleanString(taxpayer.gstin)?.toUpperCase();

  if (returnedGstin !== normalizedGst) {
    throw new GstVerificationError(
      502,
      "GSTIN mismatch in provider response"
    );
  }

  // 6. Extract GST details

  const registeredAddress =
    details?.business_places?.pradr;

  const registrationStatus =
    cleanString(taxpayer.sts);

  const isActive =
    registrationStatus?.toLowerCase() === "active";

  const address =
    cleanString(registeredAddress?.adr);

  const contact = taxpayer.contacted;

  // 7. Return result - no database update

  return {
    businessId,

    gstNumber: normalizedGst,

    isGstActive: isActive,

    gstVerificationStatus: isActive
      ? "VERIFIED"
      : "FAILED",

    verificationMessage: isActive
      ? "GST verified successfully"
      : `GST registration status is ${
          registrationStatus ?? "unknown"
        }`,

    verifiedAt: isActive ? new Date() : null,

    gstDetails: {
      gstin: normalizedGst,

      legalName: cleanString(taxpayer.lgnm),

      tradeName: cleanString(taxpayer.tradeNam),

      constitution:
        mapBusinessConstitution(taxpayer.ctb),

      constitutionName:
        cleanString(taxpayer.ctb),

      taxpayerType:
        cleanString(taxpayer.dty),

      registrationDate:
        parseGstDate(taxpayer.rgdt),

      cancellationDate:
        parseGstDate(taxpayer.cxdt),

      registrationStatus,

      address,

      registeredPincode:
        extractPincode(address),

      businessActivities:
        cleanString(registeredAddress?.ntr),

      contact: {
        name: cleanString(contact?.name),

        email: cleanString(contact?.email),

        mobile:
          contact?.mobNum != null
            ? String(contact.mobNum)
            : null,
      },

      members: taxpayer.mbr ?? [],

      additionalPlaces:
        details?.business_places?.adadr ?? [],

      goodsServices:
        details?.goods_service ?? null,

      filingDetails:
        details?.taxpayerReturnDetails ?? null,
    },

    provider: {
      clientTransactionId:
        providerData.clientTransactionId ??
        clientTransactionId,

      gatewayId:
        providerData.gatewayId ?? null,

      responseMessage:
        providerData.responseMessage ?? null,
    },
  };
};
