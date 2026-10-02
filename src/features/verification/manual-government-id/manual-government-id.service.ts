import { randomUUID } from "crypto";

import {
  GovernmentIdType,
  VerificationStatus,
  VerificationType,
} from "@prisma/client";

import {
  prisma,
} from "../../../prisma/prismaClient";

import imagekit from "../../../utils/imagekit";

import {
  GovernmentIdFile,
  GovernmentIdFiles,
  SubmitManualGovernmentIdInput,
} from "./manual-government-id.types";

import {
  normalizeDocumentNumber,
  parseGovernmentIdDob,
  validateDocumentNumber,
} from "./manual-government-id.validation";

// ======================================================
// CONSTANTS
// ======================================================

const GOVERNMENT_ID_POINTS = 10;

const REVIEWED_BY =
  "Welvors Admin";

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

// ======================================================
// HELPERS
// ======================================================

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

// ======================================================
// VALIDATE FILE
// ======================================================

const validateGovernmentIdFile = (
  file: GovernmentIdFile,
  side: "FRONT" | "BACK"
) => {
  if (!file) {
    throw new Error(
      `GOVERNMENT_ID_${side}_PHOTO_REQUIRED`
    );
  }

  if (
    file.size &&
    file.size > MAX_FILE_SIZE
  ) {
    throw new Error(
      `GOVERNMENT_ID_${side}_FILE_TOO_LARGE`
    );
  }

  if (
    file.mimetype &&
    !ALLOWED_IMAGE_TYPES.includes(
      file.mimetype
    )
  ) {
    throw new Error(
      `GOVERNMENT_ID_${side}_INVALID_FILE_TYPE`
    );
  }

  const buffer =
    file.buffer ||
    file.data;

  if (!buffer) {
    throw new Error(
      `GOVERNMENT_ID_${side}_FILE_BUFFER_MISSING`
    );
  }

  return buffer;
};

// ======================================================
// IMAGEKIT UPLOAD
// ======================================================

const uploadGovernmentIdPhoto =
  async (
    userId: string,
    documentType: GovernmentIdType,
    file: GovernmentIdFile,
    side: "front" | "back"
  ) => {
    const buffer =
      validateGovernmentIdFile(
        file,
        side === "front"
          ? "FRONT"
          : "BACK"
      );

    const originalName =
      file.originalname ||
      file.name ||
      `${side}.jpg`;

    const extension =
      originalName
        .split(".")
        .pop()
        ?.toLowerCase() ||
      "jpg";

    const folder =
      `/manual-government-id/${userId}/${documentType.toLowerCase()}`;

    const result =
      await imagekit.upload({
        file: buffer,

        fileName:
          `${documentType.toLowerCase()}-${side}-${randomUUID()}.${extension}`,

        folder,

        useUniqueFileName: true,

        isPrivateFile: true,
      });

    return {
      fileId:
        result.fileId,

      filePath:
        result.filePath,
    };
  };

// ======================================================
// SUBMIT MANUAL GOVERNMENT ID
// ======================================================

export const submitManualGovernmentIdService =
  async (
    userId: string,
    input: SubmitManualGovernmentIdInput,
    files: GovernmentIdFiles
  ) => {
    // ---------------------------------------------
    // Validate basic input
    // ---------------------------------------------

    if (
      !input.fullName?.trim()
    ) {
      throw new Error(
        "FULL_NAME_REQUIRED"
      );
    }

    if (
      !input.documentNumber
    ) {
      throw new Error(
        "DOCUMENT_NUMBER_REQUIRED"
      );
    }

    const documentNumber =
      validateDocumentNumber(
        input.documentType,
        input.documentNumber
      );

    const dateOfBirth =
      parseGovernmentIdDob(
        input.dateOfBirth
      );

    // ---------------------------------------------
    // Front is required for all IDs
    // ---------------------------------------------

    if (!files.frontPhoto) {
      throw new Error(
        "GOVERNMENT_ID_FRONT_PHOTO_REQUIRED"
      );
    }

    // ---------------------------------------------
    // Aadhaar + DL require back.
    //
    // PAN normally only needs front.
    // ---------------------------------------------

    const backRequired =
      input.documentType ===
        GovernmentIdType.AADHAAR ||
      input.documentType ===
        GovernmentIdType.DRIVING_LICENSE;

    if (
      backRequired &&
      !files.backPhoto
    ) {
      throw new Error(
        "GOVERNMENT_ID_BACK_PHOTO_REQUIRED"
      );
    }

    // ---------------------------------------------
    // User check
    // ---------------------------------------------

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

    // ---------------------------------------------
    // Existing GOV ID verification
    // ---------------------------------------------

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
          manualGovernmentIdVerification:
            true,
        },
      });

    // Already verified through Gridlines OR manual.
    if (
      existingVerification?.status ===
      VerificationStatus.VERIFIED
    ) {
      throw new Error(
        "GOVERNMENT_ID_ALREADY_VERIFIED"
      );
    }

    // Existing manual request waiting for review.
    if (
      existingVerification?.status ===
        VerificationStatus.IN_PROGRESS &&
      existingVerification
        .manualGovernmentIdVerification
    ) {
      throw new Error(
        "GOVERNMENT_ID_VERIFICATION_ALREADY_IN_PROGRESS"
      );
    }

    // ---------------------------------------------
    // Upload front
    // ---------------------------------------------

    const frontPhoto =
      await uploadGovernmentIdPhoto(
        userId,
        input.documentType,
        files.frontPhoto,
        "front"
      );

    // ---------------------------------------------
    // Upload optional/required back
    // ---------------------------------------------

    let backPhoto:
      | {
          fileId: string;
          filePath: string;
        }
      | null = null;

    if (files.backPhoto) {
      backPhoto =
        await uploadGovernmentIdPhoto(
          userId,
          input.documentType,
          files.backPhoto,
          "back"
        );
    }

  
    
    // ---------------------------------------------
    // UserVerification
    // ---------------------------------------------

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
            input.documentType,

          provider:
            "MANUAL",

          status:
            VerificationStatus.IN_PROGRESS,

          points: 0,

          maxPoints:
            GOVERNMENT_ID_POINTS,

          startedAt:
            new Date(),

          verifiedAt:
            null,

          rejectionReason:
            null,
        },

        update: {
          governmentIdType:
            input.documentType,

          provider:
            "MANUAL",

          status:
            VerificationStatus.IN_PROGRESS,

          points: 0,

          maxPoints:
            GOVERNMENT_ID_POINTS,

          startedAt:
            new Date(),

          verifiedAt:
            null,

          rejectionReason:
            null,
        },
      });

    // ---------------------------------------------
    // ManualGovernmentIdVerification
    // ---------------------------------------------

    const manual =
      await prisma
        .manualGovernmentIdVerification
        .upsert({
          where: {
            userId,
          },

          create: {
            userId,

            verificationId:
              verification.id,

            documentType:
              input.documentType,

           documentNumber,

            fullName:
              input.fullName.trim(),

            dateOfBirth,

            frontPhoto:
              frontPhoto.filePath,

            backPhoto:
              backPhoto?.filePath ||
              null,

            status:
              VerificationStatus.IN_PROGRESS,
          },

          update: {
            verificationId:
              verification.id,

            documentType:
              input.documentType,

             documentNumber,

            fullName:
              input.fullName.trim(),

            dateOfBirth,

            frontPhoto:
              frontPhoto.filePath,

            backPhoto:
              backPhoto?.filePath ||
              null,

            status:
              VerificationStatus.IN_PROGRESS,

            reviewedBy:
              null,

            reviewedAt:
              null,

            verifiedAt:
              null,

            rejectionReason:
              null,
          },
        });

    return {
      id:
        manual.id,

      verificationId:
        manual.verificationId,

      documentType:
        manual.documentType,

      documentNumber:
        manual.documentNumber,

      fullName:
        manual.fullName,

      dateOfBirth:
        manual.dateOfBirth,

      status:
        manual.status,

      createdAt:
        manual.createdAt,
    };
  };

// ======================================================
// USER - GET MY STATUS
// ======================================================

export const getMyManualGovernmentIdService =
  async (
    userId: string
  ) => {
    return prisma
      .manualGovernmentIdVerification
      .findUnique({
        where: {
          userId,
        },

        select: {
          id: true,

          verificationId:
            true,

          documentType:
            true,

         

          fullName:
            true,

          dateOfBirth:
            true,

          status:
            true,

          rejectionReason:
            true,

          reviewedBy:
            true,

          reviewedAt:
            true,

          verifiedAt:
            true,

          createdAt:
            true,

          updatedAt:
            true,
        },
      });
  };

// ======================================================
// ADMIN - GET ALL
// ======================================================

export const getManualGovernmentIdListService =
  async (
    status?: VerificationStatus,
    documentType?: GovernmentIdType
  ) => {
    return prisma
      .manualGovernmentIdVerification
      .findMany({
        where: {
          ...(status
            ? {
                status,
              }
            : {}),

          ...(documentType
            ? {
                documentType,
              }
            : {}),
        },

        select: {
          id: true,

          userId: true,

          documentType:
            true,

        

          fullName: true,

          dateOfBirth:
            true,

          status: true,

          reviewedBy:
            true,

          reviewedAt:
            true,

          verifiedAt:
            true,

          rejectionReason:
            true,

          createdAt:
            true,

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
          createdAt:
            "desc",
        },
      });
  };

// ======================================================
// ADMIN - GET DETAILS
// ======================================================

export const getManualGovernmentIdDetailsService =
  async (
    manualId: string
  ) => {
    const result =
      await prisma
        .manualGovernmentIdVerification
        .findUnique({
          where: {
            id: manualId,
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
        "MANUAL_GOVERNMENT_ID_NOT_FOUND"
      );
    }

    const expires =
      Math.floor(
        Date.now() / 1000
      ) +
      15 * 60;

    const frontPhotoUrl =
      imagekit.url({
        path:
          result.frontPhoto,

        signed: true,

        expireSeconds:
          expires,
      });

    const backPhotoUrl =
      result.backPhoto
        ? imagekit.url({
            path:
              result.backPhoto,

            signed: true,

            expireSeconds:
              expires,
          })
        : null;

    return {
      id:
        result.id,

      userId:
        result.userId,

      user:
        result.user,

      documentType:
        result.documentType,

      documentNumber:
        result.documentNumber,

      fullName:
        result.fullName,

      dateOfBirth:
        result.dateOfBirth,

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

export const reviewManualGovernmentIdService =
  async (
    manualId: string,
    action:
      | "APPROVE"
      | "REJECT",
    rejectionReason?: string
  ) => {
    const governmentId =
      await prisma
        .manualGovernmentIdVerification
        .findUnique({
          where: {
            id: manualId,
          },

          include: {
            user: {
              select: {
                id: true,

                // We ONLY need this
                // profile field.
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

    if (!governmentId) {
      throw new Error(
        "MANUAL_GOVERNMENT_ID_NOT_FOUND"
      );
    }

    if (
      governmentId.status ===
      VerificationStatus.VERIFIED
    ) {
      throw new Error(
        "GOVERNMENT_ID_ALREADY_VERIFIED"
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

    return prisma.$transaction(
      async (tx) => {
        // ==========================================
        // APPROVE
        // ==========================================

        if (approved) {
          // ----------------------------------------
          // DOB comparison
          // ----------------------------------------

          const currentDob =
            normalizeDate(
              governmentId
                .user
                .birth_date
            );

          const verifiedDob =
            normalizeDate(
              governmentId
                .dateOfBirth
            );

          // Only update User.birth_date.
          if (
            governmentId.dateOfBirth &&
            currentDob !==
              verifiedDob
          ) {
            await tx.user.update({
              where: {
                id:
                  governmentId
                    .userId,
              },

              data: {
                birth_date:
                  governmentId
                    .dateOfBirth,
              },
            });
          }

          // ----------------------------------------
          // Name comparison
          // ----------------------------------------

          const currentName =
            normalizeName(
              governmentId
                .verification
                .verifiedName
            );

          const documentName =
            normalizeName(
              governmentId
                .fullName
            );

          // ----------------------------------------
          // Verification update
          // ----------------------------------------

          await tx
            .userVerification
            .update({
              where: {
                id:
                  governmentId
                    .verificationId,
              },

              data: {
                status:
                  VerificationStatus.VERIFIED,

                points:
                  GOVERNMENT_ID_POINTS,

                maxPoints:
                  GOVERNMENT_ID_POINTS,

                governmentIdType:
                  governmentId
                    .documentType,

                provider:
                  "MANUAL",

                verifiedAt:
                  now,

                rejectionReason:
                  null,

                // Only update name when
                // different.
                ...(currentName !==
                documentName
                  ? {
                      verifiedName:
                        governmentId
                          .fullName
                          .trim(),
                    }
                  : {}),
              },
            });
        }

        // ==========================================
        // REJECT
        // ==========================================

        else {
          await tx
            .userVerification
            .update({
              where: {
                id:
                  governmentId
                    .verificationId,
              },

              data: {
                status:
                  VerificationStatus.REJECTED,

                points: 0,

                verifiedAt:
                  null,

                rejectionReason:
                  rejectionReason!
                    .trim(),
              },
            });

          // DO NOT modify:
          //
          // User.birth_date
          // User.full_name
          // User.gender
          // User.email
          // verifiedName
        }

        // ==========================================
        // MANUAL RECORD
        // ==========================================

        const updated =
          await tx
            .manualGovernmentIdVerification
            .update({
              where: {
                id:
                  manualId,
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
                    : rejectionReason!
                        .trim(),
              },
            });

        return updated;
      }
    );
  };