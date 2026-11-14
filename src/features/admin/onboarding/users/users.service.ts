
import connectPostgres from "../../../../config/db";
import { prisma } from "../../../../prisma/prismaClient";
import { formatLastSeen } from "../../../../utils/lastSeen";
import { getReplyTimeLabel, MIN_REPLY_SAMPLES } from "../../../chat/user-reply-stats.service";
import { getUsersPresence } from "../../../lastActivity/lastActivity.service";
import { User } from "./users.types";

export const getAllUsers = async () => {
  const now = new Date();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      full_name: true,
      birth_date: true,
      gender: true,
      height: true,
      trust_score: true,
      account_status: true,

      profile: {
        select: {
          city: true,
        },
      },

      userPackages: {
        where: {
          status: "ACTIVE",
          startDate: {
            lte: now,
          },
          OR: [
            { endDate: null },
            { endDate: { gt: now } },
          ],
        },
        select: {
          currentPackage: {
            select: {
              name: true,
            },
          },
          package: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          startDate: "desc",
        },
        take: 1,
      },

      wallet: {
        select: {
          balance: true,
        },
      },
      
photos: {
  where: {
    media_type: "IMAGE",
  },
  select: {
    media_url: true,
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
  take: 1,
},

    },

    orderBy: {
      created_at: "desc",
    },
  });

  return users.map((user) => {
    let age: number | null = null;

    if (user.birth_date) {
      const today = new Date();
      const birthDate = new Date(user.birth_date);

      age =
        today.getUTCFullYear() -
        birthDate.getUTCFullYear();

      const monthDifference =
        today.getUTCMonth() -
        birthDate.getUTCMonth();

      if (
        monthDifference < 0 ||
        (monthDifference === 0 &&
          today.getUTCDate() < birthDate.getUTCDate())
      ) {
        age--;
      }
    }

    const activePackage = user.userPackages[0];

    const packageName =
      activePackage?.currentPackage?.name ??
      activePackage?.package?.name ??
      "FREE";

    return {
      id: user.id,
      userName: user.full_name,
      profilePhoto: user.photos[0]?.media_url ?? null,
      city: user.profile?.city ?? null,
      gender: user.gender,
      height: user.height,
      age,
      package: packageName,
      trustScore: user.trust_score,
      walletBalance: Number(user.wallet?.balance ?? 0),
      status: user.account_status,
    };
  });
};








// Keep your existing imports for:
// getUsersPresence
// formatLastSeen
// getReplyTimeLabel
// MIN_REPLY_SAMPLES

// ==========================================
// HELPER: FORMAT BIRTH DATE
// ==========================================

const formatBirthDate = (
  date: Date | string | null
): string | null => {
  if (!date) return null;

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return null;

  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();

  return `${day}-${month}-${year}`;
};

// ==========================================
// HELPER: CALCULATE AGE
// ==========================================

const getUserAge = (
  birthDate: Date | null
): number | null => {
  if (!birthDate) return null;

  const today = new Date();
  const dob = new Date(birthDate);

  if (Number.isNaN(dob.getTime())) return null;

  let age =
    today.getUTCFullYear() - dob.getUTCFullYear();

  const monthDiff =
    today.getUTCMonth() - dob.getUTCMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 &&
      today.getUTCDate() < dob.getUTCDate())
  ) {
    age--;
  }

  return age >= 0 ? age : null;
};

// ==========================================
// GET SINGLE USER BY ID
// ==========================================

export const getSingleUser = async (id: string) => {
  const now = new Date();

  // ==========================================
  // 1. FETCH USER WITH RELATIONS
  // ==========================================

  const user = await prisma.user.findUnique({
    where: { id },

    include: {
      profile: {
        include: {
          religion: true,
          community: true,
          languages: {
            include: {
              language: true,
            },
          },
        },
      },

      bio: true,

      intention: {
        include: {
          intention: true,
        },
      },

      about: true,

      eduWork: {
        include: {
          profession: true,
          employmentType: true,
          experience: true,
          ambition: true,
          salaryRange: true,
        },
      },

      familyProfile: {
        include: {
          familyStatus: true,
          familyType: true,
          fatherOccupation: true,
          fatherOrganisation: true,
          motherOccupation: true,
          motherOrganisation: true,
          familyHome: true,
          nativePlace: true,
          familyIncome: true,

          siblings: {
            include: {
              siblingType: true,
              marital: true,
              occupation: true,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },

      photos: {
        orderBy: [
          { is_primary: "desc" },
          { order: "asc" },
          { created_at: "asc" },
        ],
      },

      userPrompts: {
        include: {
          prompt: {
            include: {
              category: true,
            },
          },
        },
        orderBy: {
          displayOrder: "asc",
        },
      },

      answer: {
        include: {
          question: true,
          option: true,
        },
        orderBy: {
          created_at: "asc",
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
        },
        orderBy: {
          createdAt: "asc",
        },
      },

      userPackages: {
        include: {
          package: true,
          price: true,
        },
        orderBy: {
          startDate: "desc",
        },
      },

      userBoosts: {
        select: {
          id: true,
          boostId: true,
          boost_option_id: true,
          total_boosts: true,
          remaining_boosts: true,
          weeklyLimit: true,
          last_reset_at: true,
          next_reset_at: true,
          start_at: true,
          expires_at: true,
          is_active: true,
          created_at: true,
        },
      },

      relationshipsAsUser1: true,
      relationshipsAsUser2: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // ==========================================
  // 2. FETCH ALL QUESTIONS
  // ==========================================

  const allQuestions = await prisma.question.findMany({
    include: {
      options: {
        orderBy: {
          created_at: "asc",
        },
      },
    },
    orderBy: {
      created_at: "asc",
    },
  });

  // ==========================================
  // 3. GROUP USER ANSWERS BY QUESTION
  // ==========================================

  const userAnswersMap = new Map<
    string,
    typeof user.answer
  >();

  for (const answer of user.answer) {
    const existing =
      userAnswersMap.get(answer.question_id) ?? [];

    existing.push(answer);

    userAnswersMap.set(
      answer.question_id,
      existing
    );
  }

  // ==========================================
  // 4. QUESTIONS WITH SELECTED OPTIONS
  // ==========================================

  const questionsWithAnswers = allQuestions.map(
    (question) => {
      const userAnswers =
        userAnswersMap.get(question.id) ?? [];

      const selectedOptionIds = new Set(
        userAnswers.map(
          (answer) => answer.option_id
        )
      );

      return {
        id: question.id,
        key: question.key,
        title: question.title,
        category: question.category,
        screen: question.screen,
        isMulti: question.isMulti,

        isAnswered: userAnswers.length > 0,

        options: question.options.map(
          (option) => ({
            id: option.id,
            value: option.value,
            label: option.label,
            isSelected: selectedOptionIds.has(
              option.id
            ),
          })
        ),

        selectedOptions: userAnswers.map(
          (answer) => ({
            answerId: answer.id,
            id: answer.option.id,
            value: answer.option.value,
            label: answer.option.label,
            description: answer.description,
          })
        ),
      };
    }
  );

  // ==========================================
  // 5. USER PRESENCE
  // ==========================================

  let isOnline = false;
  let lastSeen: string | null = null;
  let presenceLastActiveAt: Date | null = null;

  const presenceMap = await getUsersPresence([
    user.id,
  ]);

  const presence = presenceMap[user.id];

  if (presence) {
    isOnline = presence.isOnline ?? false;

    presenceLastActiveAt =
      presence.lastActiveAt ?? null;

    if (presence.lastActiveAt) {
      lastSeen = formatLastSeen(
        presence.lastActiveAt
      );
    }
  }

  if (!lastSeen && user.last_active_at) {
    lastSeen = formatLastSeen(
      user.last_active_at
    );
  }

  // ==========================================
  // 6. ACTIVE BOOST
  // ==========================================

  const activeBoost =
    await prisma.boostUsage.findFirst({
      where: {
        user_id: user.id,
        is_active: true,
        started_at: {
          lte: now,
        },
        expected_end_at: {
          gt: now,
        },
      },
      select: {
        id: true,
        user_id: true,
        started_at: true,
        expected_end_at: true,
      },
    });

  const isBoosted = activeBoost !== null;

  // ==========================================
  // 7. MATCH SCORE
  // ==========================================

  // Not applicable without a second user.
  const matchScore: number | null = null;
  const compatibilityScore: number | null = null;

  // ==========================================
  // 8. DISTANCE
  // ==========================================

  // Not applicable without a second user.
  const distanceKm: number | null = null;

  // ==========================================
  // 9. TRUST AND VERIFICATION
  // ==========================================

  const trustScore = user.trust_score ?? 0;

  const verifiedCount =
    user.verifications.filter(
      (verification) =>
        verification.status === "VERIFIED"
    ).length;

  const isVerified = verifiedCount > 0;

  // ==========================================
  // 10. CURRENT MEMBERSHIP
  // ==========================================

  const currentPackage =
    user.userPackages.find(
      (membership) =>
        membership.status === "ACTIVE" &&
        membership.startDate <= now &&
        (
          membership.endDate === null ||
          membership.endDate > now
        )
    ) ?? null;

  // ==========================================
  // 11. REPLY TIME
  // ==========================================

  const replyStat =
    await prisma.userReplyStats.findUnique({
      where: {
        userId: user.id,
      },
      select: {
        medianReplyMinutes: true,
        sampleCount: true,
      },
    });

  const replyTime =
    replyStat &&
    replyStat.medianReplyMinutes !== null &&
    replyStat.sampleCount >= MIN_REPLY_SAMPLES
      ? getReplyTimeLabel(
          replyStat.medianReplyMinutes
        )
      : null;

  // ==========================================
  // 12. HEIGHT CONVERSION
  // ==========================================

  let heightFormatted: string | null = null;

  if (
    user.height !== null &&
    user.height > 0
  ) {
    const totalInches = Math.round(
      user.height / 2.54
    );

    const feet = Math.floor(
      totalInches / 12
    );

    const inches = totalInches % 12;

    heightFormatted = `${feet}' ${inches}"`;
  }

  // ==========================================
  // 13. PROFILE PHOTO
  // ==========================================

  const profilePhoto =
    user.photos.find(
      (photo) =>
        photo.media_type === "IMAGE"
    )?.media_url ?? null;

  // ==========================================
  // 14. FINAL RESPONSE
  // ==========================================

  return {
    // BASIC DETAILS
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    phone_number: user.phone_number,
    is_phone_verified: user.is_phone_verified,
    google_id: user.google_id,

    birth_date: formatBirthDate(
      user.birth_date
    ),
    age: getUserAge(user.birth_date),

    height: user.height,
    heightFormatted,

    gender: user.gender,
    gender_option: user.gender_option,
    looking_for: user.looking_for,
    looking_for_option:
      user.looking_for_option,

    // INTENTION
    intentionId: user.intentionId,
    intention: user.intention
      ? {
          id: user.intention.id,
          option: user.intention.option,
          optDescription:
            user.intention.optDescription,
          intentionId:
            user.intention.intentionId,
          details: user.intention.intention,
        }
      : null,

    // ACCOUNT DETAILS
    onboarding_step: user.onboarding_step,
    next_step: user.next_step,
    onboarding_completed:
      user.onboarding_completed,

    referralCode: user.referralCode,
    badge_count: user.badge_count,
    trust_score: user.trust_score,
    profile_completion:
      user.profile_completion,

    account_status: user.account_status,
    paused_at: user.paused_at,
    pause_reason: user.pause_reason,
    deleted_at: user.deleted_at,

    created_at: user.created_at,
    updated_at: user.updated_at,
    last_active_at: user.last_active_at,

    // ABOUT — ONLY THREE FIELDS
    about: user.about
      ? {
          zodiac: user.about.zodiac,
          loveLanguage:
            user.about.loveLanguage,
          communicationStyle:
            user.about.communicationStyle,
        }
      : null,

    // PROFILE
    profile: user.profile
      ? {
          religionId:
            user.profile.religionId,
          religion:
            user.profile.religion,

          communityId:
            user.profile.communityId,
          community:
            user.profile.community,

          languages:
            user.profile.languages.map(
              (item) => item.language
            ),

          interested_in:
            user.profile.interested_in,

          sexual_orientation:
            user.profile.sexual_orientation,

          country: user.profile.country,
          state: user.profile.state,
          city: user.profile.city,
          area: user.profile.area,

          max_distance_km:
            user.profile.max_distance_km,

          latitude:
            user.profile.latitude?.toNumber()
              ?? null,

          longitude:
            user.profile.longitude?.toNumber()
              ?? null,

          created_at:
            user.profile.created_at,
          updated_at:
            user.profile.updated_at,
        }
      : null,

    // BIO
    bio: user.bio,

    // EDUCATION AND WORK
    eduWork: user.eduWork
      ? {
          highestEdu:
            user.eduWork.highestEdu,
          degree: user.eduWork.degree,
          collegeName:
            user.eduWork.collegeName,
          graduationYear:
            user.eduWork.graduationYear,

          professionId:
            user.eduWork.professionId,
          profession:
            user.eduWork.profession,

          companyName:
            user.eduWork.companyName,

          employmentTypeId:
            user.eduWork.employmentTypeId,
          employmentType:
            user.eduWork.employmentType,

          experienceId:
            user.eduWork.experienceId,
          experience:
            user.eduWork.experience,

          ambitionId:
            user.eduWork.ambitionId,
          ambition:
            user.eduWork.ambition,

          salaryRangeId:
            user.eduWork.salaryRangeId,
          salaryRange:
            user.eduWork.salaryRange,

          bigDreams:
            user.eduWork.bigDreams,

          createdAt:
            user.eduWork.createdAt,
          updatedAt:
            user.eduWork.updatedAt,
        }
      : null,

    // FAMILY DETAILS
    familyProfile: user.familyProfile
      ? {
          id: user.familyProfile.id,

          familyStatusId:
            user.familyProfile.familyStatusId,
          familyStatus:
            user.familyProfile.familyStatus?.value
              ?? null,

          familyTypeId:
            user.familyProfile.familyTypeId,
          familyType:
            user.familyProfile.familyType?.value
              ?? null,

          fatherOccupationId:
            user.familyProfile.fatherOccupationId,
          fatherOccupation:
            user.familyProfile.fatherOccupation?.value
              ?? null,

          fatherOrganisationId:
            user.familyProfile.fatherOrganisationId,
          fatherOrganisation:
            user.familyProfile.fatherOrganisation?.value
              ?? null,

          motherOccupationId:
            user.familyProfile.motherOccupationId,
          motherOccupation:
            user.familyProfile.motherOccupation?.value
              ?? null,

          motherOrganisationId:
            user.familyProfile.motherOrganisationId,
          motherOrganisation:
            user.familyProfile.motherOrganisation?.value
              ?? null,

          familyHomeId:
            user.familyProfile.familyHomeId,
          familyHome:
            user.familyProfile.familyHome?.value
              ?? null,

          nativePlaceId:
            user.familyProfile.nativePlaceId,
          nativePlace:
            user.familyProfile.nativePlace?.value
              ?? null,

          familyIncomeId:
            user.familyProfile.familyIncomeId,
          familyIncome:
            user.familyProfile.familyIncome,

          siblings:
            user.familyProfile.siblings.map(
              (sibling) => ({
                id: sibling.id,

                siblingTypeId:
                  sibling.siblingTypeId,
                siblingType:
                  sibling.siblingType.value,

                maritalId:
                  sibling.maritalId,
                marital:
                  sibling.marital?.value ?? null,

                occupationId:
                  sibling.occupationId,
                occupation:
                  sibling.occupation?.value
                    ?? null,

                createdAt:
                  sibling.createdAt,
                updatedAt:
                  sibling.updatedAt,
              })
            ),

          createdAt:
            user.familyProfile.createdAt,
          updatedAt:
            user.familyProfile.updatedAt,
        }
      : null,

    // MEDIA
    profilePhoto,
    photos: user.photos,

    // PROMPTS
    userPrompts: user.userPrompts,

    // USER ANSWERS
    answer: user.answer.map(
      (answer) => ({
        id: answer.id,
        questionId: answer.question_id,
        questionTitle:
          answer.question.title,
        questionKey:
          answer.question.key,
        optionId: answer.option_id,
        optionValue:
          answer.option.value,
        optionLabel:
          answer.option.label,
        description:
          answer.description,
      })
    ),

    // ALL QUESTIONS
    questionsWithAnswers,

    // VERIFICATION
    verifications:
      user.verifications,
    isVerified,
    verifiedCount,

    // MEMBERSHIP
    currentPackage,
    userPackages:
      user.userPackages,

    // BOOST
    isBoosted,
    activeBoost,
    userBoosts:
      user.userBoosts,

    // RELATIONSHIPS
    relationshipsAsUser1:
      user.relationshipsAsUser1,

    relationshipsAsUser2:
      user.relationshipsAsUser2,

    // FEED
    matchScore,
    compatibilityScore,
    distanceKm,
    trust: trustScore,
    replyTime,

    // PRESENCE
    isOnline,
    lastActiveAt:
      presenceLastActiveAt,
    lastSeen,
  };
};

