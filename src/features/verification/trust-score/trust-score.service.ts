import {
  Prisma,
  VerificationStatus,
  VerificationType,
} from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";

const isVerified = (status?: VerificationStatus | null) =>
  status === VerificationStatus.VERIFIED;

const formatGovernmentIdType = (
  type?: string | null
) => {
  switch (type) {
    case "AADHAAR":
      return "Aadhaar card";

    case "PAN":
      return "PAN card";

    case "DRIVING_LICENSE":
      return "Driving licence";

    default:
      return "Government ID";
  }
};

const calculateAge = (
  birthDate?: Date | null
): number | null => {
  if (!birthDate) return null;

  const today = new Date();

  let age =
    today.getFullYear() - birthDate.getFullYear();

  const monthDiff =
    today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 &&
      today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

const getVerification = (
  verifications: any[],
  type: VerificationType
) => {
  return verifications.find(
    (item) => item.type === type
  );
};

const safeMetadata = (verification: any) => {
  if (
    !verification?.metadata ||
    typeof verification.metadata !== "object" ||
    Array.isArray(verification.metadata)
  ) {
    return {};
  }

  return verification.metadata as Record<
    string,
    any
  >;
};

const maskPhoneNumber = (
  phone?: string | null
): string | null => {
  if (!phone) return null;

  // Remove spaces/hyphens
  const cleaned = phone.replace(/[\s-]/g, "");

  // Indian mobile example:
  // +919876543210 -> +91 ••••• ••210

  let countryCode = "";
  let number = cleaned;

  if (cleaned.startsWith("+91")) {
    countryCode = "+91";
    number = cleaned.slice(3);
  } else if (
    cleaned.startsWith("91") &&
    cleaned.length === 12
  ) {
    countryCode = "+91";
    number = cleaned.slice(2);
  }

  if (number.length < 3) {
    return "••••••";
  }

  const lastThree = number.slice(-3);

  return `${countryCode ? `${countryCode} ` : ""
    }••••• ••${lastThree}`;
};

const maskEmail = (
  email?: string | null
): string | null => {
  if (!email) return null;

  const [username, domain] = email.split("@");

  if (!username || !domain) {
    return "••••••";
  }

  // Example:
  // aanya@gmail.com -> aa•••@gmail.com

  const visibleLength = Math.min(
    2,
    username.length
  );

  const visible = username.slice(
    0,
    visibleLength
  );

  return `${visible}•••@${domain}`;
};



export const getPublicTrustScoreService = async (
  viewerUserId: string,
  profileUserId: string
) => {
  /**
   * viewerUserId  = User A
   * profileUserId = User B
   */

  if (viewerUserId === profileUserId) {
    // You can remove this check if users are allowed
    // to open their own public trust screen.
  }

  // ============================================================
  // VERIFICATION POINT CONFIG
  // ============================================================

  const VERIFICATION_POINTS = {
    GOVERNMENT_ID: 20,
    FACE_VERIFICATION: 12,
    VIDEO_VERIFICATION: 12,
    EDUCATION_VERIFICATION: 12,
    PROFESSIONAL_VERIFICATION: 14,
    INCOME_VERIFICATION: 12,
    CRIMINAL_BACKGROUND_CHECK: 18,
    EMERGENCY_CONTACT: 0,
  } as const;

  // ============================================================
  // HELPER
  // ============================================================

  const getDisplayStatus = (
    verification:
      | {
          status?: string | null;
        }
      | null
      | undefined
  ) => {
    if (!verification) {
      return "NOT_VERIFIED";
    }

    return verification.status ?? "NOT_VERIFIED";
  };

  // ---------------------------------------------------
  // 1. Get profile user
  // ---------------------------------------------------

  const user = await prisma.user.findFirst({
    where: {
      id: profileUserId,

      // Keep inactive accounts hidden.
      account_status: "ACTIVE",
      deleted_at: null,
    },

    select: {
      id: true,
      full_name: true,
      email: true,
      phone_number: true,
      is_phone_verified: true,
      birth_date: true,
      gender: true,
  created_at: true,
      profile: {
        select: {
          city: true,
          state: true,
          area: true,
        },
      },

      photos: {
        where: {
          media_type: "IMAGE",
        },

        orderBy: [
          {
            is_primary: "desc",
          },
          {
            order: "asc",
          },
        ],

        take: 1,

        select: {
          media_url: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  // ---------------------------------------------------
  // 2. Get all verification records of User B
  // ---------------------------------------------------

  const verifications =
    await prisma.userVerification.findMany({
      where: {
        userId: profileUserId,
      },

      select: {
        id: true,
        type: true,
        status: true,
        points: true,
        maxPoints: true,

        governmentIdType: true,
        verifiedName: true,
        startedAt: true,
        verifiedAt: true,
        expiresAt: true,

        provider: true,

        // Used internally only.
        // Never return raw metadata directly.
        metadata: true,
      },
    });

  // ---------------------------------------------------
  // 3. Find individual verification records
  // ---------------------------------------------------

  const governmentId = getVerification(
    verifications,
    VerificationType.GOVERNMENT_ID
  );

  const face = getVerification(
    verifications,
    VerificationType.FACE_VERIFICATION
  );

  const video = getVerification(
    verifications,
    VerificationType.VIDEO_VERIFICATION
  );

  const education = getVerification(
    verifications,
    VerificationType.EDUCATION_VERIFICATION
  );

  const educationVerification =
  await prisma.educationVerification.findFirst({
    where: {
      userId: profileUserId,
      status: VerificationStatus.VERIFIED,
    },
    select: {
      institutionName: true,
      degreeName: true,
      fieldOfStudy: true,
      startYear: true,
      graduationYear: true,
      isCurrentlyStudying: true,
      verifiedAt: true,
    },
  });

  const profession = getVerification(
    verifications,
    VerificationType.PROFESSIONAL_VERIFICATION
  );

  const manualEmployment =
  await prisma.employmentVerification.findUnique({
    where: {
      userId: profileUserId,
    },

    select: {
      companyName: true,
      joiningDate: true,
      isCurrentlyWorking: true,
      status: true,
      verifiedAt: true,
    },
  });

  const income = getVerification(
    verifications,
    VerificationType.INCOME_VERIFICATION
  );

  const criminal = getVerification(
    verifications,
    VerificationType.CRIMINAL_BACKGROUND_CHECK
  );

  const emergencyContact = getVerification(
    verifications,
    VerificationType.EMERGENCY_CONTACT
  );

  // ---------------------------------------------------
  // 4. Metadata
  // ---------------------------------------------------

  const governmentMetadata =
    safeMetadata(governmentId);

  const faceMetadata =
    safeMetadata(face);

  const videoMetadata =
    safeMetadata(video);

  const educationMetadata =
    safeMetadata(education);

  const professionMetadata =
    safeMetadata(profession);
   const latestEmployment =
  professionMetadata?.latestEmployment &&
  typeof professionMetadata.latestEmployment === "object"
    ? professionMetadata.latestEmployment
    : null;

const isGridlinesEmployment =
  profession?.provider === "GRIDLINES_EPFO";
  const incomeMetadata =
    safeMetadata(income);

  const criminalMetadata =
    safeMetadata(criminal);

  // ---------------------------------------------------
  // 5. Basic verification
  // ---------------------------------------------------

  const mobileVerified =
    user.is_phone_verified === true;

  /**
   * Replace this when you have
   * is_email_verified.
   */
  const emailVerified =
    Boolean(user.email);

  const mobileEmailVerified =
    mobileVerified && emailVerified;

  const locationVerified =
    Boolean(
      user.profile?.city &&
      user.profile?.state
    );

  // ---------------------------------------------------
  // 6. Score
  // ---------------------------------------------------

  const pointBasedVerifications = [
    governmentId,
    face,
    video,
    education,
    profession,
    income,
    criminal,
    emergencyContact,
  ].filter(Boolean);

  const earnedPoints =
    pointBasedVerifications.reduce(
      (total, verification) => {
        if (!verification) {
          return total;
        }

        if (!isVerified(verification.status)) {
          return total;
        }

        return total + (verification.points ?? 0);
      },
      0
    );

  const maxScore = 100;

  const trustScore = Math.min(
    earnedPoints,
    maxScore
  );

  // ---------------------------------------------------
  // 7. Total checks
  // ---------------------------------------------------

  const checks = [
    {
      type: "MOBILE_EMAIL",
      verified: mobileEmailVerified,
    },

    {
      type: "LOCATION",
      verified: locationVerified,
    },

    {
      type: "GOVERNMENT_ID",
      verified: isVerified(
        governmentId?.status
      ),
    },

    {
      type: "FACE_VERIFICATION",
      verified: isVerified(
        face?.status
      ),
    },

    {
      type: "VIDEO_VERIFICATION",
      verified: isVerified(
        video?.status
      ),
    },

    {
      type: "EDUCATION_VERIFICATION",
      verified: isVerified(
        education?.status
      ),
    },

    {
      type: "PROFESSIONAL_VERIFICATION",
      verified: isVerified(
        profession?.status
      ),
    },

    {
      type: "INCOME_VERIFICATION",
      verified: isVerified(
        income?.status
      ),
    },

    {
      type: "CRIMINAL_BACKGROUND_CHECK",
      verified: isVerified(
        criminal?.status
      ),
    },

    {
      type: "EMERGENCY_CONTACT",
      verified: isVerified(
        emergencyContact?.status
      ),
    },
  ];

  const totalChecks =
    checks.length;

  const verifiedChecks =
    checks.filter(
      (check) => check.verified
    ).length;

  // ---------------------------------------------------
  // 8. Badge
  // ---------------------------------------------------

  let badge = {
    key: "BASIC",
    title: "Basic verified",
  };

  if (trustScore >= 90) {
    badge = {
      key: "PLATINUM",
      title: "Platinum verified",
    };
  } else if (trustScore >= 70) {
    badge = {
      key: "GOLD",
      title: "Gold verified",
    };
  } else if (trustScore >= 40) {
    badge = {
      key: "SILVER",
      title: "Silver verified",
    };
  }

  // ---------------------------------------------------
  // 9. BASIC section
  // ---------------------------------------------------

  const basicItems = [
    {
      type: "MOBILE_EMAIL",

      title: "Mobile & Email",

      description:
        "Confirmed real contact details",

      required: true,

      points: 0,

      status: mobileEmailVerified
        ? "VERIFIED"
        : "NOT_VERIFIED",

    verifiedAt:
  mobileEmailVerified
    ? user.created_at
    : null,

      verifiedBy:
        mobileEmailVerified
          ? "OTP + email link"
          : null,

      details: [
        {
          label: "Mobile",

          value: mobileVerified
            ? maskPhoneNumber(
                user.phone_number
              )
            : "Not verified",
        },

        {
          label: "Email",

          value: emailVerified
            ? maskEmail(user.email)
            : "Not verified",
        },

        {
          label: "Status",

          value: mobileEmailVerified
            ? "Both active"
            : "Verification incomplete",
        },
      ],
    },

    {
      type: "LOCATION",

      title: "Location check",

      description:
        "City-level authenticity confirmed",

      required: true,

      points: 0,

      status: locationVerified
        ? "VERIFIED"
        : "NOT_VERIFIED",

      verifiedAt: null,

      verifiedBy:
        locationVerified
          ? "Profile location"
          : null,

      details: [
        {
          label: "City",

          value:
            [
              user.profile?.city,
              user.profile?.state,
            ]
              .filter(Boolean)
              .join(", ") ||
            "Not verified",
        },

        {
          label: "Area",

          value:
            user.profile?.area ??
            "Not verified",
        },

        {
          label: "Matches profile",

          value: locationVerified
            ? "Yes"
            : "Not verified",
        },
      ],
    },
  ];

  // ---------------------------------------------------
  // 10. IDENTITY section
  // ---------------------------------------------------
  //
  // IMPORTANT:
  // These cards are ALWAYS returned.
  // No more:
  //
  // if (governmentId) {}
  // if (face) {}
  // if (video) {}
  //
  // ---------------------------------------------------

  const identityItems: any[] = [
    // =================================================
    // GOVERNMENT ID
    // =================================================

    {
      type: "GOVERNMENT_ID",

      title: "Government ID",

      description:
        "Identity checked against an official ID",

      points:
        governmentId?.maxPoints ??
        VERIFICATION_POINTS.GOVERNMENT_ID,

      status:
        getDisplayStatus(governmentId),

      verifiedAt:
        governmentId?.verifiedAt ??
        null,

      verifiedBy:
        isVerified(governmentId?.status)
          ? governmentId?.provider ===
            "GRIDLINES"
            ? "DigiLocker API"
            : governmentId?.provider ??
              null
          : null,

      details:
        isVerified(
          governmentId?.status
        )
          ? [
              {
                label: "Document",

                value:
                  formatGovernmentIdType(
                    governmentId
                      ?.governmentIdType
                  ),
              },

              {
                label: "Name on ID",

                value:
                  governmentId
                    ?.verifiedName ??
                  "Verified",
              },

              {
                label: "Age on ID",

                value:
                  governmentMetadata.age ??
                  (user.birth_date
                    ? `${calculateAge(
                        user.birth_date
                      )} years`
                    : null),
              },

              {
                label: "Gender",

                value:
                  governmentMetadata.gender ??
                  user.gender ??
                  null,
              },

              {
                label:
                  "Profile details match",

                value:
                  governmentMetadata
                    .profileMatched ===
                  false
                    ? "No"
                    : "Yes",
              },
            ].filter(
              (item) =>
                item.value != null
            )
          : [
              {
                label: "Status",
                value: "Not verified",
              },
            ],
    },

    // =================================================
    // FACE VERIFICATION
    // =================================================

    {
      type: "FACE_VERIFICATION",

      title: "Face match",

      description:
        "Profile photo matched with the government ID photo",

      points:
        face?.maxPoints ??
        VERIFICATION_POINTS
          .FACE_VERIFICATION,

      status:
        getDisplayStatus(face),

      verifiedAt:
        face?.verifiedAt ??
        null,

      verifiedBy:
        isVerified(face?.status)
          ? face?.provider ??
            "AI face match"
          : null,

      details:
        isVerified(face?.status)
          ? [
              {
                label: "Match with ID",

                value:
                  faceMetadata
                    .matchPercentage !=
                  null
                    ? `${faceMetadata.matchPercentage}% match`
                    : "Matched",
              },

              {
                label:
                  "Profile photos",

                value:
                  faceMetadata
                    .samePerson ===
                  false
                    ? "Not matched"
                    : "Same person",
              },
            ]
          : [
              {
                label: "Status",
                value: "Not verified",
              },
            ],
    },

    // =================================================
    // VIDEO VERIFICATION
    // =================================================

    {
      type: "VIDEO_VERIFICATION",

      title: "Video liveness",

      description:
        "Live verification confirmed a present person",

      points:
        video?.maxPoints ??
        VERIFICATION_POINTS
          .VIDEO_VERIFICATION,

      status:
        getDisplayStatus(video),

      verifiedAt:
        video?.verifiedAt ??
        null,

      verifiedBy:
        isVerified(video?.status)
          ? video?.provider ??
            "Live video check"
          : null,

      details:
        isVerified(video?.status)
          ? [
              {
                label: "Liveness",

                value:
                  videoMetadata
                    .livenessResult ??
                  "Real person, live",
              },

              {
                label: "Gestures",

                value:
                  videoMetadata
                    .gesturesCompleted !=
                  null
                    ? `${videoMetadata.gesturesCompleted} completed`
                    : "Completed",
              },
            ]
          : [
              {
                label: "Status",
                value: "Not verified",
              },
            ],
    },
  ];

  // ---------------------------------------------------
  // 11. HIGH TRUST section
  // ---------------------------------------------------
  //
  // All cards are ALWAYS returned.
  // ---------------------------------------------------

  const highTrustItems: any[] = [
    // =================================================
    // EDUCATION
    // =================================================
{
  type: "EDUCATION_VERIFICATION",

  title: "Education",

  description: "Education details verified",

  points:
    education?.maxPoints ??
    VERIFICATION_POINTS.EDUCATION_VERIFICATION,

  status: getDisplayStatus(education),

  verifiedAt:
    educationVerification?.verifiedAt ??
    education?.verifiedAt ??
    null,

  verifiedBy:
    isVerified(education?.status)
      ? education?.provider ??
        "Reviewed by Welvors team"
      : null,

  details:
    isVerified(education?.status)
      ? [
          {
            label: "Degree",
            value:
              educationVerification?.degreeName ??
              "Not available",
          },
          {
            label: "Institution",
            value:
              educationVerification?.institutionName ??
              "Not available",
          },
          {
            label: "Graduation year",
            value:
              educationVerification?.isCurrentlyStudying
                ? "Currently studying"
                : educationVerification?.graduationYear != null
                  ? String(
                      educationVerification.graduationYear
                    )
                  : "Not available",
          },
        ]
      : [
          {
            label: "Status",
            value: "Not verified",
          },
        ],
},

    // =================================================
    // PROFESSION
    // =================================================

{
  type: "PROFESSIONAL_VERIFICATION",

  title: "Profession",

  description:
    "Employment details verified",

  points:
    profession?.maxPoints ??
    VERIFICATION_POINTS.PROFESSIONAL_VERIFICATION,

  status:
    getDisplayStatus(profession),

  verifiedAt:
    profession?.verifiedAt ??
    manualEmployment?.verifiedAt ??
    null,

  verifiedBy:
    isVerified(profession?.status)
      ? isGridlinesEmployment
        ? "GRIDLINES_EPFO"
        : "Reviewed by Welvors team"
      : null,

  details:
    isVerified(profession?.status)
      ? [
          {
            label: "Company",

            value: isGridlinesEmployment
              ? latestEmployment?.establishmentName ?? null
              : manualEmployment?.companyName ?? null,
          },

          {
            label: "Date of joining",

            value: isGridlinesEmployment
              ? latestEmployment?.dateOfJoining ?? null
              : manualEmployment?.joiningDate
                ? manualEmployment.joiningDate
                    .toISOString()
                    .split("T")[0]
                : null,
          },

          {
            label: "Currently employed",

            value: isGridlinesEmployment
              ? latestEmployment?.isCurrentlyEmployed === true
                ? "Yes"
                : latestEmployment?.isCurrentlyEmployed === false
                  ? "No"
                  : null
              : manualEmployment?.isCurrentlyWorking === true
                ? "Yes"
                : manualEmployment?.isCurrentlyWorking === false
                  ? "No"
                  : null,
          },
        ].filter(
          (item) => item.value != null
        )
      : [
          {
            label: "Status",
            value: "Not verified",
          },
        ],
}, 
    // =================================================
    // INCOME
    // =================================================

    {
      type: "INCOME_VERIFICATION",

      title: "Income",

      description:
        "Declared income bracket confirmed",

      points:
        income?.maxPoints ??
        VERIFICATION_POINTS
          .INCOME_VERIFICATION,

      status:
        getDisplayStatus(income),

      verifiedAt:
        income?.verifiedAt ??
        null,

      verifiedBy:
        isVerified(income?.status)
          ? income?.provider ??
            "Income verification"
          : null,

      details:
        isVerified(income?.status)
          ? [
              {
                label:
                  "Income bracket",

                value:
                  incomeMetadata
                    .incomeBracket ??
                  null,
              },

              {
                label:
                  "Matches declared",

                value:
                  incomeMetadata
                    .matchesDeclared ===
                  true
                    ? "Yes"
                    : incomeMetadata
                          .matchesDeclared ===
                        false
                      ? "No"
                      : null,
              },

              {
                label:
                  "Sources verified",

                value:
                  incomeMetadata
                    .sourcesVerified !=
                  null
                    ? String(
                        incomeMetadata
                          .sourcesVerified
                      )
                    : null,
              },
            ].filter(
              (item) =>
                item.value != null
            )
          : [
              {
                label: "Status",
                value: "Not verified",
              },
            ],
    },
  ];

  // ---------------------------------------------------
  // 12. PLATINUM section
  // ---------------------------------------------------
  //
  // All cards are ALWAYS returned.
  // ---------------------------------------------------

  const platinumItems: any[] = [
    // =================================================
    // CRIMINAL BACKGROUND
    // =================================================

    {
      type:
        "CRIMINAL_BACKGROUND_CHECK",

      title:
        "Criminal background",

      description:
        "Background records were checked",

      points:
        criminal?.maxPoints ??
        VERIFICATION_POINTS
          .CRIMINAL_BACKGROUND_CHECK,

      status:
        getDisplayStatus(criminal),

      verifiedAt:
        criminal?.verifiedAt ??
        null,

      verifiedBy:
        isVerified(
          criminal?.status
        )
          ? criminal?.provider ??
            "Background-check partner"
          : null,

      details:
        isVerified(
          criminal?.status
        )
          ? [
              {
                label:
                  "Court records",

                value:
                  criminalMetadata
                    .courtRecords ??
                  "No records found",
              },

              {
                label:
                  "Police records",

                value:
                  criminalMetadata
                    .policeRecords ??
                  "No records found",
              },

              {
                label: "Result",

                value:
                  criminalMetadata
                    .result ??
                  "No records found in checked sources",
              },
            ]
          : [
              {
                label: "Status",
                value: "Not verified",
              },
            ],
    },

    // =================================================
    // EMERGENCY CONTACT
    // =================================================

    {
      type: "EMERGENCY_CONTACT",

      title: "Emergency contact",

      description:
        "Emergency contact has been verified",

      points:
        emergencyContact
          ?.maxPoints ??
        VERIFICATION_POINTS
          .EMERGENCY_CONTACT,

      status:
        getDisplayStatus(
          emergencyContact
        ),

      verifiedAt:
        emergencyContact
          ?.verifiedAt ??
        null,

      verifiedBy:
        isVerified(
          emergencyContact?.status
        )
          ? emergencyContact
              ?.provider ??
            "Contact verification"
          : null,

      details:
        isVerified(
          emergencyContact?.status
        )
          ? [
              {
                label: "Status",
                value: "Verified",
              },
            ]
          : [
              {
                label: "Status",
                value: "Not verified",
              },
            ],
    },
  ];

  // ---------------------------------------------------
  // 13. Section helper
  // ---------------------------------------------------

  const createSection = (
    key: string,
    number: string,
    title: string,
    items: any[]
  ) => {
    const completed =
      items.filter(
        (item) =>
          item.status === "VERIFIED"
      ).length;

    const sectionEarnedPoints =
      items.reduce(
        (total, item) => {
          if (
            item.status !== "VERIFIED"
          ) {
            return total;
          }

          return (
            total +
            (item.points ?? 0)
          );
        },
        0
      );

    const maxPoints =
      items.reduce(
        (total, item) =>
          total +
          (item.points ?? 0),
        0
      );

    return {
      key,
      number,
      title,

      status:
        completed ===
          items.length &&
        items.length > 0
          ? "VERIFIED"
          : completed > 0
            ? "PARTIALLY_VERIFIED"
            : "NOT_VERIFIED",

      earnedPoints:
        sectionEarnedPoints,

      maxPoints,

      completed,

      total: items.length,

      items,
    };
  };

  // ---------------------------------------------------
  // 14. Final SAFE response
  // ---------------------------------------------------

  return {
    user: {
      id: user.id,

      name:
        user.full_name?.split(
          " "
        )[0] ?? "User",

      age:
        calculateAge(
          user.birth_date
        ),

      profilePhoto:
        user.photos[0]
          ?.media_url ??
        null,
    },

    trustScore: {
      score: trustScore,

      maxScore,

      verifiedChecks,

      totalChecks,

      badge,

      description:
        `A higher Trust Score means more of ${
          user.full_name?.split(
            " "
          )[0] ??
          "this user's"
        } identity and profile information has been independently checked.`,
    },

    privacyNotice: {
      title:
        "Verification documents stay private",

      message:
        "You only see the verification result — never the documents. Verification documents and sensitive data are not shared with other users.",
    },

    sections: [
      createSection(
        "BASIC",
        "01",
        "Basic verification",
        basicItems
      ),

      createSection(
        "IDENTITY",
        "02",
        "Identity verification",
        identityItems
      ),

      createSection(
        "HIGH_TRUST",
        "03",
        "High-trust verification",
        highTrustItems
      ),

      createSection(
        "PLATINUM",
        "04",
        "Platinum verification",
        platinumItems
      ),
    ],
  };
};


type DbClient = Prisma.TransactionClient | typeof prisma;

export const recalculateTrustScore = async (
  userId: string,
  db: DbClient = prisma
): Promise<number> => {
  const result = await db.userVerification.aggregate({
    where: {
      userId,
      status: VerificationStatus.VERIFIED,
    },
    _sum: {
      points: true,
    },
  });

  // Prevent invalid values such as > 100.
  const trustScore = Math.min(
    Math.max(result._sum.points ?? 0, 0),
    100
  );

  await db.user.update({
    where: {
      id: userId,
    },
    data: {
      trust_score: trustScore,
    },
  });

  return trustScore;
};