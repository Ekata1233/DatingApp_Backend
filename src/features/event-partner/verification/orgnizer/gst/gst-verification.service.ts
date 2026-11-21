
import { randomUUID } from "crypto";



import type {
  VerifyGstInput,
  GstVerificationResult,
} from "./gst-verification.types";

// IMPORTANT: Replace this with your existing Prisma client import.
import { prisma } from "../../../../../prisma/prismaClient";
import { requestLpFintechGstVerification } from "../../../../../lpfintech/lpfintech-gst.client";
import { LpFintechError } from "../../../../../lpfintech/lpfintech.errors";


export class GstVerificationError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "GstVerificationError";
  }
}

const clean = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  return value.trim() || null;
};

const gstRegex =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export const verifyEventPartnerGstService = async ({
  partnerId,
  businessId,
  gstNumber,
}: VerifyGstInput): Promise<GstVerificationResult> => {
  const normalizedGstin = gstNumber.trim().toUpperCase();

  // Step 1: Validate GSTIN format
  if (!gstRegex.test(normalizedGstin)) {
    throw new GstVerificationError(
      400,
      "Invalid GST number format"
    );
  }

  // Step 2: Verify organizer owns the business
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
      legalName: true,
      tradeName: true,
    },
  });

  if (!business) {
    throw new GstVerificationError(
      404,
      "Business not found or unauthorized"
    );
  }

  // Step 3: Unique transaction ID
  const clientTransactionId = `gst_${randomUUID()}`;

  // Step 4: Call LP Fintech
  let response;

  try {
    response = await requestLpFintechGstVerification(
      normalizedGstin,
      clientTransactionId
    );
  } catch (error: unknown) {
    if (error instanceof LpFintechError) {
      throw new GstVerificationError(
        error.statusCode,
        error.message
      );
    }

    throw error;
  }

  // Step 5: Check provider success response
  const code = String(response.code ?? "");
  const status = response.status?.toUpperCase();
  const innerStatus = response.data?.status?.toUpperCase();

  if (
    code !== "200" ||
    status !== "SUCCESS" ||
    innerStatus !== "SUCCESS"
  ) {
    throw new GstVerificationError(
      502,
      response.message ||
        "GST verification failed at LP Fintech"
    );
  }

  const details = response.data?.details;
  const taxpayer = details?.taxpayerDetails;

  if (!taxpayer) {
    throw new GstVerificationError(
      502,
      "Taxpayer details not returned"
    );
  }

  // Step 6: Confirm provider returned the requested GSTIN
  const returnedGstin = clean(taxpayer.gstin);

  if (
    !returnedGstin ||
    returnedGstin.toUpperCase() !== normalizedGstin
  ) {
    throw new GstVerificationError(
      502,
      "GSTIN mismatch in provider response"
    );
  }

  // Step 7: Check registration status
  const gstStatus = clean(taxpayer.sts);
  const isActive =
    gstStatus?.toUpperCase() === "ACTIVE";

  // Step 8: Format response
  return {
    verified: isActive,
    verificationMessage: isActive
      ? "GST verification completed successfully"
      : "GST details fetched, but registration is not active",

    businessId: business.id,
    gstNumber: normalizedGstin,
    gstStatus,

    gstDetails: {
      legalName: clean(taxpayer.lgnm),
      tradeName: clean(taxpayer.tradeNam),
      constitution: clean(taxpayer.ctb),
      registrationDate: clean(taxpayer.rgdt),
      cancellationDate: clean(taxpayer.cxdt),
      taxpayerType: clean(taxpayer.dty),

      contact: taxpayer.contacted ?? null,

      principalAddress:
        clean(details?.business_places?.pradr?.adr),

      additionalPlaces:
        details?.business_places?.adadr ?? [],

      taxpayerReturnDetails:
        details?.taxpayerReturnDetails ?? null,

      goodsAndServices:
        details?.goods_service ?? null,
    },

    provider: {
      name: "LPFINTECH",
      clientTransactionId:
        response.data?.clientTransactionId ??
        clientTransactionId,
      gatewayId: response.data?.gatewayId ?? null,
    },
  };
};
