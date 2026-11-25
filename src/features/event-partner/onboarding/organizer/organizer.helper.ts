import { createHash } from "crypto";
import { PartnerGovernmentIdAttemptStatus as AttemptStatus } from "@prisma/client";
import { prisma } from "../../../../prisma/prismaClient";
import { PartnerGovernmentIdError } from "./organizer.types";

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
/*                               NORMALIZE NAME                               */
/* -------------------------------------------------------------------------- */

export const normalizeName = (name: string): string => {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .replace(/\s+/g, " ");
};


/* -------------------------------------------------------------------------- */
/*                     DIGILOCKER CALLBACK SERVICE                            */
/* -------------------------------------------------------------------------- */

export const authorizePartnerGovernmentIdService = async (
  state: string,
  transactionId: string,
  code: string,
  forHost = false,
) => {
  if (!state || !transactionId) {
    throw new PartnerGovernmentIdError(
      400,
      "Missing DigiLocker callback parameters",
    );
  }

  const callbackStateHash = hashState(state);

  const attempt =
    await prisma.partnerGovernmentIdAttempt.findUnique({
      where: {
        callbackStateHash,
      },
    });

  if (!attempt || (attempt.hostId !== null) !== forHost) {
    throw new PartnerGovernmentIdError(
      404,
      "Verification attempt not found",
    );
  }

  if (attempt.transactionId !== transactionId) {
    throw new PartnerGovernmentIdError(
      400,
      "DigiLocker transaction mismatch",
    );
  }

  if (
    attempt.expiresAt &&
    attempt.expiresAt <= new Date()
  ) {
    throw new PartnerGovernmentIdError(
      410,
      "Verification attempt expired",
    );
  }

  if (
    attempt.status === AttemptStatus.AUTHORIZED ||
    attempt.status === AttemptStatus.VERIFIED ||
    attempt.status === AttemptStatus.REJECTED
  ) {
    return {
      attemptId: attempt.id,
      businessId: attempt.businessId,
      status: attempt.status,
    };
  }

  if (attempt.status !== AttemptStatus.PENDING) {
    throw new PartnerGovernmentIdError(
      409,
      "Invalid verification attempt status",
    );
  }

  if (code !== "1003" && code !== "1004") {
    throw new PartnerGovernmentIdError(400, "Invalid DigiLocker authorization code");
  }

  const now = new Date();
  const denied = code === "1003";
  const status = denied ? AttemptStatus.REJECTED : AttemptStatus.AUTHORIZED;
  const updated =
    await prisma.partnerGovernmentIdAttempt.updateMany({
      where: {
        id: attempt.id,
        status: AttemptStatus.PENDING,
        transactionId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      data: {
        status,
        ...(denied
          ? { completedAt: now, failureReason: "ACCESS_DENIED" }
          : { authorizedAt: now }),
      },
    });

  if (updated.count !== 1) {
    throw new PartnerGovernmentIdError(
      409,
      "Verification attempt state changed",
    );
  }

  return {
    attemptId: attempt.id,
    businessId: attempt.businessId,
    status,
  };
};



export const hashState = (state: string) =>
  createHash("sha256").update(state).digest("hex");


