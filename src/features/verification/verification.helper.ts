const normalizeName = (
  name: string
) => {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
};

const parseAadhaarDob = (
  value: string
) => {
  const parts =
    value.split(/[\/-]/);

  if (parts.length !== 3) {
    return null;
  }

  const [
    day,
    month,
    year,
  ] = parts.map(Number);

  const date =
    new Date(
      year,
      month - 1,
      day
    );

  return isNaN(
    date.getTime()
  )
    ? null
    : date;
};

const isSameDate = (
  first: Date,
  second: Date
) => {
  return (
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getDate() ===
      second.getDate()
  );
};

const calculateAge = (
  dob: Date
) => {
  const today = new Date();

  let age =
    today.getFullYear() -
    dob.getFullYear();

  const month =
    today.getMonth() -
    dob.getMonth();

  if (
    month < 0 ||
    (month === 0 &&
      today.getDate() <
        dob.getDate())
  ) {
    age--;
  }

  return age;
};

import {
  VerificationStatus,
  VerificationType,
} from "@prisma/client";

export const TRUST_SCORE_TOTAL = 100;

export const TRUST_POINTS = {
  MOBILE_EMAIL: 10,
  BASIC_LOCATION: 10,

  GOVERNMENT_ID: 10,
  FACE_VERIFICATION: 5,
  VIDEO_VERIFICATION: 5,

  EDUCATION_VERIFICATION: 7,
  PROFESSIONAL_VERIFICATION: 8,

  CRIMINAL_BACKGROUND_CHECK: 12,
  EMERGENCY_CONTACT: 6,
  INCOME_VERIFICATION: 8,
} as const;

/**
 * Configuration for verification items stored
 * inside UserVerification.
 */
export const VERIFICATION_CONFIG = {
  [VerificationType.GOVERNMENT_ID]: {
    title: "Government ID Verification",
    points: TRUST_POINTS.GOVERNMENT_ID,
  },

  [VerificationType.FACE_VERIFICATION]: {
    title: "Face Verification (selfie match)",
    points: TRUST_POINTS.FACE_VERIFICATION,
  },

  [VerificationType.VIDEO_VERIFICATION]: {
    title: "Video Verification",
    points: TRUST_POINTS.VIDEO_VERIFICATION,
  },

  [VerificationType.EDUCATION_VERIFICATION]: {
    title: "Education Verification",
    points: TRUST_POINTS.EDUCATION_VERIFICATION,
  },

  [VerificationType.PROFESSIONAL_VERIFICATION]: {
    title: "Professional Verification",
    points: TRUST_POINTS.PROFESSIONAL_VERIFICATION,
  },

  [VerificationType.CRIMINAL_BACKGROUND_CHECK]: {
    title: "Criminal Background Check",
    points: TRUST_POINTS.CRIMINAL_BACKGROUND_CHECK,
  },

  [VerificationType.EMERGENCY_CONTACT]: {
    title: "Emergency Contact",
    points: TRUST_POINTS.EMERGENCY_CONTACT,
  },

  [VerificationType.INCOME_VERIFICATION]: {
    title: "Income Verification",
    points: TRUST_POINTS.INCOME_VERIFICATION,
  },
} as const;

export type TrustItemStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "VERIFIED"
  | "REJECTED"
  | "EXPIRED"
  | "LOCKED";

/**
 * If UserVerification record doesn't exist,
 * treat it as NOT_STARTED.
 */
export const getVerificationStatus = (
  status?: VerificationStatus | null
): TrustItemStatus => {
  return status ?? "NOT_STARTED";
};

/**
 * Points are earned ONLY after successful verification.
 */
export const getEarnedPoints = (
  status: TrustItemStatus,
  maxPoints: number
): number => {
  return status === "VERIFIED" ? maxPoints : 0;
};

/**
 * Button/action shown by frontend.
 */
export const getVerificationAction = (
  status: TrustItemStatus
): "VERIFY" | "RETRY" | null => {
  switch (status) {
    case "VERIFIED":
    case "LOCKED":
      return null;

    case "REJECTED":
    case "EXPIRED":
      return "RETRY";

    case "NOT_STARTED":
    case "IN_PROGRESS":
    default:
      return "VERIFY";
  }
};

export const getSectionStatus = (
  completed: number,
  total: number,
  isLocked = false
): TrustItemStatus => {
  if (isLocked) {
    return "LOCKED";
  }

  if (completed === total && total > 0) {
    return "VERIFIED";
  }

  if (completed > 0) {
    return "IN_PROGRESS";
  }

  return "NOT_STARTED";
};