
import { Prisma } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";
import { buildFilterQuery } from "../../../utils/feedFilter.util";
import { formatLastSeen } from "../../../utils/lastSeen";
import { getUsersPresence } from "../../lastActivity/lastActivity.service";
import { CurrentUser, FeedParams, UserFeedResponse } from "./feed.types";
import { redis } from "../../../lib/redis";

/**
 * PERFORMANCE PREREQUISITES (run these migrations — code cannot substitute):
 *   CREATE INDEX CONCURRENTLY idx_user_profiles_location
 *     ON user_profiles USING GIST (location);
 *   CREATE INDEX CONCURRENTLY idx_swipes_swiper_target
 *     ON swipes ("swiperId", "targetUserId");
 *   CREATE INDEX CONCURRENTLY idx_userblock_blocker
 *     ON "UserBlock" ("blockerId", "blockedId");
 *   CREATE INDEX CONCURRENTLY idx_userblock_blocked
 *     ON "UserBlock" ("blockedId", "blockerId");
 *   CREATE INDEX CONCURRENTLY idx_boost_active
 *     ON boost_usage (user_id) WHERE is_active;
 * Verify with: EXPLAIN (ANALYZE, BUFFERS) <feed query>  -> no "Seq Scan".
 */

// =========================
// HELPERS
// =========================
const CACHE_TTL = 604800;


type UserSiblingWithDetails = Prisma.UserSiblingGetPayload<{
  include: {
    siblingType: true;
    occupation: true;
    marital: true;
  };
}>;

export const calculateAge = (
  birthDate: Date | string | null
): number | null => {
  if (!birthDate) return null;

  const dob =
    birthDate instanceof Date
      ? birthDate
      : new Date(birthDate);

  if (isNaN(dob.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dob.getDate())
  ) {
    age--;
  }

  return age;
};

export const getGenderFromInterest = (myInterest?: string): string[] => {
  const value = myInterest?.toUpperCase();
  const allGenders = ["MEN", "WOMEN", "NON_BINARY", "PREFER_NOT_TO_SAY"];
  if (!value || value === "EVERYONE") return allGenders;
  return allGenders.includes(value) ? [value] : allGenders;
};

export const getOrientationCompatibility = (
  orientation?: string | null,
): string[] => {
  const map: Record<string, string[]> = {
    STRAIGHT: ["STRAIGHT", "BISEXUAL", "PANSEXUAL", "QUEER"],
    GAY: ["GAY", "BISEXUAL", "PANSEXUAL", "QUEER"],
    LESBIAN: ["LESBIAN", "BISEXUAL", "PANSEXUAL", "QUEER"],
    BISEXUAL: ["STRAIGHT", "GAY", "LESBIAN", "BISEXUAL", "PANSEXUAL", "QUEER"],
    PANSEXUAL: ["STRAIGHT", "GAY", "LESBIAN", "BISEXUAL", "PANSEXUAL", "DEMISEXUAL", "QUEER"],
    DEMISEXUAL: ["STRAIGHT", "GAY", "LESBIAN", "BISEXUAL", "PANSEXUAL", "DEMISEXUAL", "QUEER"],
    QUEER: ["STRAIGHT", "GAY", "LESBIAN", "BISEXUAL", "PANSEXUAL", "DEMISEXUAL", "QUEER"],
    ASEXUAL: ["ASEXUAL"],
    AROMATIC: ["AROMATIC"],
    NOT_LISTED: [],
  };
  return map[orientation?.toUpperCase() ?? ""] ?? [];
};

// =========================
// CONFIG
// =========================
const ALL_INTEREST_VALUES = ["MEN", "WOMEN", "NON_BINARY", "PREFER_NOT_TO_SAY", "EVERYONE"];
const ALL_ORIENTATIONS = [
  "STRAIGHT", "GAY", "LESBIAN", "BISEXUAL", "PANSEXUAL",
  "DEMISEXUAL", "QUEER", "ASEXUAL", "AROMATIC", "NOT_LISTED",
];

const NEW_USER_BOOST_HOURS = 48;
const DEFAULT_PAGE_LIMIT = 20;
const OVERFETCH = 1.5;
const MAX_ROUNDS = 5;
const STATIC_MATCH_SCORE = 78;
const STATIC_TRUST = 75;
const STATIC_REPLY_TIME = "5 m reply";

// VERIFY which column stores orientation. Unified on profile.sexual_orientation.
const ORIENTATION_TABLE = "p"; // "p" = user_profiles, "u" = users
const ORIENTATION_COL = "sexual_orientation";

// =========================
// CURSOR (keyset)
// =========================
type Cursor = { k: number; id: string };

const encodeCursor = (c: Cursor): string =>
  Buffer.from(JSON.stringify(c)).toString("base64url");

const decodeCursor = (raw?: string | null): Cursor | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof parsed?.k === "number" && typeof parsed?.id === "string") {
      return parsed as Cursor;
    }
    return null;
  } catch {
    return null;
  }
};

// =========================
// FEED SERVICE (OPTIMIZED - MINIMAL DATA FETCH)
// =========================
export const getFeedService = async ({
  userId,
  cursor,
  limit,
  filters,
}: FeedParams) => {
  const pageLimit = limit ?? DEFAULT_PAGE_LIMIT;
  const decodedCursor = decodeCursor(cursor as string | undefined);
  const now = new Date();

  // -------------------------
  // 1. CURRENT USER - MINIMAL FIELDS FOR FILTERING ONLY
  // -------------------------
  const USER_CACHE_TTL = 60 * 10; // 10 minutes
  const USER_CACHE_KEY = `feed:user:${userId}`;

  const currentUserPromise = async () => {
    const cached = await redis.get<any>(USER_CACHE_KEY);

    if (cached) {
      return cached;
    }

    // ONLY fetch fields needed for filtering - no bio, eduWork, photos, answers
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        gender: true,
        profile: {
          select: {
            interested_in: true,
            sexual_orientation: true,
            latitude: true,
            longitude: true,
            max_distance_km: true,
          },
        },
      },
    });

    if (user) {
      await redis.set(USER_CACHE_KEY, user, {
        ex: USER_CACHE_TTL,
      });
    }

    return user;
  };

  // -------------------------
  // 2. ACTIVE BOOSTS
  // -------------------------

  const formatBirthDate = (date: Date | string | null): string | null => {
    if (!date) return null;

    const d = new Date(date);
    if (isNaN(d.getTime())) return null;

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  };

  const start = performance.now();

  await prisma.$queryRaw`
  SELECT 1;
`;

  console.log(
    "SELECT 1:",
    performance.now() - start,
    "ms"
  );

  const start1 = performance.now();
  const [currentUser] = await Promise.all([
    currentUserPromise(),
    // REMOVED: boostPromise() - Don't fetch all boosts upfront!
  ]);
  console.log(
    "current user + boosts:",
    performance.now() - start1
  );

  if (!currentUser || !currentUser.profile) {
    throw new Error("User profile not found");
  }

 // -------------------------
// VIP PACKAGE CHECK
// VIP + VIP_ELITE
// -------------------------

// -------------------------
// VIP / VIP_ELITE PACKAGE CHECK
// -------------------------

const activeVipPackage = await prisma.userPackage.findFirst({
  where: {
    user_id: userId,
    status: "ACTIVE",

    package: {
      name: {
        in: ["VIP", "VIP_ELITE"],
      },
    },

    OR: [
      {
        endDate: null,
      },
      {
        endDate: {
          gt: new Date(),
        },
      },
    ],
  },
  select: {
    id: true,
    package: {
      select: {
        name: true,
      },
    },
  },
});

const hasActiveVip = !!activeVipPackage;

console.log("ACTIVE VIP PACKAGE:", activeVipPackage);
console.log("HAS ACTIVE VIP/VIP_ELITE:", hasActiveVip);
  // const boostedUserIds = new Set(activeBoosts.map((b) => b.user_id));

  const { interested_in, sexual_orientation } = currentUser.profile;
  const { gender } = currentUser;

  if (!gender || !interested_in) {
    throw new Error("Required fields missing");
  }

  const myGender = gender.toUpperCase();
  const myInterest = interested_in.toUpperCase();
  const myOrientation = (sexual_orientation ?? "").toUpperCase();

  const myLatitude = Number(currentUser.profile.latitude);
  const myLongitude = Number(currentUser.profile.longitude);
  const maxDistance = currentUser.profile.max_distance_km ?? 50;

  // -------------------------
  // 3. PRECOMPUTE MATCH FILTERS
  // -------------------------
  const genderFilter = getGenderFromInterest(myInterest);

  const interestedInFilter = ALL_INTEREST_VALUES.filter((v) =>
    getGenderFromInterest(v).includes(myGender),
  );

  const orientationForward = getOrientationCompatibility(myOrientation);
  const orientationReverse = ALL_ORIENTATIONS.filter((o) =>
    getOrientationCompatibility(o).includes(myOrientation),
  );

  if (orientationForward.length === 0 || orientationReverse.length === 0) {
    return { users: [], nextCursor: null };
  }

  // -------------------------
  // UI structured filters
  // -------------------------
// -------------------------
// VIP-ONLY FILTER CHECK
// -------------------------

if (
  filters?.ambitionIds &&
  filters.ambitionIds.length > 0
) {
  if (!hasActiveVip) {
    return {
      users: [],
      nextCursor: null,
      filterRestricted: true,
      message: "Ambition filter is available only for VIP and VIP Elite users.",
    };
  }
}



// -------------------------
// FAMILY INCOME RANGE
// VIP ONLY
// -------------------------

let familyIncomeIds: number[] = [];

if (
  filters?.familyIncomeMin !== undefined ||
  filters?.familyIncomeMax !== undefined
) {
  // Check VIP access
  if (!hasActiveVip) {
    return {
      users: [],
      nextCursor: null,
      filterRestricted: true,
      message:
        "Family income filter is available only for VIP and VIP Elite users.",
    };
  }

  const minAmount = filters.familyIncomeMin ?? 0;
  const maxAmount =
    filters.familyIncomeMax ?? Number.MAX_SAFE_INTEGER;

  const matchingIncomeRanges =
    await prisma.familyIncome.findMany({
      where: {
        active: true,

        AND: [
          {
            minAmount: {
              lte: maxAmount,
            },
          },
          {
            OR: [
              {
                maxAmount: null,
              },
              {
                maxAmount: {
                  gte: minAmount,
                },
              },
            ],
          },
        ],
      },

      select: {
        id: true,
        title: true,
        minAmount: true,
        maxAmount: true,
      },
    });

  familyIncomeIds = matchingIncomeRanges.map(
    (income) => income.id
  );

  console.log(
    "MATCHING FAMILY INCOME:",
    matchingIncomeRanges
  );

  console.log(
    "MATCHING FAMILY INCOME IDS:",
    familyIncomeIds
  );
}

if (
  filters?.networkingIntentIds &&
  filters.networkingIntentIds.length > 0
) {
  if (!hasActiveVip) {
    return {
      users: [],
      nextCursor: null,
      filterRestricted: true,
      message:
        "Networking Intent filter is available only for active VIP or VIP Elite users.",
    };
  }
}
// -------------------------
// BUILD FILTER QUERY
// -------------------------

const filterQuery = filters
  ? buildFilterQuery({
      ...filters,
      familyIncomeIds,
    })
  : { where: {} };

// -------------------------
// DISTANCE
// -------------------------

const distanceKm =
  filters?.distanceKm ||
  currentUser.profile.max_distance_km ||
  50;

console.log(
  "FINAL FILTER QUERY:",
  JSON.stringify(filterQuery, null, 2)
); 

  const userFilters = Object.fromEntries(
    Object.entries(filterQuery.where || {}).filter(([k]) => k !== "profile"),
  );
  const profileFilters = filterQuery.where?.profile?.is || {};

  const hasManualLocationFilter =
    !!filters?.location?.city ||
    !!filters?.location?.state ||
    !!filters?.location?.country;

  // -------------------------
  // SQL fragments
  // -------------------------
  const orientCol = Prisma.raw(`${ORIENTATION_TABLE}.${ORIENTATION_COL}`);
  const me = Prisma.sql`ST_SetSRID(ST_MakePoint(${myLongitude}, ${myLatitude}), 4326)::geography`;

  const matchConditions = Prisma.sql`
    u.deleted_at IS NULL
    AND u.id <> ${userId}::uuid
    AND NOT EXISTS (
      SELECT 1 FROM swipes s
      WHERE s."swiperId" = ${userId}::uuid AND s."targetUserId" = u.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM "UserBlock" b
      WHERE (b."blockerId"::uuid = ${userId}::uuid AND b."blockedId"::uuid = u.id)
         OR (b."blockedId"::uuid = ${userId}::uuid AND b."blockerId"::uuid = u.id)
    )
    AND u.gender::text = ANY(ARRAY[${Prisma.join(genderFilter)}]::text[])
    AND p.interested_in::text = ANY(ARRAY[${Prisma.join(interestedInFilter)}]::text[])
    AND ${orientCol}::text = ANY(ARRAY[${Prisma.join(orientationForward)}]::text[])
    AND ${orientCol}::text = ANY(ARRAY[${Prisma.join(orientationReverse)}]::text[])
  `;

  // -------------------------
  // Page fetch loop
  // -------------------------
  const batchSize = Math.max(pageLimit * OVERFETCH, 30);
  const collected: any[] = [];
  const meterById = new Map<string, number>();

  let cursorState: Cursor | null = decodedCursor;
  let nextCursor: string | null = null;
  let filledCursor: Cursor | null = null;

  for (let round = 0; round < MAX_ROUNDS && collected.length < pageLimit; round++) {
    let rows: { id: string; sort_val: number }[];

    if (hasManualLocationFilter) {
      const candidateStart = performance.now();
      rows = await prisma.$queryRaw<{ id: string; sort_val: number }[]>`
        SELECT
          u.id,
          (EXTRACT(EPOCH FROM u.created_at) * 1000)::float8 AS sort_val
        FROM users u
        JOIN user_profiles p ON p.user_id = u.id
        WHERE ${matchConditions}
          ${cursorState
          ? Prisma.sql`AND (
                (EXTRACT(EPOCH FROM u.created_at) * 1000) < ${cursorState.k}
                OR ((EXTRACT(EPOCH FROM u.created_at) * 1000) = ${cursorState.k} AND u.id < ${cursorState.id}::uuid)
              )`
          : Prisma.empty}
        ORDER BY sort_val DESC, u.id DESC
        LIMIT ${batchSize};
      `;
      console.log(
        `candidate query round ${round}:`,
        performance.now() - candidateStart,
        "ms",
        "rows:",
        rows.length
      );
    } else {
      const distanceLimit = distanceKm;
      const candidateStart = performance.now();
      rows = await prisma.$queryRaw<{ id: string; sort_val: number }[]>`
        SELECT
          u.id,
          (p.location::geography <-> ${me})::float8 AS sort_val
        FROM users u
        JOIN user_profiles p ON p.user_id = u.id
        WHERE ${matchConditions}
          AND ST_DWithin(p.location::geography, ${me}, ${distanceLimit * 1000})
          ${cursorState
          ? Prisma.sql`AND (
                (p.location::geography <-> ${me}) > ${cursorState.k}
                OR (
                  (p.location::geography <-> ${me}) = ${cursorState.k}
                  AND u.id > ${cursorState.id}::uuid
                )
              )`
          : Prisma.empty}
        ORDER BY p.location::geography <-> ${me} ASC, u.id ASC
        LIMIT ${batchSize};
      `;
      console.log(
        `candidate query round ${round}:`,
        performance.now() - candidateStart,
        "ms",
        "rows:",
        rows.length
      );
    }

    if (rows.length === 0) break;

    if (!hasManualLocationFilter) {
      for (const r of rows) meterById.set(r.id, Number(r.sort_val));
    }

    // -------------------------
    // HYDRATE WITH MINIMAL FIELDS ONLY
    // -------------------------
    const idOrder = rows.map((r) => r.id);

    const hydrateStart = performance.now();

    const hydrated = await prisma.user.findMany({
      where: {
        id: { in: idOrder },
        ...userFilters,
        ...(Object.keys(profileFilters).length > 0
          ? { profile: { is: profileFilters } }
          : {}),
      },
      select: {
        id: true,
        full_name: true,
        birth_date: true,
        height: true,
        created_at: true,
        last_active_at: true,

        profile: {
          select: {
            city: true,
            latitude: true,
            longitude: true,
          },
        },

        eduWork: {
          select: {
            professionId: true,
            profession: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },

        // photos: {
        //   where: {
        //     is_primary: true,
        //   },
        //   select: {
        //     id: true,
        //     media_url: true,
        //     media_type: true,
        //   },
        //   take: 1,
        // },
        photos: {
          select: {
            id: true,
            media_url: true,
            media_type: true,
            order: true,
            is_primary: true,
          },
          orderBy: {
            order: 'asc'  // Sort by order (0, 1, 2, 3...)
          },
          take: 1,  // Take only the first one (index 0)
        },
      },
    });
    console.log(
      `hydration round ${round}:`,
      performance.now() - hydrateStart,
      "ms",
      "users:",
      hydrated.length
    )

    const byId = new Map(hydrated.map((u) => [u.id, u]));
    let pageFilled = false;

    for (const r of rows) {
      const u = byId.get(r.id);
      if (!u) continue;
      collected.push(u);
      if (collected.length === pageLimit) {
        filledCursor = { k: Number(r.sort_val), id: r.id };
        pageFilled = true;
        break;
      }
    }

    if (pageFilled) break;

    const tail = rows[rows.length - 1];
    cursorState = { k: Number(tail.sort_val), id: tail.id };

    if (rows.length < batchSize) break;
  }

  if (collected.length === 0) {
    return { users: [], nextCursor: null };
  }

  const page = collected.slice(0, pageLimit);
  if (filledCursor) nextCursor = encodeCursor(filledCursor);

  // ============================================================
  // 🚀 OPTIMIZATION: ONLY FETCH BOOSTS FOR THE 20-30 CANDIDATES
  // ============================================================
  const candidateIds = page.map((u) => u.id);

  // Fetch boosts ONLY for the candidates we're returning
  const boostStart = performance.now();
  const boostQuery = await prisma.boostUsage.findMany({
    where: {
      user_id: { in: candidateIds },
      is_active: true,
      ended_at: { gt: now },
    },
    select: {
      user_id: true,
    },
  });
  console.log(
    "boosts:",
    performance.now() - boostStart,
    "ms"
  );

  const boostedUserIds = new Set(boostQuery.map((b) => b.user_id));

  // -------------------------
  // REDIS PRESENCE
  // -------------------------
  const presenceStart = performance.now();
  const presenceMap = await getUsersPresence(page.map((u) => u.id));
  console.log(
    "presence:",
    performance.now() - presenceStart
  );
  // -------------------------
  // ENRICH WITH STATIC VALUES (NO MATCH SCORE CALCULATION)
  // -------------------------
  const nowMs = Date.now();
  const boostWindow = NEW_USER_BOOST_HOURS * 60 * 60 * 1000;

  const enriched = page.map((user) => {
    const presence = presenceMap[user.id];
    const meters = meterById.get(user.id);
    

    return {
      id: user.id,
      full_name: user.full_name,
      birth_date: formatBirthDate(user.birth_date),
      age: calculateAge(user.birth_date),
      height: user.height,
      created_at: user.created_at,
      last_active_at: user.last_active_at,

      profile: {
        city: user.profile?.city || null,
        latitude: user.profile?.latitude || null,
        longitude: user.profile?.longitude || null,
      },

      eduWork: {
        professionId: user.eduWork?.professionId || null,
        profession: user.eduWork?.profession || null,
      },

      photos: user.photos || [],

      // Static values - no calculation needed
      matchScore: STATIC_MATCH_SCORE,
      distanceKm: meters != null ? Math.round((meters / 1000) * 100) / 100 : 0,
      trust: STATIC_TRUST,
      replyTime: STATIC_REPLY_TIME,

      // Dynamic presence
      isOnline: presence?.isOnline || false,
      lastActiveAt: presence?.lastActiveAt || null,
      lastSeen: formatLastSeen(presence?.lastActiveAt),
      isBoosted: boostedUserIds.has(user.id),
    };
  });

  // -------------------------
  // RE-RANK WITHIN PAGE (using static match score)
  // -------------------------
  const sortedUsers = enriched.sort((a, b) => {
    const aActivity = a.lastActiveAt?.getTime() || 0;
    const bActivity = b.lastActiveAt?.getTime() || 0;
    const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
    const aIsNew = nowMs - aCreated < boostWindow;
    const bIsNew = nowMs - bCreated < boostWindow;

    if (a.isBoosted !== b.isBoosted) return a.isBoosted ? -1 : 1;
    if (aIsNew !== bIsNew) return aIsNew ? -1 : 1;
    // Static match score - everyone has same score, so this doesn't affect ordering
    if (a.matchScore !== b.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return bActivity - aActivity;
  });

  // -------------------------
  // RESPONSE
  // -------------------------
  return {
    users: sortedUsers,
    nextCursor,
  };
};


export const getFeedDetailsService = async (
  userId: string,
  currentUserId: string
): Promise<UserFeedResponse> => {
    const CACHE_KEY = `feed:details:${userId}:${currentUserId}`;

  // 1. Check Redis
  const cachedFeedDetails =
    await redis.get<UserFeedResponse>(CACHE_KEY);

  if (cachedFeedDetails) {
    console.log("✅ Feed Details from Redis");
    return cachedFeedDetails;
  }

  console.log("📦 Feed Details from Database");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          religion: true,
          community: true,
          languages: {
            include: {
              language: true
            }
          }
        }
      },
      bio: true,
      intention: true,
      about: true,
      eduWork: {
        include: {
          profession: true,
          employmentType: true,
          experience: true,
          ambition: true,
          salaryRange: true
        }
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
              occupation: true,
              marital: true,
            },
          },
        }
      },
      photos: {
        orderBy: {
          order: 'asc'
        }
      },
      userPrompts: {
        include: {
          prompt: {
            include: {
              category: true
            }
          }
        },
        orderBy: {
          displayOrder: 'asc'
        }
      },
      answer: {
        include: {
          question: true,
          option: true
        }
      }
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // 3. Transform data
  const response: UserFeedResponse = transformUserData(user);

  // 4. Save to Redis
  await redis.set(CACHE_KEY, response, {
    ex: CACHE_TTL,
  });

  console.log("💾 Feed Details cached");

  // 5. Return response
  return response;
};

// Helper function to transform user data
const transformUserData = (user: any): UserFeedResponse => {
  // Extract lifestyle answers (screen = LIFESTYLE)
  const lifestyleAnswers = user.answer.filter(
    (a: any) => a.question.screen === 'LIFESTYLE'
  );

  // Extract interests (screen = THINGS_U_LOVE)
  const interestAnswers = user.answer.filter(
    (a: any) => a.question.screen === 'THINGS_U_LOVE'
  );

  // Extract networking (screen = NETWORKING)
  const networkingAnswers = user.answer.filter(
    (a: any) => a.question.screen === 'NETWORKING_INTENT'
  );

  // Calculate age from birth_date
  const age = calculateAge(user.birth_date);

  // Get primary photo
  const primaryPhoto = user.photos.find((p: any) => p.is_primary) || user.photos[0];

  // Get mother tongue from languages
  const motherTongue = user.profile?.languages?.[0]?.language?.name || null;

  // Extract zodiac sign from birth_date
  const zodiac = user.about?.zodiac || null;
  const communicationStyle = user.about?.communicationStyle || null;
  const loveLanguage = user.about?.loveLanguage || null;

  return {
    userId: user.id,
    fullName: user.full_name,
    age: age,
    gender: user.gender,

    // Static values
    matchScore: STATIC_MATCH_SCORE,
    trust: STATIC_TRUST,
    replyTime: STATIC_REPLY_TIME,

    // Basic Info
    bio: user.bio?.bio || null,
    lookingFor: user.intention?.option || null,
    lookingFor_subtitle: user.intention?.optDescription || null,
    religion: user.profile?.religion?.name || null,
    community: user.profile?.community?.name || null,
    motherTongue: motherTongue,
    height: user.height,
    city: user.profile?.city || null,
    state: user.profile?.state || null,
    country: user.profile?.country || null,
    zodiac: zodiac,

    // Communication & Love Language
    communicationStyle: communicationStyle,
    loveLanguage: loveLanguage,

    // Photos
    photos: user.photos.map((photo: any) => ({
      id: photo.id,
      url: photo.media_url,
      isPrimary: photo.is_primary,
      order: photo.order,
      mediaType: photo.media_type
    })),

    // Prompts
    prompts: user.userPrompts.map((prompt: any) => ({
      id: prompt.id,
      question: prompt.prompt.question,
      answer: prompt.answer,
      category: prompt.prompt.category?.name || null,
      displayOrder: prompt.displayOrder
    })),

    // Career
    career: {
      highestEducation: user.eduWork?.highestEdu || null,
      degree: user.eduWork?.degree || null,
      collegeName: user.eduWork?.collegeName || null,
      graduationYear: user.eduWork?.graduationYear || null,
      profession: user.eduWork?.profession?.name || null,
      companyName: user.eduWork?.companyName || null,
      employmentType: user.eduWork?.employmentType?.name || null,
      experience: user.eduWork?.experience?.title || null,
      ambition: user.eduWork?.ambition?.title || null,
      salaryRange: user.eduWork?.salaryRange?.title || null,
      bigDreams: user.eduWork?.bigDreams || null
    },

    // Lifestyle
    lifestyle: lifestyleAnswers.map((answer: any) => ({
      question: answer.question.title,
      answer: answer.option.label,
      description: answer.description || null
    })),

    // Interests
    interests: interestAnswers.map((answer: any) => ({
      question: answer.question.title,
      answer: answer.option.label,
      description: answer.description || null
    })),

    networkingAnswers: networkingAnswers.map((answer: any) => ({
      question: answer.question.title,
      answer: answer.option.label,
      description: answer.description || null
    })),

    // Family
    family: {
      familyStatus: user.familyProfile?.familyStatus?.value || null,
      familyType: user.familyProfile?.familyType?.value || null,
      fatherOccupation: user.familyProfile?.fatherOccupation?.value || null,
      fatherOrganisation: user.familyProfile?.fatherOrganisation?.value || null,
      motherOccupation: user.familyProfile?.motherOccupation?.value || null,
      motherOrganisation: user.familyProfile?.motherOrganisation?.value || null,
      familyHome: user.familyProfile?.familyHome?.value || null,
      nativePlace: user.familyProfile?.nativePlace?.value || null,
      familyIncome: user.familyProfile?.familyIncome?.title || null,
      siblings:
        user.familyProfile?.siblings?.map(
          (sibling: UserSiblingWithDetails) => ({
            relation: sibling.siblingType?.value || null,
            occupation: sibling.occupation?.value || null,
            marital: sibling.marital?.value || null,
          })
        ) || [],
    }
  };
};


