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

  if (!attempt) {
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

  if (attempt.status === AttemptStatus.AUTHORIZED) {
    return {
      attemptId: attempt.id,
      status: "AUTHORIZED",
    };
  }

  if (attempt.status !== AttemptStatus.PENDING) {
    throw new PartnerGovernmentIdError(
      409,
      "Invalid verification attempt status",
    );
  }

  const updated =
    await prisma.partnerGovernmentIdAttempt.updateMany({
      where: {
        id: attempt.id,
        status: AttemptStatus.PENDING,
        transactionId,
      },
      data: {
        status: AttemptStatus.AUTHORIZED,
        authorizedAt: new Date(),
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
    status: "AUTHORIZED",
  };
};



/* -------------------------------------------------------------------------- */
/*                     DIGILOCKER CALLBACK SERVICE                            */
/* -------------------------------------------------------------------------- */


