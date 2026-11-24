import jwt from "jsonwebtoken";
import { createHmac } from "node:crypto";
import type { GstVerificationResult } from "./gst-verification.types";

type GstVerificationProof = {
  partnerId: string;
  businessId: string;
  gstNumber: string;
  gstStatus: string | null;
  verifiedAt: string;
  gstDetails: Pick<
    GstVerificationResult["gstDetails"],
    "legalName" | "tradeName" | "constitution" | "registrationDate" | "principalAddress"
  >;
};

const audience = "event-partner:business-gst:save";
const signingKey = () => {
  const secret = process.env.PARTNER_JWT_SECRET;
  if (!secret) throw new Error("PARTNER_JWT_SECRET is not configured");
  return createHmac("sha256", secret).update(audience).digest();
};

export const signGstVerification = (partnerId: string, result: GstVerificationResult) => {
  if (!result.verified) return undefined;
  const { businessId, gstNumber, gstStatus } = result;
  const { legalName, tradeName, constitution, registrationDate, principalAddress } = result.gstDetails;
  const proof: GstVerificationProof = {
    partnerId,
    businessId,
    gstNumber,
    gstStatus,
    verifiedAt: new Date().toISOString(),
    gstDetails: { legalName, tradeName, constitution, registrationDate, principalAddress },
  };
  return jwt.sign(proof, signingKey(), { algorithm: "HS256", audience, expiresIn: "10m" });
};

export const readGstVerification = (verificationId: string) => {
  try {
    return jwt.verify(verificationId, signingKey(), {
      algorithms: ["HS256"],
      audience,
    }) as GstVerificationProof;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) return null;
    throw error;
  }
};
