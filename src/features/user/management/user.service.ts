import { prisma } from "../../../prisma/prismaClient";
import { formatLastSeen } from "../../../utils/lastSeen";
import { getUsersPresence } from "../../lastActivity/lastActivity.service";
import { calculateAge } from "../feed/feed.service";

//SERVICE LAYER FOR ALL USER MANAGEMENT
export const getAllUsers = async () => {
  return prisma.user.findMany();
};

//SERVICE LAYER FOR FETCHING SINGLE USER


// SERVICE LAYER FOR FETCHING SINGLE USER WITH FULL DETAILS

 // use your actual paths

const formatBirthDate = (
  date: Date | string | null
): string | null => {
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
  currentUserId?: string
) => {
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
      // PHOTOS
      // ---------------------------------
      photos: {
        orderBy: {
          order: "asc",
        },
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
      // QUESTIONS / ANSWERS
      // ---------------------------------
      answer: {
        include: {
          question: true,
          option: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

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
    const presenceMap = await getUsersPresence([user.id]);

    const presence = presenceMap[user.id];

    if (presence) {
      isOnline = presence.isOnline || false;

      presenceLastActiveAt =
        presence.lastActiveAt || null;

      lastSeen = formatLastSeen(
        presence.lastActiveAt
      );
    }
  }

  // ==========================================================
  // BOOST
  // ==========================================================

  const now = new Date();

  const activeBoost = await prisma.boostUsage.findFirst({
    where: {
      user_id: user.id,
      is_active: true,
      ended_at: {
        gt: now,
      },
    },

    select: {
      id: true,
      user_id: true,
      ended_at: true,
    },
  });

  isBoosted = !!activeBoost;

  // ==========================================================
  // COMPATIBILITY
  // ==========================================================

  if (currentUserId) {
    const compatibility =
      await prisma.userCompatibility.findFirst({
        where: {
          userId: currentUserId,
          targetUserId: user.id,
        },

        select: {
          score: true,
          percentage: true,
        },
      });

    if (compatibility) {
      matchScore =
        compatibility.percentage || 0;

      compatibilityScore =
        compatibility.score || 0;
    }
  }

  // ==========================================================
  // DISTANCE
  // ==========================================================

  if (
    currentUserId &&
    user.profile?.latitude != null &&
    user.profile?.longitude != null
  ) {
    const currentUser = await prisma.user.findUnique({
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
      const result =
        await prisma.$queryRaw<
          { distance: number }[]
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
        `;

      if (result.length > 0) {
        distanceKm =
          Math.round(
            (Number(result[0].distance) / 1000) * 100
          ) / 100;
      }
    }
  }

  // ==========================================================
  // STATIC VALUES
  // ==========================================================

  const STATIC_TRUST = 75;
  const STATIC_REPLY_TIME = "5 m reply";

  // ==========================================================
  // FINAL RESPONSE
  // ==========================================================

  return {
    // ============================================
    // BASIC USER DATA
    // ============================================
    id: user.id,
    full_name: user.full_name,

    birth_date: formatBirthDate(
      user.birth_date
    ),

    age: calculateAge(
      user.birth_date
    ),

    height: user.height,

    created_at: user.created_at,

    last_active_at: user.last_active_at,

    // ============================================
    // PROFILE
    // ============================================
    profile: user.profile,

    // ============================================
    // BIO
    // ============================================
    bio: user.bio,

    // ============================================
    // INTENTION
    // ============================================
    intention: user.intention,

    // ============================================
    // ABOUT
    // ============================================
   about: {
  ...user.about,
  relationshipTag: "Serious Relationship",
},

    // ============================================
    // EDUCATION / WORK
    // ============================================
    eduWork: user.eduWork,

    // ============================================
    // FAMILY
    // ============================================
    familyProfile: user.familyProfile,

    // ============================================
    // PHOTOS
    // ============================================
    photos: user.photos,

    // ============================================
    // PROMPTS
    // ============================================
    userPrompts: user.userPrompts,

    // ============================================
    // ANSWERS
    // ============================================
    answer: user.answer,

    // ============================================
    // FEED FIELDS
    // ============================================
    matchScore,

    compatibilityScore,

    distanceKm,

    trust: STATIC_TRUST,

    replyTime: STATIC_REPLY_TIME,

    // ============================================
    // PRESENCE
    // ============================================
    isOnline,

    lastActiveAt: presenceLastActiveAt,

    lastSeen,

    // ============================================
    // BOOST
    // ============================================
    isBoosted,
  };
};