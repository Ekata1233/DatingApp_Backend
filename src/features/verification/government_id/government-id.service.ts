import { randomBytes, randomUUID, createHash } from "crypto";

import {
  GovernmentIdType,
  GovernmentIdAttemptStatus,
  VerificationStatus,
  VerificationType,
} from "@prisma/client";

import { prisma } from "../../../prisma/prismaClient";
import { gridlinesClient } from "../../../utils/gridlines.client";
import { deleteGovernmentIdPhoto, fetchAndVerifyGovernmentDocument } from "./government-id.provider";
import axios from "axios";
import { uploadGovernmentIdPhoto } from "./government-id.storage";
import { getVerifiedGovernmentDocument, validateGovernmentIdentity } from "./government-id.helper";


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

  // Validate and normalize mobile number

  const rawMobile = user.phone_number?.trim();

  if (!rawMobile) {
    throw new Error("USER_MOBILE_NUMBER_MISSING");
  }

  // Remove spaces, hyphens and parentheses
  let mobileNumber = rawMobile.replace(/[\s()-]/g, "");

  // Remove Indian country code if present
  if (mobileNumber.startsWith("+91")) {
    mobileNumber = mobileNumber.slice(3);
  } else if (
    mobileNumber.startsWith("91") &&
    mobileNumber.length === 12
  ) {
    mobileNumber = mobileNumber.slice(2);
  }

  // Validate Indian mobile number
  if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
    throw new Error("INVALID_MOBILE_NUMBER");
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
    const requestBody = {
      redirect_uri: callbackUrl.toString(),

      mobile_number: mobileNumber,
      check_account_linked: "true",

      sign_up_preference: "PIN",

      consent: "Y",
    };

    console.log(
      "GRIDLINES INIT REQUEST:",
      JSON.stringify(
        {
          url: "/digilocker/init",
          referenceId,
          redirectUri: requestBody.redirect_uri,
          checkAccountLinked: requestBody.check_account_linked,
          signUpPreference: requestBody.sign_up_preference,
          consent: requestBody.consent,
          hasMobileNumber: Boolean(requestBody.mobile_number),
        },
        null,
        2
      )
    );

    const response = await gridlinesClient.post(
      "/digilocker/init",
      requestBody,
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

  } catch (error: unknown) {

    // -----------------------------------------
    // 1. Extract Gridlines API error
    // -----------------------------------------

    let failureReason = "INIT_FAILED";

    if (axios.isAxiosError(error)) {

      const providerError = error.response?.data;

      console.error(
        "GRIDLINES DIGILOCKER INIT ERROR:",
        JSON.stringify(
          {
            httpStatus: error.response?.status,

            requestId:
              providerError?.request_id,

            transactionId:
              providerError?.transaction_id,

            referenceId:
              providerError?.reference_id,

            errorCode:
              providerError?.error?.code,

            errorMessage:
              providerError?.error?.message,

            metadata:
              providerError?.error?.metadata,
          },
          null,
          2
        )
      );

      failureReason =
        providerError?.error?.code ||
        "GRIDLINES_INIT_FAILED";

    } else {

      console.error(
        "Government ID Init Error:",
        error instanceof Error
          ? error.message
          : "Unknown error"
      );
    }

    // -----------------------------------------
    // 2. Mark verification attempt as failed
    // -----------------------------------------

    await prisma.governmentIdAttempt.update({
      where: {
        id: attempt.id,
      },
      data: {
        status: GovernmentIdAttemptStatus.FAILED,

        failureReason,
      },
    });

    // -----------------------------------------
    // 3. Update verification status
    // -----------------------------------------

    await prisma.userVerification.updateMany({
      where: {
        id: verification.id,

        providerRef: null,

        status: VerificationStatus.IN_PROGRESS,
      },
      data: {
        status: VerificationStatus.REJECTED,

        rejectionReason: failureReason,
      },
    });

    // -----------------------------------------
    // 4. Forward error to controller
    // -----------------------------------------

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
  // 1. Find the attempt and its verification
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
    throw new Error(
      "VERIFICATION_ATTEMPT_NOT_FOUND"
    );
  }

  // 2. Idempotent success
  if (
    attempt.status ===
    GovernmentIdAttemptStatus.VERIFIED &&
    attempt.verification.status ===
    VerificationStatus.VERIFIED
  ) {
    return {
      verificationId: attempt.verificationId,
      documentType: attempt.documentType,
      status: "VERIFIED",
      points: attempt.verification.points,
    };
  }

  // 3. Validate current attempt
  if (
    attempt.status !==
    GovernmentIdAttemptStatus.AUTHORIZED
  ) {
    throw new Error(
      "DIGILOCKER_AUTHORIZATION_REQUIRED"
    );
  }

  if (
    attempt.expiresAt &&
    attempt.expiresAt <= new Date()
  ) {
    throw new Error(
      "VERIFICATION_ATTEMPT_EXPIRED"
    );
  }

  if (!attempt.transactionId) {
    throw new Error(
      "TRANSACTION_ID_MISSING"
    );
  }

  if (
    attempt.verification.userId !== userId ||
    attempt.verification.type !==
    VerificationType.GOVERNMENT_ID ||
    attempt.verification.providerRef !==
    attempt.transactionId ||
    attempt.verification.status !==
    VerificationStatus.IN_PROGRESS
  ) {
    throw new Error(
      "VERIFICATION_ATTEMPT_MISMATCH"
    );
  }

  // 4. Fetch the registered user's identity
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      full_name: true,
      birth_date: true,
    },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  // 5. Retrieve and normalize provider document
  const document =
    await getVerifiedGovernmentDocument({
      transactionId: attempt.transactionId,
      referenceId: attempt.referenceId,
      documentType: attempt.documentType,
    });

  // 6. Validate identity and minimum age
  validateGovernmentIdentity(
    document,
    user,
    attempt.documentType
  );

  // 7. Require a portrait if your verification
  // workflow depends on Government ID photo matching.
  const portrait = document.portraitBuffer;

  if (
    !portrait ||
    !Buffer.isBuffer(portrait) ||
    portrait.length === 0
  ) {
    throw new Error(
      "GOVERNMENT_ID_PORTRAIT_NOT_AVAILABLE"
    );
  }

  // 8. Upload portrait to private storage
  const photoKey =
    await uploadGovernmentIdPhoto(
      userId,
      portrait
    );

  try {
    // 9. Atomically finalize verification
    return await prisma.$transaction(
      async (tx) => {
        const now = new Date();

        // Claim the authorized attempt.
        // Only one concurrent completion can
        // transition this attempt to VERIFIED.
        const updatedAttempt =
          await tx.governmentIdAttempt.updateMany({
            where: {
              id: attempt.id,
              userId,
              status:
                GovernmentIdAttemptStatus.AUTHORIZED,
              transactionId: attempt.transactionId,
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: now } },
              ],
            },
            data: {
              status:
                GovernmentIdAttemptStatus.VERIFIED,
              completedAt: now,
              failureReason: null,
            },
          });

        if (updatedAttempt.count !== 1) {
          throw new Error(
            "VERIFICATION_ATTEMPT_STATE_CHANGED"
          );
        }

        const updatedVerification =
          await tx.userVerification.updateMany({
            where: {
              id: attempt.verificationId,
              userId,
              type:
                VerificationType.GOVERNMENT_ID,
              status:
                VerificationStatus.IN_PROGRESS,
              providerRef:
                attempt.transactionId,
            },
            data: {
              status:
                VerificationStatus.VERIFIED,

              governmentIdType:
                attempt.documentType,

              governmentIdPhotoKey:
                photoKey,

              points: 10,

              verifiedAt: now,

              rejectionReason: null,
            },
          });

        if (updatedVerification.count !== 1) {
          throw new Error(
            "VERIFICATION_STATE_CHANGED"
          );
        }

        return {
          verificationId:
            attempt.verificationId,

          attemptId: attempt.id,

          documentType:
            attempt.documentType,

          status: "VERIFIED",

          points: 10,
        };
      }
    );

  } catch (error) {
    // Database update failed.
    // Remove the newly uploaded portrait.
    try {
      await deleteGovernmentIdPhoto(photoKey);
    } catch (cleanupError) {
      console.error(
        "Government ID portrait cleanup failed",
        cleanupError
      );
    }

    throw error;
  }
};

export const fetchGovernmentEAadhaar = async (
  transactionId: string,
  referenceId: string
) => {
  try {
    const response = await gridlinesClient.get(
      "/digilocker/eaadhaar",
      {
        params: {
          json: true,
        },

        headers: {
          "X-Transaction-ID": transactionId,
          "X-Reference-ID": referenceId,
        },
      }
    );

    const result = response.data;

    const responseCode = String(
      result?.data?.code ?? ""
    );

    // Successful E-Aadhaar retrieval
    if (responseCode === "1011") {
      const aadhaar =
        result?.data?.eaadhaar;

      if (
        !aadhaar ||
        typeof aadhaar !== "object" ||
        Array.isArray(aadhaar)
      ) {
        throw new Error(
          "INVALID_EAADHAAR_RESPONSE"
        );
      }

      return aadhaar;
    }

    // Aadhaar not linked
    if (responseCode === "1009") {
      throw new Error(
        "AADHAAR_NOT_LINKED"
      );
    }

    // Aadhaar unavailable
    if (responseCode === "1010") {
      throw new Error(
        "AADHAAR_NOT_AVAILABLE"
      );
    }

    // Session expired
    if (responseCode === "1001") {
      throw new Error(
        "DIGILOCKER_SESSION_EXPIRED"
      );
    }

    // User consent unavailable
    if (responseCode === "1018") {
      throw new Error(
        "AADHAAR_CONSENT_NOT_AVAILABLE"
      );
    }

    throw new Error(
      "EAADHAAR_FETCH_FAILED"
    );

  } catch (error: unknown) {

    if (axios.isAxiosError(error)) {
      console.error(
        "GRIDLINES EAADHAAR ERROR:",
        {
          status: error.response?.status,
          code:
            error.response?.data?.error?.code,
          message:
            error.response?.data?.error?.message,
        }
      );
    }

    throw error;
  }
};

export const fetchGovernmentIssuedFile = async (
  transactionId: string,
  referenceId: string,
  fileUri: string
) => {
  const response = await gridlinesClient.post(
    "/digilocker/issued-file",
    {
      file_uri: fileUri,
      format: "JSON",
    },
    {
      headers: {
        "X-Transaction-ID": transactionId,
        "X-Reference-ID": referenceId,
      },
    }
  );

  const result = response.data;

  const code = String(
    result?.data?.code ?? ""
  );

  if (code === "1007") {
    throw new Error(
      "GOVERNMENT_DOCUMENT_NOT_FOUND"
    );
  }

  if (code === "1001") {
    throw new Error(
      "DIGILOCKER_SESSION_EXPIRED"
    );
  }

  if (code === "1017") {
    throw new Error(
      "DOCUMENT_CONSENT_NOT_AVAILABLE"
    );
  }

  if (code !== "1008") {
    throw new Error(
      "GOVERNMENT_DOCUMENT_FETCH_FAILED"
    );
  }

  const document =
    result?.data?.document;

  if (
    !document ||
    typeof document !== "object" ||
    Array.isArray(document)
  ) {
    throw new Error(
      "INVALID_GOVERNMENT_DOCUMENT_RESPONSE"
    );
  }

  return document;
};