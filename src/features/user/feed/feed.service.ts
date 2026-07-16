import { Prisma } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";
import { buildFilterQuery } from "../../../utils/feedFilter.util";
import { formatLastSeen } from "../../../utils/lastSeen";
import { calculateMatchScore } from "../../../utils/matchScore.constants";
import { getUsersPresence } from "../../lastActivity/lastActivity.service";
import { FeedParams } from "./feed.types";

// =========================
// HELPERS
// =========================
export const calculateAge = (birthDate: Date | null) => {
  if (!birthDate) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  const month = today.getMonth() - birthDate.getMonth();

  if (
    month < 0 ||
    (month === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

export const getGenderFromInterest = (myInterest?: string): string[] => {
  const value = myInterest?.toUpperCase();
  const allGenders = [
    "MEN",
    "WOMEN",
    "NON_BINARY",
    "PREFER_NOT_TO_SAY",
  ];
  if (!value || value === "EVERYONE") {
    return allGenders;
  }
  return allGenders.includes(value) ? [value] : allGenders;
};

export const getOrientationCompatibility = (orientation?: string | null): string[] => {
  const map: Record<string, string[]> = {
    STRAIGHT: ["STRAIGHT", "BISEXUAL", "PANSEXUAL", "QUEER"],
    GAY: ["GAY", "BISEXUAL", "PANSEXUAL", "QUEER"],
    LESBIAN: ["LESBIAN", "BISEXUAL", "PANSEXUAL", "QUEER"],
    BISEXUAL: [
      "STRAIGHT",
      "GAY",
      "LESBIAN",
      "BISEXUAL",
      "PANSEXUAL",
      "QUEER",
    ],
    PANSEXUAL: [
      "STRAIGHT",
      "GAY",
      "LESBIAN",
      "BISEXUAL",
      "PANSEXUAL",
      "DEMISEXUAL",
      "QUEER",
    ],
    DEMISEXUAL: [
      "STRAIGHT",
      "GAY",
      "LESBIAN",
      "BISEXUAL",
      "PANSEXUAL",
      "DEMISEXUAL",
      "QUEER",
    ],
    QUEER: [
      "STRAIGHT",
      "GAY",
      "LESBIAN",
      "BISEXUAL",
      "PANSEXUAL",
      "DEMISEXUAL",
      "QUEER",
    ],
    ASEXUAL: ["ASEXUAL"],
    AROMATIC: ["AROMATIC"],
    NOT_LISTED: [],
  };

  return map[orientation?.toUpperCase() ?? ""] ?? [];
};

const NEW_USER_BOOST_HOURS = 48; // you can change: 24 / 48 / 72

// =========================
// FEED SERVICE
// =========================

export const getFeedService = async ({
  userId,
  cursor,
  limit,
  filters,
}: FeedParams) => {

  console.log("filter : ", filters)
  // 1. Current User
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      eduWork: {
        include: {
          profession: true,
          employmentType: true,
          experience: true,
          ambition: true,
          salaryRange: true,
        }
      },
      bio: true,
      photos: true,
      familyProfile: {
        include: {
          familyStatus: true,
          familyType: true,
          fatherOccupation: true,
          fatherOrganisation: true,
          motherOccupation: true,
          motherOrganisation: true,
          siblingRelation: true,
          siblingOccupation: true,
          siblingMarital: true,
          familyHome: true,
          nativePlace: true,
          familyIncome: true,
        }
      },
      userPrompts: {
        include: {
          prompt: true
        }
      },
      answer: {
        include: {
          question: true,
          option: true,
        },
      },
    },
  });

  if (!currentUser || !currentUser.profile) {
    throw new Error("User profile not found");
  }

  const { interested_in, sexual_orientation } = currentUser.profile;
  const { gender, gender_option } = currentUser;

  const myLatitude = Number(currentUser.profile.latitude);
  const myLongitude = Number(currentUser.profile.longitude);
  const maxDistance = currentUser.profile.max_distance_km ?? 50;

  if (!gender || !gender_option || !interested_in) {
    throw new Error("Required fields missing");
  }

  // -------------------------
  // FILTER BUILD
  // -------------------------

  console.log(JSON.stringify(filters, null, 2));

  const filterQuery = filters
    ? buildFilterQuery(filters)
    : { where: {} };

  console.log("filterQuery filter : ", filterQuery)


  const userFilters = Object.fromEntries(
    Object.entries(filterQuery.where || {}).filter(([k]) => k !== "profile"),
  );


  console.log("userFilters filter : ", userFilters)


  const profileFilters = filterQuery.where?.profile?.is || {};

  console.log("profile filter : ", profileFilters)
  // If user manually selected city/state/country,
  // don't use PostGIS nearby search.
  const hasManualLocationFilter =
    !!filters?.location?.city ||
    !!filters?.location?.state ||
    !!filters?.location?.country;
  // =========================
  // 2. EXCLUSIONS
  // =========================

  const [swipes, blocks, blockedBy] = await Promise.all([
    prisma.userSwipe.findMany({
      where: { swiperId: userId },
      select: { targetUserId: true },
    }),
    prisma.userBlock.findMany({
      where: { blockerId: userId },
      select: { blockedId: true },
    }),
    prisma.userBlock.findMany({
      where: { blockedId: userId },
      select: { blockerId: true },
    }),
  ]);

  const excludedIds = new Set<string>([
    userId,
    ...swipes.map((s) => s.targetUserId),
    ...blocks.map((b) => b.blockedId),
    ...blockedBy.map((b) => b.blockerId),
  ]);

  const excludedArray = Array.from(excludedIds);

  // =========================
  // 3. FILTER PREP
  // =========================

  const myInterest = interested_in?.toUpperCase();
  const myOrientation = sexual_orientation?.toUpperCase();

  const genderFilter = getGenderFromInterest(myInterest);
  const orientationFilter = getOrientationCompatibility(myOrientation);

  // =========================
  // 4. FETCH BASE USERS
  // =========================

  const nearbyUsers = await prisma.$queryRaw<
    { id: string; distance: number }[]
  >`
SELECT
    u.id,
    ROUND(
      (
        ST_Distance(
          p.location,
          ST_SetSRID(
            ST_MakePoint(${myLongitude}, ${myLatitude}),
            4326
          )::geography
        ) / 1000
      )::numeric,
      2
    ) AS distance
FROM users u
JOIN user_profiles p
    ON p.user_id = u.id
WHERE
    u.deleted_at IS NULL
    AND u.id <> ${userId}::uuid
    AND u.id NOT IN (
      ${Prisma.join(excludedArray.map(id => Prisma.sql`${id}::uuid`))}
    )

    ${hasManualLocationFilter
      ? Prisma.empty
      : Prisma.sql`
          AND ST_DWithin(
            p.location,
            ST_SetSRID(
              ST_MakePoint(${myLongitude}, ${myLatitude}),
              4326
            )::geography,
            ${maxDistance * 1000}
          )
        `
    };
`;
  console.log("near by users : ", nearbyUsers)

  const allUsers = await prisma.user.findMany({
    where: {
      ...(hasManualLocationFilter
        ? {}
        : {
          id: {
            in: nearbyUsers.map((u) => u.id),
          },
        }),
      ...userFilters,
      ...(Object.keys(profileFilters).length > 0 && {
        profile: {
          is: profileFilters,
        },
      }),

    },
    include: {
      profile: true,
      eduWork: {
        include: {
          profession: true,
          employmentType: true,
          experience: true,
          ambition: true,
          salaryRange: true,
        }
      },
      bio: true,
      photos: true,
      familyProfile: {
        include: {
          familyStatus: true,
          familyType: true,
          fatherOccupation: true,
          fatherOrganisation: true,
          motherOccupation: true,
          motherOrganisation: true,
          siblingRelation: true,
          siblingOccupation: true,
          siblingMarital: true,
          familyHome: true,
          nativePlace: true,
          familyIncome: true,
        }
      },
      userPrompts: {
        include: {
          prompt: true
        }
      },
      answer: {
        include: {
          question: true,
          option: true,
        },
      },
    },
  });

  const distanceMap = new Map(
    nearbyUsers.map((u) => [u.id, Number(u.distance)])
  );

  // =========================
  // 5. APPLY FILTERS (STEPWISE)
  // =========================

  // STEP 1 → Gender match (my preference)
  const genderMatched = allUsers.filter((user) =>
    genderFilter.includes(user.gender!.toUpperCase()),
  );

  // STEP 2 → Mutual interest
  const mutualInterest = genderMatched.filter(
    (user) =>
      user.profile?.interested_in?.toUpperCase() === gender?.toUpperCase(),
  );

  // STEP 3 → Orientation (they match me)
  const orientationMatched = mutualInterest.filter((user) =>
    orientationFilter.includes(user.gender_option?.toUpperCase() ?? ""),
  );

  // STEP 4 → Reverse orientation (I match them)
  const finalMatched = orientationMatched.filter((user) => {
    const theirCompatible = getOrientationCompatibility(
      user.profile?.sexual_orientation,
    );

    return theirCompatible.includes(sexual_orientation?.toUpperCase() ?? "");
  });

  // =========================
  // 6. SORT + LIMIT
  // =========================

  const users = finalMatched

  // =========================
  // 6.5 ACTIVE BOOST USERS
  // =========================

  const activeBoosts = await prisma.boostUsage.findMany({
    where: {
      is_active: true,
      ended_at: {
        gt: new Date(), // still active
      },
    },
    select: {
      user_id: true,
    },
  });

  // Convert to Set for O(1)
  const boostedUserIds = new Set(activeBoosts.map((b) => b.user_id));

  // =========================
  // 7. PRESENCE (REDIS)
  // =========================
  const userIds = users.map((u) => u.id);

  // 🔥 Fetch from Redis
  const presenceMap = await getUsersPresence(userIds);

  // =========================
  // 8. ATTACH LAST SEEN
  // =========================

  const usersWithPresence = users.map((user) => {
    const presence = presenceMap[user.id];

    const matchScore = calculateMatchScore(
      currentUser,
      user
    );

    return {
      ...user,
      matchScore,
      age: calculateAge(user.birth_date),
      isOnline: presence?.isOnline || false,
      lastActiveAt: presence?.lastActiveAt || null, // 👈 important
      lastSeen: formatLastSeen(presence?.lastActiveAt),
      createdAt: user.created_at,
      isBoosted: boostedUserIds.has(user.id),
      distanceKm: distanceMap.get(user.id) ?? null,
    };
  });

  console.log("Users with presence info:", usersWithPresence);

  const sortedUsers = usersWithPresence.sort((a, b) => {
    const now = Date.now();

    const aActivity = a.lastActiveAt?.getTime() || 0;
    const bActivity = b.lastActiveAt?.getTime() || 0;

    const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;

    const boostWindow = NEW_USER_BOOST_HOURS * 60 * 60 * 1000;

    const aIsNew = now - aCreated < boostWindow;
    const bIsNew = now - bCreated < boostWindow;

    // 🔥 1. PAID BOOST (HIGHEST PRIORITY)
    if (a.isBoosted && !b.isBoosted) return -1;
    if (!a.isBoosted && b.isBoosted) return 1;

    // 🔥 2. NEW USER BOOST
    if (aIsNew && !bIsNew) return -1;
    if (!aIsNew && bIsNew) return 1;

    // 🔥 3. Match Score
    if (a.matchScore !== b.matchScore) {
      return Number(b.matchScore) - Number(a.matchScore);
    }
    // 🔥 4. RECENT ACTIVITY
    return bActivity - aActivity;

  });

  // =========================
  // RESPONSE
  // =========================

  return {
    users: sortedUsers,
    nextCursor: null,
  };
};
