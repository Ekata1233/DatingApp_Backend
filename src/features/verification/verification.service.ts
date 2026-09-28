import {
  VerificationStatus,
  VerificationType,
} from "@prisma/client";

import {
  getEarnedPoints,
  getSectionStatus,
  getVerificationAction,
  getVerificationStatus,
  TRUST_POINTS,
  TRUST_SCORE_TOTAL,
  VERIFICATION_CONFIG,
} from "./verification.helper";
import { prisma } from "../../prisma/prismaClient";

export const getTrustVerificationStatusService = async (
  userId: string
) => {
  // --------------------------------------------------
  // 1. Fetch user + location + all verification records
  // --------------------------------------------------

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },

    select: {
      id: true,
      email: true,
      phone_number: true,
      is_phone_verified: true,

      profile: {
        select: {
          latitude: true,
          longitude: true,
        },
      },

      verifications: {
        select: {
          id: true,
          type: true,
          status: true,
          points: true,
          maxPoints: true,
          verifiedAt: true,
          expiresAt: true,
          rejectionReason: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  // --------------------------------------------------
  // 2. Convert verification array into Map
  // --------------------------------------------------

  const verificationMap = new Map(
    user.verifications.map((verification) => [
      verification.type,
      verification,
    ])
  );

  // --------------------------------------------------
  // 3. Helper for UserVerification based items
  // --------------------------------------------------

  const buildVerificationItem = (
    type: VerificationType
  ) => {
    const verification =
      verificationMap.get(type);

    const config =
      VERIFICATION_CONFIG[type];

    const status =
      getVerificationStatus(
        verification?.status
      );

    const earnedPoints =
      getEarnedPoints(
        status,
        config.points
      );

    return {
      type,
      title: config.title,
      points: config.points,
      earnedPoints,
      status,
      action:
        getVerificationAction(status),
    };
  };

  // ==================================================
  // BASIC VERIFICATION
  // ==================================================

  /**
   * IMPORTANT:
   *
   * Currently your User model only contains
   * is_phone_verified.
   *
   * There is no is_email_verified field.
   *
   * So here we're considering Mobile & Email complete
   * when:
   *
   * - phone is verified
   * - email exists
   *
   * If you later add is_email_verified,
   * update this condition.
   */

  const mobileEmailVerified =
    user.is_phone_verified === true &&
    !!user.email;

  /**
   * As requested:
   * Location verification checks ONLY lat/lng.
   */

  const locationVerified =
    user.profile?.latitude != null &&
    user.profile?.longitude != null;

  const basicItems = [
    {
      type: "MOBILE_EMAIL",
      title: "Mobile & Email Verification",
      description:
        "Prevents mass fake signups and builds baseline trust",

      points: TRUST_POINTS.MOBILE_EMAIL,

      earnedPoints:
        mobileEmailVerified
          ? TRUST_POINTS.MOBILE_EMAIL
          : 0,

      status:
        mobileEmailVerified
          ? "VERIFIED"
          : "NOT_STARTED",

      action: mobileEmailVerified
        ? null
        : "VERIFY",
    },

    {
      type: "BASIC_LOCATION",
      title: "Basic Location Check",
      description:
        "Confirm city-level authenticity",

      points: TRUST_POINTS.BASIC_LOCATION,

      earnedPoints:
        locationVerified
          ? TRUST_POINTS.BASIC_LOCATION
          : 0,

      status:
        locationVerified
          ? "VERIFIED"
          : "NOT_STARTED",

      action: locationVerified
        ? null
        : "VERIFY",
    },
  ];

  const basicCompleted =
    basicItems.filter(
      (item) =>
        item.status === "VERIFIED"
    ).length;

  const basicEarnedPoints =
    basicItems.reduce(
      (sum, item) =>
        sum + item.earnedPoints,
      0
    );

  const basicSection = {
    key: "BASIC",
    number: "01",

    title: "Basic Verification",

    subtitle:
      "Auto-verified on signup · Everyone",

    status: getSectionStatus(
      basicCompleted,
      basicItems.length
    ),

    earnedPoints: basicEarnedPoints,
    maxPoints: 20,

    completed: basicCompleted,
    total: basicItems.length,

    items: basicItems,
  };

  // ==================================================
  // IDENTITY VERIFICATION
  // ==================================================

  const identityItems = [
    buildVerificationItem(
      VerificationType.GOVERNMENT_ID
    ),

    buildVerificationItem(
      VerificationType.FACE_VERIFICATION
    ),

    buildVerificationItem(
      VerificationType.VIDEO_VERIFICATION
    ),
  ];

  const identityCompleted =
    identityItems.filter(
      (item) =>
        item.status ===
        VerificationStatus.VERIFIED
    ).length;

  const identityEarnedPoints =
    identityItems.reduce(
      (sum, item) =>
        sum + item.earnedPoints,
      0
    );

  const identitySection = {
    key: "IDENTITY",
    number: "02",

    title: "Identity Verification",

    subtitle:
      "Real person, real face · +20 pts",

    status: getSectionStatus(
      identityCompleted,
      identityItems.length
    ),

    earnedPoints:
      identityEarnedPoints,

    maxPoints: 20,

    completed:
      identityCompleted,

    total:
      identityItems.length,

    items:
      identityItems,
  };

  // ==================================================
  // HIGH TRUST
  // ==================================================

  const highTrustItems = [
    buildVerificationItem(
      VerificationType.EDUCATION_VERIFICATION
    ),

    buildVerificationItem(
      VerificationType.PROFESSIONAL_VERIFICATION
    ),
  ];

  const highTrustCompleted =
    highTrustItems.filter(
      (item) =>
        item.status ===
        VerificationStatus.VERIFIED
    ).length;

  const highTrustEarnedPoints =
    highTrustItems.reduce(
      (sum, item) =>
        sum + item.earnedPoints,
      0
    );

  const highTrustSection = {
    key: "HIGH_TRUST",
    number: "03",

    title:
      "High Trust Verification",

    subtitle:
      "Stops catfishing & bots · +30 pts",

    status: getSectionStatus(
      highTrustCompleted,
      highTrustItems.length
    ),

    earnedPoints:
      highTrustEarnedPoints,

    /**
     * Keeping 30 because this is the response
     * format you requested.
     *
     * Current visible items only total 15.
     */
    maxPoints: 30,

    completed:
      highTrustCompleted,

    /**
     * You requested total: 4, although currently
     * only two items exist.
     */
    total: 4,

    items:
      highTrustItems,
  };

  // ==================================================
  // PLATINUM
  // ==================================================

  /**
   * You can change this condition later.
   *
   * For now Platinum unlocks when all currently
   * displayed High Trust items are VERIFIED.
   */

  const platinumUnlocked =
    highTrustCompleted ===
    highTrustItems.length;

  const platinumTypes = [
    VerificationType.CRIMINAL_BACKGROUND_CHECK,
    VerificationType.EMERGENCY_CONTACT,
    VerificationType.INCOME_VERIFICATION,
  ];

  const platinumItems =
    platinumTypes.map((type) => {
      const item =
        buildVerificationItem(type);

      /**
       * Force LOCKED for dashboard display until
       * Platinum has been unlocked.
       */
      if (!platinumUnlocked) {
        return {
          ...item,
          earnedPoints: 0,
          status: "LOCKED" as const,
          action: null,
        };
      }

      return item;
    });

  const platinumCompleted =
    platinumItems.filter(
      (item) =>
        item.status ===
        VerificationStatus.VERIFIED
    ).length;

  const platinumEarnedPoints =
    platinumItems.reduce(
      (sum, item) =>
        sum + item.earnedPoints,
      0
    );

  const platinumSection = {
    key: "PLATINUM",
    number: "04",

    title:
      "Platinum Verification",

    subtitle:
      "For serious long-term · +26 pts",

    status: getSectionStatus(
      platinumCompleted,
      platinumItems.length,
      !platinumUnlocked
    ),

    earnedPoints:
      platinumEarnedPoints,

    maxPoints: 26,

    completed:
      platinumCompleted,

    total:
      platinumItems.length,

    items:
      platinumItems,
  };

  // ==================================================
  // TOTAL TRUST SCORE
  // ==================================================

  const earned =
    basicEarnedPoints +
    identityEarnedPoints +
    highTrustEarnedPoints +
    platinumEarnedPoints;

  /**
   * Never allow score above 100.
   */
  const safeEarned = Math.min(
    earned,
    TRUST_SCORE_TOTAL
  );

  const remaining = Math.max(
    TRUST_SCORE_TOTAL -
      safeEarned,
    0
  );

  const percentage =
    Math.round(
      (safeEarned /
        TRUST_SCORE_TOTAL) *
        100
    );

  // ==================================================
  // NEXT RECOMMENDED VERIFICATION
  // ==================================================

  /**
   * Recommended verification order.
   *
   * Change this array whenever product priority changes.
   */

  const recommendationOrder: VerificationType[] = [
    VerificationType.GOVERNMENT_ID,
    VerificationType.FACE_VERIFICATION,
    VerificationType.VIDEO_VERIFICATION,
    VerificationType.EDUCATION_VERIFICATION,
    VerificationType.PROFESSIONAL_VERIFICATION,

    ...(platinumUnlocked
      ? [
          VerificationType.CRIMINAL_BACKGROUND_CHECK,
          VerificationType.EMERGENCY_CONTACT,
          VerificationType.INCOME_VERIFICATION,
        ]
      : []),
  ];

  let nextRecommended: {
    type: VerificationType;
    title: string;
    points: number;
  } | null = null;

  for (const type of recommendationOrder) {
    const verification =
      verificationMap.get(type);

    if (
      verification?.status !==
      VerificationStatus.VERIFIED
    ) {
      nextRecommended = {
        type,
        title:
          VERIFICATION_CONFIG[type]
            .title,
        points:
          VERIFICATION_CONFIG[type]
            .points,
      };

      break;
    }
  }

  // ==================================================
  // FINAL RESPONSE DATA
  // ==================================================

  return {
    trustScore: {
      earned: safeEarned,
      total: TRUST_SCORE_TOTAL,
      remaining,
      percentage,
      nextRecommended,
    },

    sections: [
      basicSection,
      identitySection,
      highTrustSection,
      platinumSection,
    ],
  };
};