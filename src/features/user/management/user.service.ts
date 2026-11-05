import { prisma } from "../../../prisma/prismaClient";
import { formatLastSeen } from "../../../utils/lastSeen";
import {
  getReplyTimeLabel,
  MIN_REPLY_SAMPLES,
} from "../../chat/user-reply-stats.service";
import { getUsersPresence } from "../../lastActivity/lastActivity.service";
import { getMatchScoresForUsers } from "../../match-score/match-score.service";
import { calculateAge } from "../feed/feed.service";

//SERVICE LAYER FOR ALL USER MANAGEMENT



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


//SERVICE LAYER FOR FETCHING SINGLE USER

// SERVICE LAYER FOR FETCHING SINGLE USER WITH FULL DETAILS

// use your actual paths

const formatBirthDate = (date: Date | string | null): string | null => {
  if (!date) return null;

  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return null;
  }

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
};



export const getSingleUser = async (
  id: string,
  currentUserId?: string,
) => {
  const now = new Date();

  // ==========================================================
  // GET USER WITH ALL PROFILE DETAILS
  // ==========================================================

  const user = await prisma.user.findUnique({
    where: {
      id,
    },

    include: {
      // ---------------------------------
      // PROFILE
      // ---------------------------------
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

      // ---------------------------------
      // BIO
      // ---------------------------------
      bio: true,

      // ---------------------------------
      // INTENTION
      // ---------------------------------
      intention: true,

      // ---------------------------------
      // ABOUT
      // ---------------------------------
      about: true,

      // ---------------------------------
      // EDUCATION / WORK
      // ---------------------------------
      eduWork: {
        include: {
          profession: true,
          employmentType: true,
          experience: true,
          ambition: true,
          salaryRange: true,
        },
      },

      // ---------------------------------
      // FAMILY
      // ---------------------------------
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
              occupation: true,
              marital: true,
            },
          },
        },
      },

      // ---------------------------------
      // PHOTOS / VIDEOS
      // ---------------------------------
      photos: {
        orderBy: [
          { order: "asc" },
          { created_at: "asc" },
        ],
      },

      // ---------------------------------
      // PROMPTS
      // ---------------------------------
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

      // ---------------------------------
      // USER ANSWERS + QUESTIONS + OPTIONS
      // ---------------------------------
      answer: {
        include: {
          question: {
            include: {
              options: {
                orderBy: {
                  created_at: "asc",
                },
              },
            },
          },

          option: true,
        },

        orderBy: {
          created_at: "asc",
        },
      },

      // ---------------------------------
      // VERIFICATIONS
      // ---------------------------------
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

      // ---------------------------------
      // MEMBERSHIP PACKAGES
      // ---------------------------------
      userPackages: {
        include: {
          package: true,
          price: true,
        },

        orderBy: {
          startDate: "desc",
        },
      },

      // ---------------------------------
      // USER BOOST INVENTORY
      // ---------------------------------
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

      // ---------------------------------
      // RELATIONSHIPS
      // ---------------------------------
      relationshipsAsUser1: true,
      relationshipsAsUser2: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // ==========================================================
  // GET ALL QUESTIONS INCLUDING UNANSWERED QUESTIONS
  // ==========================================================

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

  // ==========================================================
  // MAP USER ANSWERS BY QUESTION ID
  // ==========================================================

  const userAnswersMap = new Map<
    string,
    typeof user.answer
  >();

  for (const answer of user.answer) {
    const existingAnswers =
      userAnswersMap.get(answer.question_id) ?? [];

    existingAnswers.push(answer);

    userAnswersMap.set(
      answer.question_id,
      existingAnswers,
    );
  }

  // ==========================================================
  // FORMAT QUESTIONS WITH OPTIONS AND SELECTED ANSWERS
  // ==========================================================

  const questionsWithAnswers = allQuestions.map(
    (question) => {
      const userAnswers =
        userAnswersMap.get(question.id) ?? [];

      const selectedOptionIds = new Set(
        userAnswers.map(
          (answer) => answer.option_id,
        ),
      );

      return {
        id: question.id,
        key: question.key,
        title: question.title,
        category: question.category,
        screen: question.screen,
        isMulti: question.isMulti,

        isAnswered: userAnswers.length > 0,

        options: question.options.map((option) => ({
          id: option.id,
          value: option.value,
          label: option.label,

          isSelected: selectedOptionIds.has(
            option.id,
          ),
        })),

        selectedOptions: userAnswers.map(
          (answer) => ({
            answerId: answer.id,
            id: answer.option.id,
            value: answer.option.value,
            label: answer.option.label,
            description: answer.description,
          }),
        ),
      };
    },
  );

  // ==========================================================
  // DYNAMIC FEED DETAILS
  // ==========================================================

  let matchScore = 0;
  let compatibilityScore = 0;
  let distanceKm = 0;

  let isOnline = false;
  let lastSeen: string | null = null;
  let presenceLastActiveAt: Date | null = null;

  let isBoosted = false;

  // ==========================================================
  // PRESENCE
  // ==========================================================

  if (currentUserId) {
    const presenceMap = await getUsersPresence([
      user.id,
    ]);

    const presence = presenceMap[user.id];

    if (presence) {
      isOnline = presence.isOnline || false;

      presenceLastActiveAt =
        presence.lastActiveAt || null;

      lastSeen = formatLastSeen(
        presence.lastActiveAt,
      );
    }
  }

  // ==========================================================
  // ACTIVE BOOST
  // ==========================================================

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

  isBoosted = !!activeBoost;

  // ==========================================================
  // DYNAMIC MATCH SCORE - REDIS + PRISMA
  // ==========================================================

  if (
    currentUserId &&
    currentUserId !== user.id
  ) {
    const matchScoreMap =
      await getMatchScoresForUsers(
        currentUserId,
        [user.id],
      );

    const compatibility =
      matchScoreMap.get(user.id);

    matchScore =
      compatibility?.percentage ?? 0;

    compatibilityScore =
      compatibility?.score ?? 0;
  }

  // ==========================================================
  // DISTANCE
  // ==========================================================

  if (
    currentUserId &&
    currentUserId !== user.id &&
    user.profile?.latitude != null &&
    user.profile?.longitude != null
  ) {
    const currentUser =
      await prisma.user.findUnique({
        where: {
          id: currentUserId,
        },

        select: {
          profile: {
            select: {
              latitude: true,
              longitude: true,
            },
          },
        },
      });

    if (
      currentUser?.profile?.latitude != null &&
      currentUser?.profile?.longitude != null
    ) {
      const result = await prisma.$queryRaw<
        { distance: number | null }[]
      >`
        SELECT
          ST_Distance(
            a.location::geography,
            b.location::geography
          ) AS distance
        FROM user_profiles a
        CROSS JOIN user_profiles b
        WHERE a.user_id = ${currentUserId}::uuid
          AND b.user_id = ${user.id}::uuid
          AND a.location IS NOT NULL
          AND b.location IS NOT NULL
      `;

      const distance = result[0]?.distance;

      if (distance != null) {
        distanceKm =
          Math.round(
            (Number(distance) / 1000) * 100,
          ) / 100;
      }
    }
  }

  // ==========================================================
  // TRUST SCORE
  // ==========================================================

  const trustScore = user.trust_score ?? 0;

  // ==========================================================
  // VERIFICATION STATUS
  // ==========================================================

  const isVerified = user.verifications.some(
    (verification) =>
      verification.status === "VERIFIED",
  );

  const verifiedCount = user.verifications.filter(
    (verification) =>
      verification.status === "VERIFIED",
  ).length;

  // ==========================================================
  // ACTIVE MEMBERSHIP
  // ==========================================================

  const currentPackage =
    user.userPackages.find(
      (membership) =>
        membership.status === "ACTIVE" &&
        membership.startDate <= now &&
        (
          membership.endDate === null ||
          membership.endDate > now
        ),
    ) ?? null;

  // ==========================================================
  // DYNAMIC REPLY TIME
  // ==========================================================

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
          replyStat.medianReplyMinutes,
        )
      : null;

  // ==========================================================
  // HEIGHT CONVERSION (CM TO FEET & INCHES)
  // ==========================================================

  const heightCm = user.height;

  let heightFeet: number | null = null;
  let heightInches: number | null = null;
  let heightFormatted: string | null = null;

  if (heightCm !== null && heightCm > 0) {
    const totalInches = Math.round(
      heightCm / 2.54,
    );

    heightFeet = Math.floor(
      totalInches / 12,
    );

    heightInches = totalInches % 12;

    heightFormatted =
      `${heightFeet}' ${heightInches}"`;
  }

  // ==========================================================
  // FINAL RESPONSE
  // ==========================================================

  return {
    // ---------------------------------
    // BASIC USER DETAILS
    // ---------------------------------
    id: user.id,
    full_name: user.full_name,

    birth_date: formatBirthDate(
      user.birth_date,
    ),

    age: calculateAge(user.birth_date),

    height: user.height,
    heightFormatted,

    gender: user.gender,
    gender_option: user.gender_option,

    looking_for: user.looking_for,
    looking_for_option:
      user.looking_for_option,

    created_at: user.created_at,
    last_active_at: user.last_active_at,

    // ---------------------------------
    // ACCOUNT DETAILS
    // ---------------------------------
    account_status: user.account_status,
    profile_completion: user.profile_completion,
    badge_count: user.badge_count,
    onboarding_completed:
      user.onboarding_completed,

    // ---------------------------------
    // PROFILE
    // ---------------------------------
    profile: user.profile,

    // ---------------------------------
    // BIO
    // ---------------------------------
    bio: user.bio,

    // ---------------------------------
    // INTENTION
    // ---------------------------------
    intention: user.intention,

    // ---------------------------------
    // ABOUT
    // ---------------------------------
    about: user.about,

    // ---------------------------------
    // EDUCATION / WORK
    // ---------------------------------
    eduWork: user.eduWork,

    // ---------------------------------
    // FAMILY
    // ---------------------------------
    familyProfile: user.familyProfile,

    // ---------------------------------
    // PHOTOS
    // ---------------------------------
    photos: user.photos,

    // ---------------------------------
    // PROMPTS
    // ---------------------------------
    userPrompts: user.userPrompts,

    // ---------------------------------
    // RAW USER ANSWERS
    // ---------------------------------
    answer: user.answer,

    // ---------------------------------
    // QUESTIONS WITH ALL OPTIONS
    // ---------------------------------
    questionsWithAnswers,

    // ---------------------------------
    // VERIFICATION
    // ---------------------------------
    verifications: user.verifications,
    isVerified,
    verifiedCount,

    // ---------------------------------
    // MEMBERSHIP
    // ---------------------------------
    currentPackage,
    userPackages: user.userPackages,

    // ---------------------------------
    // BOOST
    // ---------------------------------
    isBoosted,
    activeBoost,
    userBoosts: user.userBoosts,

    // ---------------------------------
    // RELATIONSHIPS
    // ---------------------------------
    relationshipsAsUser1:
      user.relationshipsAsUser1,

    relationshipsAsUser2:
      user.relationshipsAsUser2,

    // ---------------------------------
    // FEED DETAILS
    // ---------------------------------
    matchScore,
    compatibilityScore,
    distanceKm,
    trust: trustScore,
    replyTime,

    // ---------------------------------
    // PRESENCE
    // ---------------------------------
    isOnline,
    lastActiveAt: presenceLastActiveAt,
    lastSeen,
  };
};


