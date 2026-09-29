import { randomUUID } from "crypto";

import {
  VerificationStatus,
  VerificationType,
} from "@prisma/client";

import { prisma } from "../../../prisma/prismaClient";
import imagekit from "../../../utils/imagekit";

import {
  EducationVerificationInput,
  
  validateEducationFile,
} from "./education.validation";
import { EducationFile, EducationFiles } from "./education.type";

const uploadEducationDocument = async (
  userId: string,
  file: EducationFile,
  documentType: "certificate" | "marksheet"
) => {
  const buffer = validateEducationFile(
    file,
    documentType
  );

  const originalName =
    file.originalname ||
    file.name ||
    `${documentType}.pdf`;

  const extension =
    originalName.split(".").pop() || "pdf";

  const result = await imagekit.upload({
    file: buffer,
    fileName: `${documentType}-${randomUUID()}.${extension}`,
    folder: `/education-verification/${userId}`,
    useUniqueFileName: true,
    isPrivateFile: true,
  });

  return {
    fileId: result.fileId,
    filePath: result.filePath,
    url: result.url,
  };
};

export const submitEducationVerificationService = async (
  userId: string,
  input: EducationVerificationInput,
  files: EducationFiles
) => {
  const certificateFile = files.certificate;

  if (!certificateFile) {
    throw new Error("CERTIFICATE_REQUIRED");
  }

  const existingVerification =
    await prisma.userVerification.findUnique({
      where: {
        userId_type: {
          userId,
          type: VerificationType.EDUCATION_VERIFICATION,
        },
      },
      include: {
        educationVerification: true,
      },
    });

  if (
    existingVerification?.status ===
    VerificationStatus.VERIFIED
  ) {
    throw new Error(
      "EDUCATION_ALREADY_VERIFIED"
    );
  }

  if (
    existingVerification?.status ===
      VerificationStatus.IN_PROGRESS &&
    existingVerification.educationVerification
  ) {
    throw new Error(
      "EDUCATION_VERIFICATION_ALREADY_IN_PROGRESS"
    );
  }

  const certificate =
    await uploadEducationDocument(
      userId,
      certificateFile,
      "certificate"
    );

  let marksheet:
    | Awaited<
        ReturnType<
          typeof uploadEducationDocument
        >
      >
    | null = null;

  if (files.marksheet) {
    marksheet =
      await uploadEducationDocument(
        userId,
        files.marksheet,
        "marksheet"
      );
  }

  const verification =
    await prisma.userVerification.upsert({
      where: {
        userId_type: {
          userId,
          type: VerificationType.EDUCATION_VERIFICATION,
        },
      },

      create: {
        userId,
        type: VerificationType.EDUCATION_VERIFICATION,
        status: VerificationStatus.IN_PROGRESS,
        points: 0,
        maxPoints: EDUCATION_VERIFICATION_POINTS,
        startedAt: new Date(),
        rejectionReason: null,
      },

      update: {
        status: VerificationStatus.IN_PROGRESS,
        points: 0,
        maxPoints: EDUCATION_VERIFICATION_POINTS,
        startedAt: new Date(),
        verifiedAt: null,
        rejectionReason: null,
      },
    });

  const educationVerification =
    await prisma.educationVerification.upsert({
      where: {
        verificationId: verification.id,
      },

      create: {
        userId,
        verificationId: verification.id,

        institutionName:
          input.institutionName,

        degreeName:
          input.degreeName,

        fieldOfStudy:
          input.fieldOfStudy || null,

        startYear:
          input.startYear || null,

        graduationYear:
          input.graduationYear || null,

        isCurrentlyStudying:
          input.isCurrentlyStudying,

        certificateUrl:
          certificate.filePath,

        marksheetUrl:
          marksheet?.filePath || null,

        status:
          VerificationStatus.IN_PROGRESS,
      },

      update: {
        institutionName:
          input.institutionName,

        degreeName:
          input.degreeName,

        fieldOfStudy:
          input.fieldOfStudy || null,

        startYear:
          input.startYear || null,

        graduationYear:
          input.graduationYear || null,

        isCurrentlyStudying:
          input.isCurrentlyStudying,

        certificateUrl:
          certificate.filePath,

        marksheetUrl:
          marksheet?.filePath || null,

        status:
          VerificationStatus.IN_PROGRESS,

        reviewedBy: null,
        reviewedAt: null,
        verifiedAt: null,
        rejectionReason: null,
      },
    });

  return {
    id: educationVerification.id,

    verificationId:
      educationVerification.verificationId,

    institutionName:
      educationVerification.institutionName,

    degreeName:
      educationVerification.degreeName,

    fieldOfStudy:
      educationVerification.fieldOfStudy,

    startYear:
      educationVerification.startYear,

    graduationYear:
      educationVerification.graduationYear,

    isCurrentlyStudying:
      educationVerification.isCurrentlyStudying,

    status:
      educationVerification.status,

    createdAt:
      educationVerification.createdAt,
  };
};

export const getMyEducationVerificationService =
  async (userId: string) => {
    const result =
      await prisma.educationVerification.findFirst({
        where: {
          userId,
        },

        select: {
          id: true,
          verificationId: true,
          institutionName: true,
          degreeName: true,
          fieldOfStudy: true,
          startYear: true,
          graduationYear: true,
          isCurrentlyStudying: true,
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

  export const getEducationVerificationsService =
  async (
    status?: VerificationStatus
  ) => {
    return prisma.educationVerification.findMany({
      where: status
        ? {
            status,
          }
        : {},

      select: {
        id: true,
        userId: true,
        institutionName: true,
        degreeName: true,
        fieldOfStudy: true,
        graduationYear: true,
        isCurrentlyStudying: true,
        status: true,
        rejectionReason: true,
        reviewedAt: true,
        verifiedAt: true,
        createdAt: true,

        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  };

  export const getEducationVerificationDetailsService =
  async (educationId: string) => {
    const result =
      await prisma.educationVerification.findUnique({
        where: {
          id: educationId,
        },

        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
              phone_number: true,
            },
          },
        },
      });

    if (!result) {
      throw new Error(
        "EDUCATION_VERIFICATION_NOT_FOUND"
      );
    }

    const expires =
      Math.floor(Date.now() / 1000) +
      15 * 60;

    const certificateUrl =
      imagekit.url({
        path: result.certificateUrl,
        signed: true,
        expireSeconds: expires,
      });

    const marksheetUrl =
      result.marksheetUrl
        ? imagekit.url({
            path: result.marksheetUrl,
            signed: true,
            expireSeconds: expires,
          })
        : null;

    return {
      id: result.id,
      userId: result.userId,

      user: result.user,

      institutionName:
        result.institutionName,

      degreeName:
        result.degreeName,

      fieldOfStudy:
        result.fieldOfStudy,

      startYear:
        result.startYear,

      graduationYear:
        result.graduationYear,

      isCurrentlyStudying:
        result.isCurrentlyStudying,

      documents: {
        certificateUrl,
        marksheetUrl,
      },

      status:
        result.status,

      rejectionReason:
        result.rejectionReason,

      reviewedAt:
        result.reviewedAt,

      verifiedAt:
        result.verifiedAt,

      createdAt:
        result.createdAt,
    };
  };

  export const reviewEducationVerificationService =
  async (
    educationId: string,
    action: "APPROVE" | "REJECT",
    rejectionReason?: string
  ) => {
    const education =
      await prisma.educationVerification.findUnique({
        where: {
          id: educationId,
        },

        include: {
          verification: true,
        },
      });

    if (!education) {
      throw new Error(
        "EDUCATION_VERIFICATION_NOT_FOUND"
      );
    }

    if (
      education.status ===
      VerificationStatus.VERIFIED
    ) {
      throw new Error(
        "EDUCATION_VERIFICATION_ALREADY_REVIEWED"
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

    const now = new Date();

    return prisma.$transaction(
      async (tx) => {
        const updatedEducation =
          await tx.educationVerification.update({
            where: {
              id: educationId,
            },

            data: {
              status: approved
                ? VerificationStatus.VERIFIED
                : VerificationStatus.REJECTED,

              reviewedBy: null,

              reviewedAt: now,

              verifiedAt: approved
                ? now
                : null,

              rejectionReason: approved
                ? null
                : rejectionReason!.trim(),
            },
          });

        await tx.userVerification.update({
          where: {
            id: education.verificationId,
          },

          data: {
            status: approved
              ? VerificationStatus.VERIFIED
              : VerificationStatus.REJECTED,

            points: approved
              ? EDUCATION_VERIFICATION_POINTS
              : 0,

            verifiedAt: approved
              ? now
              : null,

            rejectionReason: approved
              ? null
              : rejectionReason!.trim(),
          },
        });

        return updatedEducation;
      }
    );
  };