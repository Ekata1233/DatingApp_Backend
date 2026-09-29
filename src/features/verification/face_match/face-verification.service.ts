
import {
  MediaType,
  VerificationStatus,
  VerificationType,
} from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";


import {
  verifyFaceWithGridlines,
} from "./face-match.provider";
import { getGovernmentIdPhoto } from "../government_id/government-id-photo.service";
import { getUserProfilePhoto } from "./face-match.helper";
import { recalculateTrustScore } from "../trust-score/trust-score.service";

const FACE_POINTS = 12;

export const verifyUserFaceService = async (
  userId: string,
  consent: boolean
) => {
  // 1. Check consent
  if (consent !== true) {
    throw new Error(
      "FACE_VERIFICATION_CONSENT_REQUIRED"
    );
  }

  // 2. Get Government ID verification
  const governmentId =
    await prisma.userVerification.findUnique({
      where: {
        userId_type: {
          userId,
          type:
            VerificationType.GOVERNMENT_ID,
        },
      },
    });

  if (!governmentId) {
    throw new Error(
      "GOVERNMENT_ID_VERIFICATION_REQUIRED"
    );
  }

  if (
    governmentId.status !==
    VerificationStatus.VERIFIED
  ) {
    throw new Error(
      "GOVERNMENT_ID_NOT_VERIFIED"
    );
  }

  // 3. Check Government ID expiry
  if (
    governmentId.expiresAt &&
    governmentId.expiresAt <= new Date()
  ) {
    throw new Error(
      "GOVERNMENT_ID_VERIFICATION_EXPIRED"
    );
  }

  // 4. Check Government ID portrait
  if (!governmentId.governmentIdPhotoKey) {
    throw new Error(
      "GOVERNMENT_ID_PHOTO_NOT_AVAILABLE"
    );
  }

  // 5. Check existing face verification
  const existingFace =
    await prisma.userVerification.findUnique({
      where: {
        userId_type: {
          userId,
          type:
            VerificationType.FACE_VERIFICATION,
        },
      },
    });

  if (
    existingFace?.status ===
    VerificationStatus.VERIFIED &&
    (
      !existingFace.expiresAt ||
      existingFace.expiresAt > new Date()
    )
  ) {
    return {
      verificationId: existingFace.id,
      status: "VERIFIED",
      points: existingFace.points,
      alreadyVerified: true,
      message:
        "Face is already verified",
    };
  }

  if (
    existingFace?.status ===
    VerificationStatus.LOCKED
  ) {
    throw new Error(
      "FACE_VERIFICATION_LOCKED"
    );
  }

  // 6. Get Government ID photo
  const governmentPhoto =
    await getGovernmentIdPhoto(
      governmentId.governmentIdPhotoKey,
      userId
    );

  if (
    !governmentPhoto.buffer ||
    governmentPhoto.buffer.length === 0
  ) {
    throw new Error(
      "GOVERNMENT_ID_PHOTO_NOT_AVAILABLE"
    );
  }

  // 7. Get user's first/profile photo
  const userPhoto =
    await prisma.userPhoto.findFirst({
      where: {
        user_id: userId,
        media_type: MediaType.IMAGE,
      },

      orderBy: [
        {
          is_primary: "desc",
        },
        {
          order: "asc",
        },
        {
          created_at: "asc",
        },
      ],
    });

  if (!userPhoto) {
    throw new Error(
      "USER_PROFILE_PHOTO_NOT_AVAILABLE"
    );
  }

  if (!userPhoto.media_url) {
    throw new Error(
      "USER_PROFILE_PHOTO_URL_NOT_AVAILABLE"
    );
  }

  // 8. Download profile photo
  const profilePhotoBuffer =
    await getUserProfilePhoto(
      userPhoto.media_url
    );

  // 9. Compare Government ID photo
  // with user's profile photo
  const faceResult =
    await verifyFaceWithGridlines(
      governmentPhoto.buffer,
      profilePhotoBuffer
    );

  // 10. Determine result
  const newStatus =
    faceResult.isMatch
      ? VerificationStatus.VERIFIED
      : VerificationStatus.REJECTED;

  const points =
    faceResult.isMatch
      ? FACE_POINTS
      : 0;

  const verifiedAt =
    faceResult.isMatch
      ? new Date()
      : null;

  // 11. Save result
  // 11. Save verification + update trust score
  const result = await prisma.$transaction(async (tx) => {
    // 11.1 Save face verification
    const verification =
      await tx.userVerification.upsert({
        where: {
          userId_type: {
            userId,
            type: VerificationType.FACE_VERIFICATION,
          },
        },

        create: {
          userId,

          type: VerificationType.FACE_VERIFICATION,

          status: newStatus,

          points,

          maxPoints: FACE_POINTS,

          provider: "GRIDLINES",

          providerRef:
            faceResult.providerRequestId,

          startedAt: new Date(),

          verifiedAt,

          rejectionReason:
            faceResult.isMatch
              ? null
              : "FACE_NOT_MATCHED",

          metadata: {
            confidence:
              faceResult.confidence,

            providerCode:
              faceResult.providerCode,

            governmentIdType:
              governmentId.governmentIdType,

            profilePhotoId:
              userPhoto.id,
          },
        },

        update: {
          status: newStatus,

          points,

          maxPoints: FACE_POINTS,

          provider: "GRIDLINES",

          providerRef:
            faceResult.providerRequestId,

          verifiedAt,

          rejectionReason:
            faceResult.isMatch
              ? null
              : "FACE_NOT_MATCHED",

          metadata: {
            confidence:
              faceResult.confidence,

            providerCode:
              faceResult.providerCode,

            governmentIdType:
              governmentId.governmentIdType,

            profilePhotoId:
              userPhoto.id,
          },
        },
      });

    // 11.2 Recalculate total trust score
    const trustScore =
      await recalculateTrustScore(
        userId,
        tx
      );

    return {
      verification,
      trustScore,
    };
  });

  const { verification, trustScore } = result;

  // 12. Return result
  return {
    verificationId:
      verification.id,

    type:
      verification.type,

    status:
      verification.status,

    points:
      verification.points,

    maxPoints:
      verification.maxPoints,

    trustScore,

    isMatch:
      faceResult.isMatch,

    confidence:
      faceResult.confidence,

    profilePhotoId:
      userPhoto.id,

    message:
      faceResult.isMatch
        ? "Face verification completed successfully"
        : "Your profile photo did not match your Government ID photo",
  };
};