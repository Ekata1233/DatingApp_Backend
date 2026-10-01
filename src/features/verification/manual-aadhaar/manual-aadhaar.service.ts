import { randomUUID } from "crypto";
import {
  GovernmentIdType,
  VerificationStatus,
  VerificationType,
} from "@prisma/client";

import { prisma } from "../../../prisma/prismaClient";
import imagekit from "../../../utils/imagekit";

// ======================================================
// CONSTANTS
// ======================================================

const GOVERNMENT_ID_POINTS = 10;
const REVIEWED_BY = "Welvors Admin";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

// ======================================================
// TYPES
// ======================================================

export interface AadhaarFile {
  name?: string;
  originalname?: string;
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
  data?: Buffer;
}

export interface ManualAadhaarFiles {
  aadhaarFrontPhoto?: AadhaarFile;
  aadhaarBackPhoto?: AadhaarFile;
}

export interface SubmitManualAadhaarInput {
  aadhaarNumber: string;
  fullName: string;
  dateOfBirth: string;
  gender?: string;
  address?: string;
}

// ======================================================
// HELPERS
// ======================================================

const normalizeAadhaarNumber = (
  aadhaarNumber: string
) => {
  return aadhaarNumber.replace(/\s|-/g, "");
};

const normalizeName = (
  value?: string | null
) => {
  return (
    value
      ?.trim()
      .replace(/\s+/g, " ")
      .toLowerCase() || ""
  );
};

const normalizeDate = (
  value?: Date | null
) => {
  if (!value) {
    return null;
  }

  return value
    .toISOString()
    .slice(0, 10);
};

const parseDateOfBirth = (
  dateOfBirth: string
) => {
  const date = new Date(
    `${dateOfBirth}T00:00:00.000Z`
  );

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      "INVALID_DATE_OF_BIRTH"
    );
  }

  return date;
};

// ======================================================
// FILE VALIDATION
// ======================================================

const validateAadhaarFile = (
  file: AadhaarFile,
  side: "FRONT" | "BACK"
) => {
  if (!file) {
    throw new Error(
      `AADHAAR_${side}_PHOTO_REQUIRED`
    );
  }

  if (
    file.size &&
    file.size > MAX_FILE_SIZE
  ) {
    throw new Error(
      `AADHAAR_${side}_FILE_TOO_LARGE`
    );
  }

  if (
    file.mimetype &&
    !ALLOWED_IMAGE_TYPES.includes(
      file.mimetype
    )
  ) {
    throw new Error(
      `AADHAAR_${side}_INVALID_FILE_TYPE`
    );
  }

  const buffer =
    file.buffer || file.data;

  if (!buffer) {
    throw new Error(
      `AADHAAR_${side}_FILE_BUFFER_MISSING`
    );
  }

  return buffer;
};

// ======================================================
// IMAGEKIT UPLOAD
// ======================================================

const uploadAadhaarPhoto = async (
  userId: string,
  file: AadhaarFile,
  side: "front" | "back"
) => {
  const buffer =
    validateAadhaarFile(
      file,
      side === "front"
        ? "FRONT"
        : "BACK"
    );

  const originalName =
    file.originalname ||
    file.name ||
    `aadhaar-${side}.jpg`;

  const extension =
    originalName
      .split(".")
      .pop()
      ?.toLowerCase() || "jpg";

  const result =
    await imagekit.upload({
      file: buffer,

      fileName:
        `aadhaar-${side}-${randomUUID()}.${extension}`,

      folder:
        `/manual-aadhaar/${userId}`,

      useUniqueFileName: true,

      // Aadhaar is sensitive.
      // Keep file private.
      isPrivateFile: true,
    });

  return {
    fileId: result.fileId,
    filePath: result.filePath,
  };
};

// ======================================================
// SUBMIT MANUAL AADHAAR
// ======================================================

export const submitManualAadhaarService =
  async (
    userId: string,
    input: SubmitManualAadhaarInput,
    files: ManualAadhaarFiles
  ) => {
    // --------------------------------------------------
    // 1. Validate files
    // --------------------------------------------------

    if (!files.aadhaarFrontPhoto) {
      throw new Error(
        "AADHAAR_FRONT_PHOTO_REQUIRED"
      );
    }

    if (!files.aadhaarBackPhoto) {
      throw new Error(
        "AADHAAR_BACK_PHOTO_REQUIRED"
      );
    }

    // --------------------------------------------------
    // 2. Validate Aadhaar
    // --------------------------------------------------

    const aadhaarNumber =
      normalizeAadhaarNumber(
        input.aadhaarNumber
      );

    if (
      !/^\d{12}$/.test(aadhaarNumber)
    ) {
      throw new Error(
        "INVALID_AADHAAR_NUMBER"
      );
    }

    if (!input.fullName?.trim()) {
      throw new Error(
        "FULL_NAME_REQUIRED"
      );
    }

    const dateOfBirth =
      parseDateOfBirth(
        input.dateOfBirth
      );

    // --------------------------------------------------
    // 3. Check user
    // --------------------------------------------------

    const user =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          id: true,
        },
      });

    if (!user) {
      throw new Error(
        "USER_NOT_FOUND"
      );
    }

    // --------------------------------------------------
    // 4. Check existing government verification
    // --------------------------------------------------

    const existingVerification =
      await prisma.userVerification.findUnique({
        where: {
          userId_type: {
            userId,

            type:
              VerificationType.GOVERNMENT_ID,
          },
        },

        include: {
          manualAadhaarVerification:
            true,
        },
      });

    if (
      existingVerification?.status ===
      VerificationStatus.VERIFIED
    ) {
      throw new Error(
        "GOVERNMENT_ID_ALREADY_VERIFIED"
      );
    }

    if (
      existingVerification?.status ===
        VerificationStatus.IN_PROGRESS &&
      existingVerification
        .manualAadhaarVerification
    ) {
      throw new Error(
        "AADHAAR_VERIFICATION_ALREADY_IN_PROGRESS"
      );
    }

    // --------------------------------------------------
    // 5. Upload Aadhaar front
    // --------------------------------------------------

    const frontPhoto =
      await uploadAadhaarPhoto(
        userId,
        files.aadhaarFrontPhoto,
        "front"
      );

    // --------------------------------------------------
    // 6. Upload Aadhaar back
    // --------------------------------------------------

    const backPhoto =
      await uploadAadhaarPhoto(
        userId,
        files.aadhaarBackPhoto,
        "back"
      );

    // --------------------------------------------------
    // 7. Only store last 4 digits
    // --------------------------------------------------

    const aadhaarNumberLast4 =
      aadhaarNumber.slice(-4);

    // --------------------------------------------------
    // 8. Create/update UserVerification
    // --------------------------------------------------

    const verification =
      await prisma.userVerification.upsert({
        where: {
          userId_type: {
            userId,

            type:
              VerificationType.GOVERNMENT_ID,
          },
        },

        create: {
          userId,

          type:
            VerificationType.GOVERNMENT_ID,

          governmentIdType:
            GovernmentIdType.AADHAAR,

          provider: "MANUAL",

          status:
            VerificationStatus.IN_PROGRESS,

          points: 0,

          maxPoints:
            GOVERNMENT_ID_POINTS,

          startedAt: new Date(),

          verifiedAt: null,

          rejectionReason: null,
        },

        update: {
          governmentIdType:
            GovernmentIdType.AADHAAR,

          provider: "MANUAL",

          status:
            VerificationStatus.IN_PROGRESS,

          points: 0,

          maxPoints:
            GOVERNMENT_ID_POINTS,

          startedAt: new Date(),

          verifiedAt: null,

          rejectionReason: null,
        },
      });

    // --------------------------------------------------
    // 9. Create/update manual Aadhaar
    // --------------------------------------------------

    const manualAadhaar =
      await prisma.manualAadhaarVerification.upsert({
        where: {
          userId,
        },

        create: {
          userId,

          verificationId:
            verification.id,

          aadhaarNumberLast4,

          fullName:
            input.fullName.trim(),

          dateOfBirth,

          gender:
            input.gender?.trim() ||
            null,

          address:
            input.address?.trim() ||
            null,

          aadhaarFrontPhoto:
            frontPhoto.filePath,

          aadhaarBackPhoto:
            backPhoto.filePath,

          status:
            VerificationStatus.IN_PROGRESS,
        },

        update: {
          verificationId:
            verification.id,

          aadhaarNumberLast4,

          fullName:
            input.fullName.trim(),

          dateOfBirth,

          gender:
            input.gender?.trim() ||
            null,

          address:
            input.address?.trim() ||
            null,

          aadhaarFrontPhoto:
            frontPhoto.filePath,

          aadhaarBackPhoto:
            backPhoto.filePath,

          status:
            VerificationStatus.IN_PROGRESS,

          reviewedBy: null,

          reviewedAt: null,

          verifiedAt: null,

          rejectionReason: null,
        },
      });

    return {
      id: manualAadhaar.id,

      verificationId:
        manualAadhaar.verificationId,

      aadhaarNumberLast4:
        manualAadhaar.aadhaarNumberLast4,

      fullName:
        manualAadhaar.fullName,

      dateOfBirth:
        manualAadhaar.dateOfBirth,

      gender:
        manualAadhaar.gender,

      address:
        manualAadhaar.address,

      status:
        manualAadhaar.status,

      createdAt:
        manualAadhaar.createdAt,
    };
  };

// ======================================================
// GET MY MANUAL AADHAAR STATUS
// ======================================================

export const getMyManualAadhaarService =
  async (userId: string) => {
    const result =
      await prisma.manualAadhaarVerification.findUnique({
        where: {
          userId,
        },

        select: {
          id: true,
          verificationId: true,
          aadhaarNumberLast4: true,
          fullName: true,
          dateOfBirth: true,
          gender: true,
          address: true,
          status: true,
          rejectionReason: true,
          reviewedAt: true,
          verifiedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    return result;
  };

// ======================================================
// ADMIN - GET ALL
// ======================================================

export const getManualAadhaarListService =
  async (
    status?: VerificationStatus
  ) => {
    return prisma.manualAadhaarVerification.findMany({
      where: status
        ? {
            status,
          }
        : {},

      select: {
        id: true,

        userId: true,

        aadhaarNumberLast4: true,

        fullName: true,

        dateOfBirth: true,

        status: true,

        reviewedBy: true,

        reviewedAt: true,

        verifiedAt: true,

        rejectionReason: true,

        createdAt: true,

        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone_number: true,
            birth_date: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  };

// ======================================================
// ADMIN - GET DETAILS
// ======================================================

export const getManualAadhaarDetailsService =
  async (
    manualAadhaarId: string
  ) => {
    const result =
      await prisma.manualAadhaarVerification.findUnique({
        where: {
          id: manualAadhaarId,
        },

        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
              phone_number: true,
              birth_date: true,
            },
          },

          verification: {
            select: {
              id: true,
              type: true,
              status: true,
              points: true,
              maxPoints: true,
              verifiedName: true,
              governmentIdType: true,
              provider: true,
            },
          },
        },
      });

    if (!result) {
      throw new Error(
        "MANUAL_AADHAAR_NOT_FOUND"
      );
    }

    // Generate temporary signed ImageKit URLs.
    const expires =
      Math.floor(Date.now() / 1000) +
      15 * 60;

    const frontPhotoUrl =
      imagekit.url({
        path:
          result.aadhaarFrontPhoto,

        signed: true,

        expireSeconds: expires,
      });

    const backPhotoUrl =
      imagekit.url({
        path:
          result.aadhaarBackPhoto,

        signed: true,

        expireSeconds: expires,
      });

    return {
      id: result.id,

      userId:
        result.userId,

      user:
        result.user,

      aadhaarNumberLast4:
        result.aadhaarNumberLast4,

      fullName:
        result.fullName,

      dateOfBirth:
        result.dateOfBirth,

      gender:
        result.gender,

      address:
        result.address,

      documents: {
        frontPhotoUrl,
        backPhotoUrl,
      },

      verification:
        result.verification,

      status:
        result.status,

      reviewedBy:
        result.reviewedBy,

      reviewedAt:
        result.reviewedAt,

      verifiedAt:
        result.verifiedAt,

      rejectionReason:
        result.rejectionReason,

      createdAt:
        result.createdAt,

      updatedAt:
        result.updatedAt,
    };
  };

// ======================================================
// ADMIN - APPROVE / REJECT
// ======================================================

export const reviewManualAadhaarService =
  async (
    manualAadhaarId: string,
    action: "APPROVE" | "REJECT",
    rejectionReason?: string
  ) => {
    // --------------------------------------------------
    // 1. Get Aadhaar + current User values
    // --------------------------------------------------

    const aadhaar =
      await prisma.manualAadhaarVerification.findUnique({
        where: {
          id: manualAadhaarId,
        },

        include: {
          user: {
            select: {
              id: true,

              // IMPORTANT:
              // only need DOB for comparison.
              birth_date: true,
            },
          },

          verification: {
            select: {
              id: true,
              verifiedName: true,
              status: true,
            },
          },
        },
      });

    if (!aadhaar) {
      throw new Error(
        "MANUAL_AADHAAR_NOT_FOUND"
      );
    }

    if (
      aadhaar.status ===
      VerificationStatus.VERIFIED
    ) {
      throw new Error(
        "AADHAAR_ALREADY_VERIFIED"
      );
    }

    if (
      action === "REJECT" &&
      !rejectionReason?.trim()
    ) {
      throw new Error(
        "REJECTION_REASON_REQUIRED"
      );
    }

    const approved =
      action === "APPROVE";

    const now =
      new Date();

    // --------------------------------------------------
    // 2. Transaction
    // --------------------------------------------------

    return prisma.$transaction(
      async (tx) => {
        // ==============================================
        // APPROVE
        // ==============================================

        if (approved) {
          // --------------------------------------------
          // Compare current User DOB vs Aadhaar DOB
          // --------------------------------------------

          const currentBirthDate =
            normalizeDate(
              aadhaar.user.birth_date
            );

          const aadhaarBirthDate =
            normalizeDate(
              aadhaar.dateOfBirth
            );

          // --------------------------------------------
          // IMPORTANT:
          //
          // If DOB does not match,
          // ONLY update User.birth_date.
          //
          // User.full_name is NOT changed.
          // User.email is NOT changed.
          // User.gender is NOT changed.
          // Nothing else is changed.
          // --------------------------------------------

          if (
            currentBirthDate !==
            aadhaarBirthDate
          ) {
            await tx.user.update({
              where: {
                id: aadhaar.userId,
              },

              data: {
                birth_date:
                  aadhaar.dateOfBirth,
              },
            });
          }

          // --------------------------------------------
          // Compare verified name
          // --------------------------------------------

          const currentVerifiedName =
            normalizeName(
              aadhaar.verification
                .verifiedName
            );

          const aadhaarName =
            normalizeName(
              aadhaar.fullName
            );

          // --------------------------------------------
          // Update UserVerification
          // --------------------------------------------

          await tx.userVerification.update({
            where: {
              id:
                aadhaar.verificationId,
            },

            data: {
              status:
                VerificationStatus.VERIFIED,

              points:
                GOVERNMENT_ID_POINTS,

              maxPoints:
                GOVERNMENT_ID_POINTS,

              governmentIdType:
                GovernmentIdType.AADHAAR,

              provider:
                "MANUAL",

              verifiedAt:
                now,

              rejectionReason:
                null,

              // Only change verifiedName
              // when Aadhaar name differs.
              ...(currentVerifiedName !==
              aadhaarName
                ? {
                    verifiedName:
                      aadhaar.fullName.trim(),
                  }
                : {}),
            },
          });
        }

        // ==============================================
        // REJECT
        // ==============================================

        else {
          await tx.userVerification.update({
            where: {
              id:
                aadhaar.verificationId,
            },

            data: {
              status:
                VerificationStatus.REJECTED,

              points: 0,

              verifiedAt: null,

              rejectionReason:
                rejectionReason!.trim(),
            },
          });

          // IMPORTANT:
          // We DO NOT update User.birth_date
          // when rejected.
          //
          // We DO NOT update verifiedName
          // when rejected.
        }

        // ==============================================
        // UPDATE MANUAL AADHAAR RECORD
        // ==============================================

        const updatedAadhaar =
          await tx.manualAadhaarVerification.update({
            where: {
              id:
                manualAadhaarId,
            },

            data: {
              status:
                approved
                  ? VerificationStatus.VERIFIED
                  : VerificationStatus.REJECTED,

              reviewedBy:
                REVIEWED_BY,

              reviewedAt:
                now,

              verifiedAt:
                approved
                  ? now
                  : null,

              rejectionReason:
                approved
                  ? null
                  : rejectionReason!.trim(),
            },
          });

        return updatedAadhaar;
      }
    );
  };