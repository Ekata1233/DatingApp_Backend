import axios from "axios";
import { randomUUID } from "crypto";

import {
  BusinessConstitution,
} from "@prisma/client";

import { prisma } from "../../../../../prisma/prismaClient";

import {
  ApiBankingGstResponse,
  VerifyGstInput,
} from "./gst-verification.types";

/* -------------------------------------------------------------------------- */
/*                                  ERROR                                     */
/* -------------------------------------------------------------------------- */

export class GstVerificationError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "GstVerificationError";
  }
}

/* -------------------------------------------------------------------------- */
/*                         MAP BUSINESS CONSTITUTION                          */
/* -------------------------------------------------------------------------- */

const mapBusinessConstitution = (
  value?: string,
): BusinessConstitution | null => {
  if (!value) return null;

  const constitution = value.trim().toLowerCase();

  switch (constitution) {
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
/*                              PARSE GST DATE                                */
/* -------------------------------------------------------------------------- */

const parseGstDate = (value?: string): Date | null => {
  if (!value || value.trim().toUpperCase() === "NA") {
    return null;
  }

  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);

  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(
    Date.UTC(year, month - 1, day),
  );

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
};

/* -------------------------------------------------------------------------- */
/*                              CLEAN STRING                                  */
/* -------------------------------------------------------------------------- */

const cleanString = (
  value?: string,
): string | null => {
  if (
    !value ||
    value.trim().toUpperCase() === "NA"
  ) {
    return null;
  }

  return value.trim();
};

/* -------------------------------------------------------------------------- */
/*                             EXTRACT PINCODE                                */
/* -------------------------------------------------------------------------- */

const extractPincode = (
  address?: string,
): string | null => {
  if (!address) return null;

  const match = address.match(
    /\b[1-9][0-9]{5}\b/,
  );

  return match?.[0] ?? null;
};

/* -------------------------------------------------------------------------- */
/*                       VERIFY EVENT PARTNER GST                             */
/* -------------------------------------------------------------------------- */

export const verifyEventPartnerGstService = async ({
  partnerId,
  businessId,
  gstNumber,
}: VerifyGstInput) => {

  /* ------------------------------------------------------------------------ */
  /*                          1. VALIDATE GST NUMBER                          */
  /* ------------------------------------------------------------------------ */

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
      "Invalid GST number format",
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                        2. VALIDATE BUSINESS OWNER                        */
  /* ------------------------------------------------------------------------ */

  // READ ONLY - NO DATABASE UPDATE

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
      "Business not found or access denied",
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                       3. LP FINTECH CONFIGURATION                        */
  /* ------------------------------------------------------------------------ */

  const baseUrl =
    process.env.LPFINTECH_BASE_URL?.trim();

  const apiPath =
    process.env.LPFINTECH_GST_ADVANCED_PATH ||
    "/apibanking/api/v1/gstinAuthenticationAdvanced";

  const authorization =
    process.env.LPFINTECH_AUTHORIZATION?.trim() ||
    process.env.LPFINTECH_API_KEY?.trim();

  if (!baseUrl) {
    throw new Error(
      "LPFINTECH_BASE_URL is missing",
    );
  }

  if (!authorization) {
    throw new Error(
      "LP Fintech authorization is missing",
    );
  }

  const clientTransactionId =
    `gst_${randomUUID()}`;

  const url =
    `${baseUrl.replace(/\/$/, "")}/${apiPath.replace(/^\//, "")}`;

  /* ------------------------------------------------------------------------ */
  /*                       4. CALL GST VERIFICATION API                       */
  /* ------------------------------------------------------------------------ */

  let providerResult: ApiBankingGstResponse;

  try {
    const response =
      await axios.post<ApiBankingGstResponse>(
        url,
        {
          clientTransactionId,
          gstin: normalizedGst,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: authorization,
          },

          timeout: 30000,
        },
      );

    providerResult = response.data;

  } catch (error: unknown) {

    if (axios.isAxiosError(error)) {

      const providerError =
        error.response?.data as
          | {
              code?: string;
              message?: string;
              status?: string;
            }
          | undefined;

      console.error(
        "LP FINTECH GST ERROR:",
        {
          httpStatus: error.response?.status,
          providerCode: providerError?.code,
          providerMessage: providerError?.message,
        },
      );

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        throw new GstVerificationError(
          502,
          "LP Fintech authentication failed",
        );
      }

      if (error.code === "ECONNABORTED") {
        throw new GstVerificationError(
          504,
          "GST verification request timed out",
        );
      }

      throw new GstVerificationError(
        502,
        "GST verification provider request failed",
      );
    }

    throw error;
  }

  /* ------------------------------------------------------------------------ */
  /*                        5. VALIDATE API RESPONSE                          */
  /* ------------------------------------------------------------------------ */

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
        "GST verification failed",
    );
  }

  const details = providerData.details;

  const taxpayer = details?.taxpayerDetails;

  if (!taxpayer) {
    throw new GstVerificationError(
      422,
      "GST taxpayer details not found",
    );
  }

  if (
    taxpayer.gstin?.trim().toUpperCase() !==
    normalizedGst
  ) {
    throw new GstVerificationError(
      422,
      "GST number mismatch in provider response",
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                       6. EXTRACT GST INFORMATION                         */
  /* ------------------------------------------------------------------------ */

  const registeredAddress =
    details?.business_places?.pradr;

  const gstStatus =
    cleanString(taxpayer.sts);

  const isActive =
    gstStatus?.toLowerCase() === "active";

  const constitution =
    mapBusinessConstitution(taxpayer.ctb);

  const registeredSince =
    parseGstDate(taxpayer.rgdt);

  const cancellationDate =
    parseGstDate(taxpayer.cxdt);

  const address =
    cleanString(registeredAddress?.adr);

  const contact = taxpayer.contacted;

  /* ------------------------------------------------------------------------ */
  /*                       7. RETURN RESPONSE ONLY                            */
  /* ------------------------------------------------------------------------ */

  // NO prisma.create()
  // NO prisma.update()
  // NO prisma.upsert()
  // NO DATABASE SAVE

  return {
    businessId,

    gstNumber: normalizedGst,

    isGstActive: isActive,

    gstVerificationStatus: isActive
      ? "VERIFIED"
      : "FAILED",

    verificationMessage: isActive
      ? "GST verified successfully"
      : `GST details fetched, but registration status is ${gstStatus ?? "unknown"}`,

    verifiedAt: isActive
      ? new Date()
      : null,

    gstDetails: {
      gstin: normalizedGst,

      legalName:
        cleanString(taxpayer.lgnm),

      tradeName:
        cleanString(taxpayer.tradeNam),

      constitution,

      constitutionName:
        cleanString(taxpayer.ctb),

      taxpayerType:
        cleanString(taxpayer.dty),

      registrationDate:
        registeredSince,

      cancellationDate,

      registrationStatus:
        gstStatus,

      address,

      registeredPincode:
        extractPincode(address),

      businessActivities:
        cleanString(registeredAddress?.ntr),

      contact: {
        name:
          cleanString(contact?.name),

        email:
          cleanString(contact?.email),

        mobile:
          contact?.mobNum != null
            ? String(contact.mobNum)
            : null,
      },

      members:
        taxpayer.mbr ?? [],

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