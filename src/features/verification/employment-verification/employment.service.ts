import { randomUUID } from "crypto";
import {
  Prisma,
  VerificationStatus,
  VerificationType,
} from "@prisma/client";

import { prisma } from "../../../prisma/prismaClient";

import {
  EmploymentMethod,
  LatestEmploymentRecord,
  GRIDLINES_CODES,
  fetchUANByMobile,
  fetchLatestEmploymentByUAN,
  extractLatestEmployment,
} from "./employment.gridlines";
import { EmploymentFile, EmploymentFiles, EmploymentVerificationInput, validateEmploymentFile } from "./employment.validation";
import imagekit from "../../../utils/imagekit";



interface UploadedDocument {
  fileId: string;
  filePath: string;
}
// ============================================
// CONFIGURATION
// ============================================

const VERIFICATION_TYPE = VerificationType.PROFESSIONAL_VERIFICATION;
const PROVIDER = "GRIDLINES_EPFO";
const MAX_POINTS = 10;
const COMPANY_NAME_MAX_LENGTH = 100; // UserEduWork.companyName VarChar(100)

type VerifyInput = {
  userId: string;
  method: EmploymentMethod;
  value: string;
};

type LatestEmploymentResult = {
  uan: string;
  record: LatestEmploymentRecord;
};

// ============================================
// HELPERS
// ============================================

const normalizeMobile = (value: string): string =>
  value.replace(/\D/g, "").slice(-10);

const maskUAN = (uan: string): string => {
  if (!/^\d{12}$/.test(uan)) throw new Error("INVALID_UAN_NUMBER");
  return "XXXXXXXX" + uan.slice(-4);
};

const isCurrentlyEmployed = (record: LatestEmploymentRecord): boolean =>
  !record.date_of_exit || record.date_of_exit.trim().length === 0;

/**
 * Normalise a company name for comparison:
 * uppercase, drop M/S, PVT, LTD, LIMITED, PRIVATE, LLP, INC, CO, etc.,
 * then strip everything except A-Z0-9.
 * "M/S Shree Ganesh Enterprises" and "Shree Ganesh Enterprises Pvt. Ltd."
 * both become "SHREEGANESHENTERPRISES".
 */
const normalizeCompany = (value: string | null | undefined): string => {
  const upper = (value ?? "").toUpperCase();
  const withoutSuffixes = upper.replace(
    /\b(M\/S|MESSRS|PVT|PRIVATE|LTD|LIMITED|LLP|INC|CO|COMPANY|CORP|CORPORATION|OPC|PLC)\b\.?/g,
    " "
  );
  return withoutSuffixes.replace(/[^A-Z0-9]/g, "");
};

const companyNamesMatch = (
  epfoName: string,
  profileName: string | null | undefined
): boolean => {
  const a = normalizeCompany(epfoName);
  const b = normalizeCompany(profileName);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
};

/**
 * When a mobile maps to more than one UAN, each UAN has its own "latest"
 * employment. Pick the one that is still active; otherwise the most recent
 * joining date.
 */
const pickMostRecent = (
  results: LatestEmploymentResult[]
): LatestEmploymentResult => {
  const active = results.filter((r) => isCurrentlyEmployed(r.record));
  const pool = active.length > 0 ? active : results;

  return pool.reduce((best, current) => {
    const bestDate = best.record.date_of_joining ?? "";
    const currentDate = current.record.date_of_joining ?? "";
    return currentDate > bestDate ? current : best;
  });
};

const toEmploymentSummary = (record: LatestEmploymentRecord) => ({
  establishmentName: record.establishment_name,
  memberId: record.member_id ?? null,
  dateOfJoining: record.date_of_joining ?? null,
  dateOfExit: record.date_of_exit ?? null,
  exitReason: record.exit_reason ?? null,
  isCurrentlyEmployed: isCurrentlyEmployed(record),
});

// ============================================
// SAVE VERIFICATION
// ============================================

type SaveOptions = {
  status: VerificationStatus;
  metadata: Prisma.InputJsonValue;
  providerRef?: string;
  rejectionReason?: string;
  points?: number;
  verifiedAt?: Date | null;
};

const saveVerification = async (userId: string, opts: SaveOptions) => {
  const now = new Date();

  const fields = {
    status: opts.status,
    points: opts.points ?? 0,
    maxPoints: MAX_POINTS,
    provider: PROVIDER,
    providerRef: opts.providerRef ?? null,
    startedAt: now,
    verifiedAt: opts.verifiedAt ?? null,
    expiresAt: null,
    rejectionReason: opts.rejectionReason ?? null,
    metadata: opts.metadata,
  };

  return prisma.userVerification.upsert({
    where: { userId_type: { userId, type: VERIFICATION_TYPE } },
    create: { userId, type: VERIFICATION_TYPE, ...fields },
    update: fields,
  });
};

const rejectVerification = async (
  userId: string,
  method: EmploymentMethod,
  reason: string,
  extra: Record<string, unknown>,
  providerRef?: string
) => {
  const verification = await saveVerification(userId, {
    status: VerificationStatus.REJECTED,
    metadata: {
      method,
      employmentFound: false,
      checkedAt: new Date().toISOString(),
      ...extra,
    },
    providerRef,
    rejectionReason: reason,
  });

  return {
    success: false,
    message: reason,
    verificationId: verification.id,
    status: verification.status,
    employmentFound: false,
    uan: null,
    latestEmployment: null,
    points: 0,
  };
};

// ============================================
// STEP: FETCH LATEST EMPLOYMENT FOR ONE UAN
// ============================================

const fetchLatestForUAN = async (
  uan: string
): Promise<{
  record: LatestEmploymentRecord | null;
  code: string;
  message: string;
  requestId?: string;
}> => {
  const result = await fetchLatestEmploymentByUAN(uan, randomUUID());

  const code = String(result.data?.code ?? "");
  const message = result.data?.message ?? "";
  const requestId = result.request_id;

  if (code === GRIDLINES_CODES.LATEST_EMPLOYMENT_FETCHED) {
    const record = extractLatestEmployment(result);
    if (!record) throw new Error("EMPLOYMENT_RECORDS_NOT_AVAILABLE");
    return { record, code, message, requestId };
  }

  if (
    code === GRIDLINES_CODES.NO_EMPLOYMENT_RECORDS ||
    code === GRIDLINES_CODES.UAN_DOES_NOT_EXIST
  ) {
    return { record: null, code, message, requestId };
  }

  throw new Error(`GRIDLINES_UNEXPECTED_RESPONSE_${code || "UNKNOWN"}`);
};

// ============================================
// STEP: SYNC COMPANY NAME INTO UserEduWork
// ============================================

/**
 * Compares EPFO establishment name with the user's saved companyName.
 * On mismatch (or no saved company), overwrites companyName with the
 * EPFO value so the profile reflects verified data.
 */
const syncCompanyName = async (
  userId: string,
  establishmentName: string
): Promise<{
  companyMatches: boolean;
  companyNameUpdated: boolean;
  previousCompanyName: string | null;
  companyName: string;
}> => {
  const eduWork = await prisma.userEduWork.findUnique({
    where: { userId },
    select: { companyName: true },
  });

  const previousCompanyName = eduWork?.companyName ?? null;
  const companyMatches = companyNamesMatch(establishmentName, previousCompanyName);

  if (companyMatches) {
    return {
      companyMatches: true,
      companyNameUpdated: false,
      previousCompanyName,
      companyName: previousCompanyName as string,
    };
  }

  const newCompanyName = establishmentName
    .trim()
    .slice(0, COMPANY_NAME_MAX_LENGTH);

  await prisma.userEduWork.upsert({
    where: { userId },
    create: { userId, companyName: newCompanyName },
    update: { companyName: newCompanyName },
  });

  return {
    companyMatches: false,
    companyNameUpdated: true,
    previousCompanyName,
    companyName: newCompanyName,
  };
};

// ============================================
// VERIFY EMPLOYMENT SERVICE
// ============================================

export const verifyEmploymentService = async ({
  userId,
  method,
  value,
}: VerifyInput) => {
  // ------------------------------------------
  // 1. VALIDATE INPUT
  // ------------------------------------------

  if (method !== "MOBILE" && method !== "UAN") {
    throw new Error("INVALID_EMPLOYMENT_METHOD");
  }
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("EMPLOYMENT_VALUE_REQUIRED");
  }

  // ------------------------------------------
  // 2. LOAD USER
  // ------------------------------------------

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone_number: true,
      is_phone_verified: true,
      account_status: true,
    },
  });

  if (!user) throw new Error("USER_NOT_FOUND");
  if (user.account_status !== "ACTIVE") throw new Error("ACCOUNT_NOT_ACTIVE");

  // ------------------------------------------
  // 3. CHECK EXISTING VERIFICATION
  // ------------------------------------------

  const existing = await prisma.userVerification.findUnique({
    where: { userId_type: { userId, type: VERIFICATION_TYPE } },
  });

  if (existing?.status === VerificationStatus.LOCKED) {
    throw new Error("EMPLOYMENT_VERIFICATION_LOCKED");
  }

  if (existing?.status === VerificationStatus.VERIFIED) {
    const metadata =
      existing.metadata &&
      typeof existing.metadata === "object" &&
      !Array.isArray(existing.metadata)
        ? (existing.metadata as Record<string, unknown>)
        : {};

    return {
      success: true,
      message: "Employment already verified.",
      verificationId: existing.id,
      status: existing.status,
      employmentFound: true,
      uan: (metadata.latestEmployment as { uan?: string })?.uan ?? null,
      latestEmployment: metadata.latestEmployment ?? null,
      companyMatches: metadata.companyMatches ?? null,
      companyNameUpdated: metadata.companyNameUpdated ?? false,
      points: existing.points,
      verifiedAt: existing.verifiedAt,
    };
  }

  // REJECTED / IN_PROGRESS / NOT_STARTED → run a fresh check.

  // ------------------------------------------
  // 4. RESOLVE UAN LIST (MOBILE → UAN, or direct UAN)
  // ------------------------------------------

  let uanList: string[] = [];
  let providerRef: string | undefined;

  if (method === "MOBILE") {
    if (!user.is_phone_verified || !user.phone_number) {
      throw new Error("PHONE_VERIFICATION_REQUIRED");
    }

    const registeredMobile = normalizeMobile(user.phone_number);
    const requestedMobile = normalizeMobile(value);

    if (!/^[6-9]\d{9}$/.test(requestedMobile)) {
      throw new Error("INVALID_MOBILE_NUMBER");
    }
    if (registeredMobile !== requestedMobile) {
      throw new Error("MOBILE_NUMBER_DOES_NOT_MATCH");
    }

    // API 1: Fetch UAN by mobile
    const uanResult = await fetchUANByMobile(requestedMobile, randomUUID());
    const uanCode = String(uanResult.data?.code ?? "");
    providerRef = uanResult.request_id;

    if (uanCode === GRIDLINES_CODES.MOBILE_HAS_NO_UAN) {
      return rejectVerification(
        userId,
        method,
        "No UAN found for this mobile number.",
        { resultCode: uanCode },
        providerRef
      );
    }

    if (uanCode !== GRIDLINES_CODES.UAN_FETCHED) {
      throw new Error(`GRIDLINES_UNEXPECTED_RESPONSE_${uanCode || "UNKNOWN"}`);
    }

    uanList = [...new Set(uanResult.data?.uan_list ?? [])];

    if (uanList.length === 0) {
      return rejectVerification(
        userId,
        method,
        "No UAN found for this mobile number.",
        { resultCode: uanCode },
        providerRef
      );
    }

    if (uanList.some((u) => typeof u !== "string" || !/^\d{12}$/.test(u))) {
      throw new Error("INVALID_UAN_FROM_PROVIDER");
    }
  } else {
    const uan = value.trim();
    if (!/^\d{12}$/.test(uan)) throw new Error("INVALID_UAN_NUMBER");
    uanList = [uan];
  }

  const maskedUANs = uanList.map(maskUAN);

  // ------------------------------------------
  // 5. API 2: FETCH LATEST EMPLOYMENT FOR EACH UAN
  // ------------------------------------------

  const found: LatestEmploymentResult[] = [];
  let lastCode = "";
  let lastMessage = "";

  for (const uan of uanList) {
    const { record, code, message, requestId } = await fetchLatestForUAN(uan);
    lastCode = code;
    lastMessage = message;
    if (!providerRef) providerRef = requestId;
    if (record) found.push({ uan, record });
  }

  if (found.length === 0) {
    return rejectVerification(
      userId,
      method,
      "No employment records found.",
      {
        resultCode: lastCode,
        resultMessage: lastMessage,
        uanNumbers: maskedUANs,
      },
      providerRef
    );
  }

  // ------------------------------------------
  // 6. PICK THE LATEST EMPLOYMENT
  // ------------------------------------------

  const latest = pickMostRecent(found);
  const latestEmployment = {
    uan: latest.uan,
    ...toEmploymentSummary(latest.record),
  };

  // ------------------------------------------
  // 7. MATCH / UPDATE COMPANY NAME IN UserEduWork
  // ------------------------------------------

  const company = await syncCompanyName(
    userId,
    latest.record.establishment_name
  );

  // ------------------------------------------
  // 8. SAVE AS VERIFIED
  // ------------------------------------------

  const now = new Date();

  const verification = await saveVerification(userId, {
    status: VerificationStatus.VERIFIED,
    points: MAX_POINTS,
    verifiedAt: now,
    providerRef,
    metadata: {
      method,
      resultCode: GRIDLINES_CODES.LATEST_EMPLOYMENT_FETCHED,
      resultMessage: "Latest employment record fetched.",
      employmentFound: true,
      uanNumbers: maskedUANs,
      latestEmployment,
      companyMatches: company.companyMatches,
      companyNameUpdated: company.companyNameUpdated,
      previousCompanyName: company.previousCompanyName,
      checkedAt: now.toISOString(),
    },
  });

  // ------------------------------------------
  // 9. RESPONSE
  // ------------------------------------------

  return {
    success: true,
    message: company.companyMatches
      ? "Employment verified. Company name matches your profile."
      : "Employment verified. Company name in your profile has been updated from EPFO records.",
    verificationId: verification.id,
    status: verification.status,
    employmentFound: true,
    uan: latest.uan,
    latestEmployment,
    companyMatches: company.companyMatches,
    companyNameUpdated: company.companyNameUpdated,
    previousCompanyName: company.previousCompanyName,
    companyName: company.companyName,
    points: verification.points,
    verifiedAt: verification.verifiedAt,
  };
};

// ============================================
// GET EMPLOYMENT VERIFICATION STATUS
// ============================================

export const getEmploymentStatusService = async (userId: string) => {
  const verification = await prisma.userVerification.findUnique({
    where: { userId_type: { userId, type: VERIFICATION_TYPE } },
    select: {
      id: true,
      type: true,
      status: true,
      points: true,
      maxPoints: true,
      provider: true,
      startedAt: true,
      verifiedAt: true,
      expiresAt: true,
      rejectionReason: true,
      metadata: true,
    },
  });

  if (!verification) {
    return {
      status: VerificationStatus.NOT_STARTED,
      points: 0,
      maxPoints: MAX_POINTS,
      latestEmployment: null,
    };
  }

  return verification;
};




//----------------------------------------------------------
//Mannual employement



export const uploadEmploymentDocument = async (
  file: EmploymentFile,
  userId: string,
  documentType: "employmentId" | "salarySlip" | "bankStatement"
): Promise<UploadedDocument> => {
  validateEmploymentFile(file, documentType);

  const fileBuffer = file.buffer || file.data;

  if (!fileBuffer) {
    throw new Error("DOCUMENT_BUFFER_MISSING");
  }

  const extension =
    file.mimetype === "application/pdf"
      ? "pdf"
      : file.mimetype === "image/png"
        ? "png"
        : file.mimetype === "image/webp"
          ? "webp"
          : "jpg";

  const uploadResponse = await imagekit.upload({
    file: fileBuffer,
    fileName: `${documentType}-${randomUUID()}.${extension}`,
    folder: `/employment-verification/${userId}`,
    useUniqueFileName: true,
    isPrivateFile: true,
  });

  return {
    fileId: uploadResponse.fileId,
    filePath: uploadResponse.filePath,
  };
};


export const submitEmploymentVerificationService = async (
  userId: string,
  data: EmploymentVerificationInput,
  files: EmploymentFiles
) => {
  const existing =
    await prisma.employmentVerification.findFirst({
      where: {
        userId,
        status: {
          in: ["PENDING", "UNDER_REVIEW", "VERIFIED"],
        },
      },
    });

  if (existing) {
    throw new Error(
      "EMPLOYMENT_VERIFICATION_ALREADY_EXISTS"
    );
  }

  validateEmploymentFile(
    files.employmentId,
    "employmentId"
  );

  validateEmploymentFile(
    files.salarySlip,
    "salarySlip"
  );

  validateEmploymentFile(
    files.bankStatement,
    "bankStatement"
  );

  const uploadedFiles: UploadedDocument[] = [];

  try {
    const employmentId =
      await uploadEmploymentDocument(
        files.employmentId,
        userId,
        "employmentId"
      );

    uploadedFiles.push(employmentId);

    const salarySlip =
      await uploadEmploymentDocument(
        files.salarySlip,
        userId,
        "salarySlip"
      );

    uploadedFiles.push(salarySlip);

    const bankStatement =
      await uploadEmploymentDocument(
        files.bankStatement,
        userId,
        "bankStatement"
      );

    uploadedFiles.push(bankStatement);

    const result = await prisma.$transaction(
      async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true },
        });

        if (!user) {
          throw new Error("USER_NOT_FOUND");
        }

        const activeRequest =
          await tx.employmentVerification.findFirst({
            where: {
              userId,
              status: {
                in: [
                  "PENDING",
                  "UNDER_REVIEW",
                  "VERIFIED",
                ],
              },
            },
          });

        if (activeRequest) {
          throw new Error(
            "EMPLOYMENT_VERIFICATION_ALREADY_EXISTS"
          );
        }

        let verification =
          await tx.userVerification.findFirst({
            where: {
              userId,
              type: "PROFESSIONAL_VERIFICATION",
            },
          });

        if (!verification) {
          verification =
            await tx.userVerification.create({
              data: {
                userId,
                type: "PROFESSIONAL_VERIFICATION",
                status: "IN_PROGRESS",
                points: 0,
                maxPoints: 20,
              },
            });
        } else {
          if (verification.status === "VERIFIED") {
            throw new Error(
              "PROFESSIONAL_VERIFICATION_ALREADY_VERIFIED"
            );
          }

          verification =
            await tx.userVerification.update({
              where: {
                id: verification.id,
              },
              data: {
                status: "IN_PROGRESS",
                points: 0,
                verifiedAt: null,
                rejectionReason: null,
              },
            });
        }

        return tx.employmentVerification.create({
          data: {
            userId,
            verificationId: verification.id,
            companyName: data.companyName,
            joiningDate: new Date(
              `${data.joiningDate}T00:00:00.000Z`
            ),
            isCurrentlyWorking: data.isCurrentlyWorking,
            employmentIdUrl: employmentId.filePath,
            salarySlipUrl: salarySlip.filePath,
            bankStatementUrl: bankStatement.filePath,
            status: "PENDING",
          },
          select: {
            id: true,
            companyName: true,
            joiningDate: true,
            isCurrentlyWorking: true,
            status: true,
            createdAt: true,
          },
        });
      }
    );

    return result;
  } catch (error) {
    await Promise.allSettled(
      uploadedFiles.map((file) =>
        imagekit.deleteFile(file.fileId)
      )
    );

    throw error;
  }
};


export const getMyEmploymentVerificationService = async (
  userId: string
) => {
  return prisma.employmentVerification.findFirst({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      companyName: true,
      joiningDate: true,
      isCurrentlyWorking: true,
      status: true,
      rejectionReason: true,
      reviewedAt: true,
      verifiedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};


export const getEmploymentVerificationsAdminService = async (
  status?: EmploymentVerificationStatus
) => {
  return prisma.employmentVerification.findMany({
    where: status ? { status } : {},
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      userId: true,
      companyName: true,
      joiningDate: true,
      isCurrentlyWorking: true,
      status: true,
      createdAt: true,
      reviewedAt: true,
      verifiedAt: true,
      rejectionReason: true,
    },
  });
};


export const getEmploymentVerificationDetailsAdminService =
  async (employmentId: string) => {
    const employment =
      await prisma.employmentVerification.findUnique({
        where: {
          id: employmentId,
        },
      });

    if (!employment) {
      throw new Error(
        "EMPLOYMENT_VERIFICATION_NOT_FOUND"
      );
    }

    const getSignedUrl = (filePath: string) =>
      imagekit.url({
        path: filePath,
        signed: true,
        expireSeconds: 300,
      });

    return {
      id: employment.id,
      userId: employment.userId,
      companyName: employment.companyName,
      joiningDate: employment.joiningDate,
      isCurrentlyWorking: employment.isCurrentlyWorking,

      documents: {
        employmentIdUrl: getSignedUrl(
          employment.employmentIdUrl
        ),

        salarySlipUrl: getSignedUrl(
          employment.salarySlipUrl
        ),

        bankStatementUrl: getSignedUrl(
          employment.bankStatementUrl
        ),
      },

      status: employment.status,
      reviewedAt: employment.reviewedAt,
      verifiedAt: employment.verifiedAt,
      rejectionReason: employment.rejectionReason,
      createdAt: employment.createdAt,
    };
  };

  
export const reviewEmploymentVerificationService = async (
  employmentId: string,
  adminId: string,
  action: "APPROVE" | "REJECT",
  rejectionReason?: string
) => {
  return prisma.$transaction(async (tx) => {
    const employment =
      await tx.employmentVerification.findUnique({
        where: { id: employmentId },
      });

    if (!employment) {
      throw new Error("VERIFICATION_NOT_FOUND");
    }

    if (
      employment.status !== "PENDING" &&
      employment.status !== "UNDER_REVIEW"
    ) {
      throw new Error("VERIFICATION_ALREADY_REVIEWED");
    }

    if (
      action === "REJECT" &&
      !rejectionReason?.trim()
    ) {
      throw new Error("REJECTION_REASON_REQUIRED");
    }

    const approved = action === "APPROVE";
    const now = new Date();

    const updated =
      await tx.employmentVerification.updateMany({
        where: {
          id: employmentId,
          status: {
            in: ["PENDING", "UNDER_REVIEW"],
          },
        },
        data: {
          status: approved ? "VERIFIED" : "REJECTED",
          reviewedBy: adminId,
          reviewedAt: now,
          verifiedAt: approved ? now : null,
          rejectionReason: approved
            ? null
            : rejectionReason!.trim(),
        },
      });

    if (updated.count !== 1) {
      throw new Error("VERIFICATION_ALREADY_REVIEWED");
    }

    const verification =
      await tx.userVerification.findUniqueOrThrow({
        where: {
          id: employment.verificationId,
        },
      });

    await tx.userVerification.update({
      where: {
        id: verification.id,
      },
      data: {
        status: approved ? "VERIFIED" : "REJECTED",
        points: approved ? verification.maxPoints : 0,
        verifiedAt: approved ? now : null,
        rejectionReason: approved
          ? null
          : rejectionReason!.trim(),
      },
    });

    return tx.employmentVerification.findUniqueOrThrow({
      where: { id: employmentId },
      select: {
        id: true,
        status: true,
        reviewedAt: true,
        verifiedAt: true,
        rejectionReason: true,
      },
    });
  });
};