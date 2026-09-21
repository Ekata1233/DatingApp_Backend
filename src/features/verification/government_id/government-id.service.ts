import { randomBytes, randomUUID, createHash } from "crypto";

import {
  GovernmentIdType,
  GovernmentIdAttemptStatus,
  VerificationStatus,
  VerificationType,
} from "@prisma/client";

import { prisma } from "../../../prisma/prismaClient";
import { gridlinesClient } from "../../../utils/gridlines.client";
import { fetchAndVerifyGovernmentDocument } from "./government-id.provider";


const hashState = (value: string) =>
  createHash("sha256").update(value).digest("hex");

export const initGovernmentIdService = async (
  userId: string,
  documentType: GovernmentIdType,
  consent: boolean
) => {
  if (consent !== true) {
    throw new Error("CONSENT_REQUIRED");
  }

  // 1. Get registered user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone_number: true,
    },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  // 2. Check current verification
  const existing =
    await prisma.userVerification.findUnique({
      where: {
        userId_type: {
          userId,
          type: VerificationType.GOVERNMENT_ID,
        },
      },
    });

  if (existing?.status === VerificationStatus.VERIFIED) {
    throw new Error("GOVERNMENT_ID_ALREADY_VERIFIED");
  }

  if (existing?.status === VerificationStatus.LOCKED) {
    throw new Error("VERIFICATION_LOCKED");
  }

  // 3. Do not allow another active attempt
  const activeAttempt =
    await prisma.governmentIdAttempt.findFirst({
      where: {
        userId,
        status: {
          in: [
            GovernmentIdAttemptStatus.INITIATING,
            GovernmentIdAttemptStatus.PENDING,
            GovernmentIdAttemptStatus.AUTHORIZED,
          ],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  if (activeAttempt) {
    throw new Error("VERIFICATION_ALREADY_IN_PROGRESS");
  }

  // 4. Create or update verification
  const verification =
    await prisma.userVerification.upsert({
      where: {
        userId_type: {
          userId,
          type: VerificationType.GOVERNMENT_ID,
        },
      },
      create: {
        userId,
        type: VerificationType.GOVERNMENT_ID,
        status: VerificationStatus.IN_PROGRESS,
        points: 0,
        maxPoints: 10,
        governmentIdType: documentType,
        provider: "GRIDLINES",
        startedAt: new Date(),
      },
      update: {
        status: VerificationStatus.IN_PROGRESS,
        points: 0,
        governmentIdType: documentType,
        provider: "GRIDLINES",
        providerRef: null,
        rejectionReason: null,
        startedAt: new Date(),
      },
    });

  // 5. Generate secure identifiers
  const referenceId = randomUUID();

  const callbackState =
    randomBytes(32).toString("hex");

  const callbackStateHash = hashState(callbackState);

  const callbackBase =
    process.env.GRIDLINES_CALLBACK_URL;

  if (!callbackBase) {
    throw new Error("GRIDLINES_CALLBACK_URL_MISSING");
  }

  const callbackUrl = new URL(callbackBase);

  callbackUrl.searchParams.set(
    "state",
    callbackState
  );

  // 6. Create attempt before provider request
  const attempt =
    await prisma.governmentIdAttempt.create({
      data: {
        userId,
        verificationId: verification.id,
        documentType,
        referenceId,
        callbackStateHash,
        consentGivenAt: new Date(),
        status: GovernmentIdAttemptStatus.INITIATING,
      },
    });

  try {
    // 7. Call Gridlines DigiLocker Init
    const response = await gridlinesClient.post(
      "/digilocker/init",
      {
        redirect_uri: callbackUrl.toString(),

        mobile_number:
          user.phone_number || undefined,

        check_account_linked: "true",

        sign_up_preference: "PIN",

        consent: "Y",
      },
      {
        headers: {
          "X-Reference-ID": referenceId,
        },
      }
    );

    const result = response.data;

    if (
      String(result?.data?.code) !== "1000" ||
      !result?.data?.transaction_id ||
      !result?.data?.authorization_url
    ) {
      throw new Error("DIGILOCKER_INIT_FAILED");
    }

    // 8. Save provider transaction
    await prisma.$transaction([
      prisma.governmentIdAttempt.update({
        where: {
          id: attempt.id,
        },
        data: {
          transactionId:
            result.data.transaction_id,

          providerRequestId:
            result.request_id,

          status: GovernmentIdAttemptStatus.PENDING,
        },
      }),

      prisma.userVerification.update({
        where: {
          id: verification.id,
        },
        data: {
          providerRef:
            result.data.transaction_id,
        },
      }),
    ]);

    // 9. Return authorization URL
    return {
      verificationId: verification.id,

      attemptId: attempt.id,

      documentType,

      status: "IN_PROGRESS",

      authorizationUrl:
        result.data.authorization_url,
    };

  } catch (error) {
    await prisma.governmentIdAttempt.update({
      where: {
        id: attempt.id,
      },
      data: {
        status: GovernmentIdAttemptStatus.FAILED,
        failureReason: "INIT_FAILED",
      },
    });

    await prisma.userVerification.updateMany({
      where: {
        id: verification.id,
        providerRef: null,
        status: VerificationStatus.IN_PROGRESS,
      },
      data: {
        status: VerificationStatus.REJECTED,
        rejectionReason: "INIT_FAILED",
      },
    });

    throw error;
  }
};

export const handleGovernmentIdCallback = async (
  transactionId: string,
  state: string,
  code: string
) => {
  const attempt =
    await prisma.governmentIdAttempt.findUnique({
      where: {
        transactionId,
      },
    });

  if (
    !attempt ||
    attempt.callbackStateHash !== hashState(state)
  ) {
    throw new Error("INVALID_KYC_CALLBACK");
  }

  // Do not process completed or superseded attempts.
  if (
    attempt.status !== GovernmentIdAttemptStatus.PENDING
  ) {
    return {
      attemptId: attempt.id,
      status: attempt.status,
    };
  }

  const verification =
    await prisma.userVerification.findUnique({
      where: {
        id: attempt.verificationId,
      },
    });

  if (
    !verification ||
    verification.userId !== attempt.userId ||
    verification.providerRef !== transactionId
  ) {
    throw new Error("VERIFICATION_ATTEMPT_MISMATCH");
  }

  if (code === "1003") {
    await prisma.$transaction([
      prisma.governmentIdAttempt.updateMany({
        where: {
          id: attempt.id,
          status: GovernmentIdAttemptStatus.PENDING,
        },
        data: {
          status: GovernmentIdAttemptStatus.DENIED,
          failureReason: "ACCESS_DENIED",
          completedAt: new Date(),
        },
      }),

      prisma.userVerification.updateMany({
        where: {
          id: verification.id,
          status: VerificationStatus.IN_PROGRESS,
          providerRef: transactionId,
        },
        data: {
          status: VerificationStatus.REJECTED,
          points: 0,
          rejectionReason: "DIGILOCKER_ACCESS_DENIED",
        },
      }),
    ]);

    return {
      attemptId: attempt.id,
      status: "DENIED",
    };
  }

  if (code !== "1004") {
    throw new Error("INVALID_AUTHORIZATION_CODE");
  }

  // Authorization completed, but document verification
  // has not yet been performed.
  const updated =
    await prisma.governmentIdAttempt.updateMany({
      where: {
        id: attempt.id,
        status: GovernmentIdAttemptStatus.PENDING,
      },
      data: {
        status: GovernmentIdAttemptStatus.AUTHORIZED,
        authorizedAt: new Date(),
      },
    });

  return {
    attemptId: attempt.id,
    status:
      updated.count === 1
        ? "AUTHORIZED"
        : "PENDING",
  };
};

export const completeGovernmentIdService = async (
  userId: string,
  attemptId: string
) => {
  // 1. Fetch the user's verification attempt
  const attempt =
    await prisma.governmentIdAttempt.findFirst({
      where: {
        id: attemptId,
        userId,
      },
      include: {
        verification: true,
      },
    });

  if (!attempt) {
    throw new Error("VERIFICATION_ATTEMPT_NOT_FOUND");
  }

  if (
    attempt.status === GovernmentIdAttemptStatus.VERIFIED &&
    attempt.verification.status === VerificationStatus.VERIFIED
  ) {
    return {
      status: "VERIFIED",
      points: attempt.verification.points,
    };
  }

  if (
    attempt.status !==
    GovernmentIdAttemptStatus.AUTHORIZED
  ) {
    throw new Error("DIGILOCKER_AUTHORIZATION_REQUIRED");
  }

  if (!attempt.transactionId) {
    throw new Error("TRANSACTION_ID_MISSING");
  }

  if (
    attempt.verification.providerRef !==
    attempt.transactionId
  ) {
    throw new Error("VERIFICATION_ATTEMPT_MISMATCH");
  }

  // 2. Fetch and verify document using Gridlines
  const document =
    await fetchAndVerifyGovernmentDocument(
      attempt.transactionId,
      attempt.documentType
    );

  // 3. Validate provider result
  if (
    !document.transactionConfirmed ||
    !document.documentAccessConfirmed ||
    !document.isAuthentic ||
    document.documentType !== attempt.documentType ||
    !document.verifiedName ||
    !document.dateOfBirth ||
    Number.isNaN(document.dateOfBirth.getTime())
  ) {
    throw new Error("DOCUMENT_VERIFICATION_FAILED");
  }

  // 4. Check age (18+)
  const today = new Date();

  let age =
    today.getUTCFullYear() -
    document.dateOfBirth.getUTCFullYear();

  const monthDifference =
    today.getUTCMonth() -
    document.dateOfBirth.getUTCMonth();

  if (
    monthDifference < 0 ||
    (
      monthDifference === 0 &&
      today.getUTCDate() <
      document.dateOfBirth.getUTCDate()
    )
  ) {
    age--;
  }

  if (age < 18) {
    throw new Error("USER_BELOW_MINIMUM_AGE");
  }

  // 5. Additional identity matching must be performed
  // here before approval:
  //
  // - Compare the verified document name with the
  //   registered user's name.
  // - Compare date of birth with the registered profile.
  // - Apply your approved mismatch/review policy.
  //
  // Do not automatically approve mismatched identities.

  // 6. Update verification atomically
  const result = await prisma.$transaction(async (tx) => {
    const updated =
      await tx.userVerification.updateMany({
        where: {
          id: attempt.verificationId,
          userId,
          type: VerificationType.GOVERNMENT_ID,
          status: VerificationStatus.IN_PROGRESS,
          providerRef: attempt.transactionId,
        },
        data: {
          status: VerificationStatus.VERIFIED,
          points: 10,
          verifiedAt: new Date(),
          rejectionReason: null,
        },
      });

    if (updated.count !== 1) {
      throw new Error("VERIFICATION_STATE_CHANGED");
    }

    await tx.governmentIdAttempt.update({
      where: {
        id: attempt.id,
      },
      data: {
        status: GovernmentIdAttemptStatus.VERIFIED,
        completedAt: new Date(),
      },
    });

    return {
      verificationId: attempt.verificationId,
      documentType: attempt.documentType,
      status: "VERIFIED",
      points: 10,
    };
  });

  return result;
};