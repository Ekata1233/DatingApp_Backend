import {
  GovernmentIdType,
  HostStep,
  PartnerGovernmentIdAttemptStatus as AttemptStatus,
  PartnerVerificationStatus,
  Prisma,
} from "@prisma/client";
import { randomUUID } from "crypto";
import { prisma } from "../../../../prisma/prismaClient";
import imagekit from "../../../../utils/imagekit";
import {
  getVerifiedGovernmentDocument,
  validateGovernmentIdentity,
} from "../../../verification/government_id/government-id.helper";
import { validateImage } from "../../../verification/government_id/government-id.storage";
import {
  checkOnboardingSelfie,
  createOnboardingGovernmentIdAttempt,
  organizerNamesMatch,
} from "../organizer/organizer.service";
import {
  normalizeIndianMobile,
  PartnerGovernmentIdError,
} from "../organizer/organizer.types";
import {
  type DatabaseClient,
  type HostContext,
  getValidHost,
  validateAcceptedInvitation,
} from "./host-onboarding.helper";
import { HostOnboardingError } from "./host-onboarding.types";

const getHostForVerification = async (db: DatabaseClient, context: HostContext) => {
  const host = await getValidHost(db, context);
  validateAcceptedInvitation(host);
  if (host.onboardingStep === HostStep.PERSONAL_DETAILS) {
    throw new HostOnboardingError(409, "Complete personal details before verifying your identity");
  }
  return host;
};

export const initHostGovernmentId = async (context: HostContext) => {
  const host = await getHostForVerification(prisma, context);
  if (host.verifyId?.aadhaarStatus === PartnerVerificationStatus.VERIFIED) {
    throw new HostOnboardingError(409, "Aadhaar is already verified");
  }

  const { hostId, partnerId, businessId } = context;
  const attempt = await createOnboardingGovernmentIdAttempt(
    partnerId,
    businessId,
    normalizeIndianMobile(host.phoneNumber),
    hostId,
  );
  return { ...attempt, hostId };
};

export const completeHostGovernmentId = async (context: HostContext, attemptId: string) => {
  const { hostId, partnerId, businessId } = context;
  const host = await getHostForVerification(prisma, context);
  const attemptWhere = { id: attemptId, partnerId, businessId, hostId };
  const attempt = await prisma.partnerGovernmentIdAttempt.findUnique({
    where: attemptWhere,
  });

  if (!attempt) {
    throw new PartnerGovernmentIdError(404, "Verification attempt not found");
  }

  const result = {
    businessId,
    hostId,
    attemptId,
    documentType: GovernmentIdType.AADHAAR,
    status: AttemptStatus.VERIFIED,
    message: "Aadhaar verification completed",
  };

  if (attempt.status === AttemptStatus.VERIFIED) {
    return result;
  }

  if (attempt.expiresAt && attempt.expiresAt <= new Date()) {
    throw new PartnerGovernmentIdError(410, "Verification attempt expired");
  }

  if (attempt.status !== AttemptStatus.AUTHORIZED) {
    throw new PartnerGovernmentIdError(409, "DigiLocker authorization is required");
  }

  if (!attempt.transactionId || attempt.documentType !== GovernmentIdType.AADHAAR) {
    throw new PartnerGovernmentIdError(409, "Invalid Aadhaar verification attempt");
  }

  const document = await getVerifiedGovernmentDocument({
    transactionId: attempt.transactionId,
    referenceId: attempt.referenceId,
    documentType: GovernmentIdType.AADHAAR,
  }).catch(() => {
    throw new PartnerGovernmentIdError(502, "Unable to retrieve Aadhaar from DigiLocker");
  });

  let identity: ReturnType<typeof validateGovernmentIdentity>;
  try {
    identity = validateGovernmentIdentity(document, GovernmentIdType.AADHAAR);
  } catch {
    throw new PartnerGovernmentIdError(422, "Aadhaar identity validation failed");
  }

  if (!organizerNamesMatch(identity.verifiedName, host.fullName)) {
    throw new PartnerGovernmentIdError(422, "Aadhaar name does not match the host name");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const currentHost = await getHostForVerification(tx, context);
      if (!organizerNamesMatch(identity.verifiedName, currentHost.fullName)) {
        throw new HostOnboardingError(422, "Aadhaar name does not match the host name");
      }
      const now = new Date();
      const claimed = await tx.partnerGovernmentIdAttempt.updateMany({
        where: {
          ...attemptWhere,
          status: AttemptStatus.AUTHORIZED,
          transactionId: attempt.transactionId,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        data: {
          status: AttemptStatus.VERIFIED,
          completedAt: now,
          failureReason: null,
        },
      });

      if (claimed.count !== 1) {
        throw new PartnerGovernmentIdError(409, "Verification attempt state changed");
      }

      const current = await tx.hostVerifyId.findUnique({
        where: { hostId },
        select: { aadhaarStatus: true },
      });

      if (current?.aadhaarStatus === PartnerVerificationStatus.VERIFIED) {
        throw new PartnerGovernmentIdError(409, "Aadhaar is already verified");
      }

      const aadhaar = {
        aadhaarLastFour: document.aadhaarLastFour ?? null,
        city: document.address?.city ?? null,
        state: document.address?.state ?? null,
        aadhaarName: identity.verifiedName,
        dateOfBirth: identity.birthDate,
        isAdult: true,
        isNameMatched: true,
        aadhaarStatus: PartnerVerificationStatus.VERIFIED,
        aadhaarVerifiedAt: now,
        aadhaarReferenceId: attempt.transactionId,
        aadhaarProvider: "GRIDLINES",
        aadhaarFailureReason: null,
      };

      await tx.hostVerifyId.upsert({
        where: { hostId },
        create: { hostId, ...aadhaar },
        update: aadhaar,
      });

      return result;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2034" || error.code === "P2002")
    ) {
      const current = await prisma.partnerGovernmentIdAttempt.findUnique({
        where: attemptWhere,
        select: { status: true },
      });
      if (current?.status === AttemptStatus.VERIFIED) {
        return result;
      }
      throw new PartnerGovernmentIdError(409, "Verification state changed. Please retry.");
    }
    throw error;
  }
};

const hostFaceSelect = {
  id: true,
  hostId: true,
  faceStatus: true,
  faceMatchScore: true,
  isFaceMatched: true,
  faceProvider: true,
  faceReferenceId: true,
  faceVerifiedAt: true,
  faceFailureReason: true,
  livenessStatus: true,
  livenessFailureReason: true,
} as const;

export const verifyHostFace = async (
  context: HostContext,
  selfie: Buffer,
) => {
  let mimeType: ReturnType<typeof validateImage>;
  try {
    mimeType = validateImage(selfie);
  } catch {
    throw new PartnerGovernmentIdError(400, "Selfie must be a JPEG or PNG up to 5 MB");
  }

  const { hostId, partnerId, businessId } = context;
  await getHostForVerification(prisma, context);
  const verification = await prisma.hostVerifyId.findUnique({
    where: { hostId },
    select: {
      ...hostFaceSelect,
      aadhaarStatus: true,
      aadhaarReferenceId: true,
      selfieKey: true,
    },
  });

  if (
    verification?.aadhaarStatus !== PartnerVerificationStatus.VERIFIED ||
    !verification.aadhaarReferenceId
  ) {
    throw new PartnerGovernmentIdError(409, "Complete Aadhaar verification first");
  }

  if (verification.faceStatus === PartnerVerificationStatus.VERIFIED &&
      verification.livenessStatus === PartnerVerificationStatus.VERIFIED) {
    return prisma.hostVerifyId.findUniqueOrThrow({
      where: { hostId },
      select: hostFaceSelect,
    });
  }

  const attempt = await prisma.partnerGovernmentIdAttempt.findUnique({
    where: {
      transactionId: verification.aadhaarReferenceId,
      businessId,
      hostId,
      partnerId,
      documentType: GovernmentIdType.AADHAAR,
      status: AttemptStatus.VERIFIED,
    },
    select: { referenceId: true },
  });
  if (!attempt) {
    throw new PartnerGovernmentIdError(409, "Verified Aadhaar transaction is unavailable");
  }

  const { liveness, match } = await checkOnboardingSelfie(
    verification.aadhaarReferenceId,
    attempt.referenceId,
    selfie,
  );

  const extension = mimeType === "image/png" ? "png" : "jpg";
  const { fileId } = await imagekit.upload({
    file: selfie,
    fileName: `${randomUUID()}.${extension}`,
    folder: `/event-partner/host-selfies/${hostId}`,
    isPrivateFile: true,
  }).catch(() => {
    throw new PartnerGovernmentIdError(502, "Unable to store the selfie");
  });

  const saved = await prisma.$transaction(async (tx) => {
    await getHostForVerification(tx, context);
    const saved = await tx.hostVerifyId.update({
      where: {
        hostId,
        aadhaarStatus: PartnerVerificationStatus.VERIFIED,
        aadhaarReferenceId: verification.aadhaarReferenceId,
        faceStatus: verification.faceStatus,
        livenessStatus: verification.livenessStatus,
        selfieKey: verification.selfieKey,
      },
      data: {
        selfieKey: fileId,
        status: match.isMatch ? PartnerVerificationStatus.VERIFIED : PartnerVerificationStatus.REJECTED,
        verifiedAt: match.isMatch ? new Date() : null,
        faceMatchScore: match.confidence,
        isFaceMatched: match.isMatch,
        faceStatus: match.isMatch
          ? PartnerVerificationStatus.VERIFIED
          : PartnerVerificationStatus.REJECTED,
        faceVerifiedAt: match.isMatch ? new Date() : null,
        faceReferenceId: match.providerRequestId ?? null,
        faceProvider: "GRIDLINES",
        faceFailureReason: match.isMatch ? null : "FACE_NOT_MATCHED",
        isLivenessPassed: true,
        livenessScore: liveness.confidence,
        livenessStatus: PartnerVerificationStatus.VERIFIED,
        livenessVerifiedAt: new Date(),
        livenessReferenceId: liveness.referenceId,
        livenessProvider: "GRIDLINES",
        livenessFailureReason: null,
      },
      select: hostFaceSelect,
    });
    if (match.isMatch) {
      await tx.host.updateMany({
        where: { id: hostId, onboardingStep: HostStep.VERIFY_ID },
        data: { onboardingStep: HostStep.VERIFICATION },
      });
    }
    return saved;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }).catch(async (error: unknown) => {
    await imagekit.deleteFile(fileId).catch(() => {
      console.error("Unable to delete an unsaved host selfie");
    });
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2025" || error.code === "P2034")) {
      throw new PartnerGovernmentIdError(409, "Face verification changed. Please retry.");
    }
    throw error;
  });

  if (verification.selfieKey) {
    await imagekit.deleteFile(verification.selfieKey).catch(() => {
      console.error("Unable to delete a replaced host selfie");
    });
  }

  return saved;
};
