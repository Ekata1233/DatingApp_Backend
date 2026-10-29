import {
  Prisma,
  VerificationStatus,
  VerificationType,
} from "@prisma/client";

import { prisma } from "../../../prisma/prismaClient";
import { recalculateTrustScore } from "../trust-score/trust-score.service";

export const resetFaceVerification = async (
  userId: string,
  tx: Prisma.TransactionClient,
) => {
  // Reset face verification
  await tx.userVerification.updateMany({
    where: {
      userId,
      type: VerificationType.FACE_VERIFICATION,
    },
    data: {
      status: VerificationStatus.NOT_STARTED,
      points: 0,
      startedAt: null,
      verifiedAt: null,
      expiresAt: null,
      rejectionReason: null,
      providerRef: null,
      metadata: Prisma.DbNull,
    },
  });

  // Recalculate User.trust_score
  const trustScore = await recalculateTrustScore(
    userId,
    tx,
  );

  return trustScore;
};