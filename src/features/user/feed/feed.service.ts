
import { BoostEventType, Prisma } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";
import { buildFilterQuery } from "../../../utils/feedFilter.util";
import { formatLastSeen } from "../../../utils/lastSeen";
import { getUsersPresence } from "../../lastActivity/lastActivity.service";
import { CurrentUser, FeedParams, UserFeedResponse } from "./feed.types";
import { redis } from "../../../lib/redis";
import { trackBoostEvent } from "../../boost/boost.tracker";
import { getReplyTimeLabel, MIN_REPLY_SAMPLES } from "../../chat/user-reply-stats.service";

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

type FeedCursorMode =
  | "LOCATION"
  | "FALLBACK";

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
    NOT_LISTED: ["STRAIGHT", "GAY", "LESBIAN", "BISEXUAL", "PANSEXUAL", "DEMISEXUAL", "QUEER", "ASEXUAL", "AROMATIC", "NOT_LISTED",],
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


// =========================
// CURSOR (keyset)
// =========================
type Cursor = { k: number; id: string; mode?: FeedCursorMode; };

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

export const getFeedService = async ({
  userId,
  cursor,
  limit,
  filters,
}: FeedParams) => {
  const pageLimit =
    limit ?? DEFAULT_PAGE_LIMIT;

  const decodedCursor =
    decodeCursor(
      cursor as string | undefined,
    );

  const now = new Date();

  // ========================================================
  // CURRENT USER
  // ========================================================

  const USER_CACHE_TTL =
    60 * 10;

  const USER_CACHE_KEY =
    `feed:user:${userId}`;

  const currentUserPromise = async () => {
    const cached =
      await redis.get<any>(
        USER_CACHE_KEY,
      );

    if (cached) {
      return cached;
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          id: true,

          gender: true,

          profile: {
            select: {
              interested_in: true,

              sexual_orientation:
                true,

              latitude: true,

              longitude: true,

              max_distance_km:
                true,
            },
          },
        },
      });

    if (user) {
      await redis.set(
        USER_CACHE_KEY,
        user,
        {
          ex: USER_CACHE_TTL,
        },
      );
    }

    return user;
  };

  // ========================================================
  // DATE FORMAT
  // ========================================================

  const formatBirthDate = (
    date:
      | Date
      | string
      | null,
  ): string | null => {
    if (!date) {
      return null;
    }

    const d =
      new Date(date);

    if (
      isNaN(d.getTime())
    ) {
      return null;
    }

    const day =
      String(
        d.getDate(),
      ).padStart(2, "0");

    const month =
      String(
        d.getMonth() + 1,
      ).padStart(2, "0");

    const year =
      d.getFullYear();

    return `${day}-${month}-${year}`;
  };

  // ========================================================
  // DB HEALTH CHECK
  // ========================================================

  const start =
    performance.now();

  await prisma.$queryRaw`
      SELECT 1;
    `;

  console.log(
    "SELECT 1:",
    performance.now() - start,
    "ms",
  );

  // ========================================================
  // LOAD CURRENT USER
  // ========================================================

  const start1 =
    performance.now();

  const [currentUser] =
    await Promise.all([
      currentUserPromise(),
    ]);

  console.log(
    "current user:",
    performance.now() - start1,
    "ms",
  );

  if (
    !currentUser ||
    !currentUser.profile
  ) {
    throw new Error(
      "User profile not found",
    );
  }

  // ========================================================
  // VIP PACKAGE CHECK
  // ========================================================

  const activeVipPackage = await prisma.userPackage.findFirst(
    {
      where: {
        user_id: userId,

        status: "ACTIVE",

        package: {
          name: {
            in: [
              "VIP",
              "VIP_ELITE",
            ],
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
    },
  );

  const hasActiveVip =
    !!activeVipPackage;

  console.log(
    "ACTIVE VIP PACKAGE:",
    activeVipPackage,
  );

  console.log(
    "HAS ACTIVE VIP/VIP_ELITE:",
    hasActiveVip,
  );

  // ========================================================
  // BASIC USER PREFERENCES
  // ========================================================

  const {
    interested_in,
    sexual_orientation,
  } =
    currentUser.profile;

  const { gender } =
    currentUser;

  if (
    !gender ||
    !interested_in
  ) {
    throw new Error(
      "Required fields missing",
    );
  }

  const myGender =
    gender.toUpperCase();

  const myInterest =
    interested_in.toUpperCase();

  const myOrientation = (
    sexual_orientation ?? ""
  ).toUpperCase();

  const orientationGenderOptions =
    getOrientationCompatibility(myOrientation);

  // ========================================================
  // SAFE COORDINATE HANDLING
  // ========================================================

  const rawLatitude =
    currentUser.profile.latitude;

  const rawLongitude =
    currentUser.profile.longitude;

  /**
   * Convert coordinates safely.
   *
   * IMPORTANT:
   * Number(null) === 0
   * Number(undefined) === NaN
   *
   * So first check null/undefined,
   * then convert.
   */
  const myLatitude =
    rawLatitude !== null &&
      rawLatitude !== undefined
      ? Number(rawLatitude)
      : null;

  const myLongitude =
    rawLongitude !== null &&
      rawLongitude !== undefined
      ? Number(rawLongitude)
      : null;

  /**
   * Valid location rules:
   *
   * 1. latitude exists
   * 2. longitude exists
   * 3. both are finite numbers
   * 4. latitude is between -90 and 90
   * 5. longitude is between -180 and 180
   * 6. (0, 0) is treated as missing location
   */
  const validCurrentUserCoordinates =
    myLatitude !== null &&
    myLongitude !== null &&
    Number.isFinite(myLatitude) &&
    Number.isFinite(myLongitude) &&
    myLatitude >= -90 &&
    myLatitude <= 90 &&
    myLongitude >= -180 &&
    myLongitude <= 180 &&
    !(
      myLatitude === 0 &&
      myLongitude === 0
    );

  console.log(
    "CURRENT USER LOCATION:",
    {
      rawLatitude,
      rawLongitude,
      myLatitude,
      myLongitude,
      validCurrentUserCoordinates,
    },
  );

  // ========================================================
  // PRECOMPUTE MATCH FILTERS
  // ========================================================

  const genderFilter =
    getGenderFromInterest(
      myInterest,
    );

  const interestedInFilter =
    ALL_INTEREST_VALUES.filter(
      (v) =>
        getGenderFromInterest(
          v,
        ).includes(
          myGender,
        ),
    );

  // ========================================================
  // VIP FILTER: AMBITION
  // ========================================================

  if (
    filters?.ambitionIds &&
    filters.ambitionIds
      .length > 0
  ) {
    if (!hasActiveVip) {
      return {
        users: [],

        nextCursor: null,

        filterRestricted:
          true,

        message:
          "Ambition filter is available only for VIP and VIP Elite users.",
      };
    }
  }

  // ========================================================
  // VIP FILTER: FAMILY INCOME
  // ========================================================

  let familyIncomeIds:
    number[] = [];

  if (
    filters?.familyIncomeMin !==
    undefined ||
    filters?.familyIncomeMax !==
    undefined
  ) {
    if (!hasActiveVip) {
      return {
        users: [],

        nextCursor: null,

        filterRestricted:
          true,

        message:
          "Family income filter is available only for VIP and VIP Elite users.",
      };
    }

    const minAmount =
      filters.familyIncomeMin ??
      0;

    const maxAmount =
      filters.familyIncomeMax ??
      Number.MAX_SAFE_INTEGER;

    const matchingIncomeRanges =
      await prisma.familyIncome.findMany(
        {
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
                    maxAmount:
                      null,
                  },

                  {
                    maxAmount:
                    {
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
        },
      );

    familyIncomeIds =
      matchingIncomeRanges.map(
        (income) =>
          income.id,
      );

    console.log(
      "MATCHING FAMILY INCOME:",
      matchingIncomeRanges,
    );

    console.log(
      "MATCHING FAMILY INCOME IDS:",
      familyIncomeIds,
    );
  }

  // ========================================================
  // VIP FILTER: NETWORKING INTENT
  // ========================================================

  if (
    filters?.networkingIntentIds &&
    filters.networkingIntentIds
      .length > 0
  ) {
    if (!hasActiveVip) {
      return {
        users: [],

        nextCursor: null,

        filterRestricted:
          true,

        message:
          "Networking Intent filter is available only for active VIP or VIP Elite users.",
      };
    }
  }

  // ========================================================
  // NORMAL FILTER QUERY
  // Includes location when frontend provides location
  // ========================================================

  const filterQuery =
    filters
      ? buildFilterQuery({
        ...filters,
        familyIncomeIds,
      })
      : {
        where: {},
      };

  console.log(
    "NORMAL FILTER QUERY:",
    JSON.stringify(
      filterQuery,
      null,
      2,
    ),
  );

  const userFilters =
    Object.fromEntries(
      Object.entries(
        filterQuery.where ||
        {},
      ).filter(
        ([key]) =>
          key !== "profile",
      ),
    );

  const profileFilters =
    filterQuery.where
      ?.profile?.is || {};

  // ========================================================
  // MANUAL LOCATION CHECK
  // ========================================================

  const hasManualLocationFilter =
    !!filters?.location?.city ||
    !!filters?.location?.state ||
    !!filters?.location?.country;

    console.log("hasManualLocationFilter", hasManualLocationFilter);

  // ========================================================
  // RESOLVE MANUAL LOCATION → LAT/LNG
  // ========================================================

  let manualLocation:
    | {
      latitude: number;
      longitude: number;
    }
    | null = null;

  if (hasManualLocationFilter) {
    const city =
      filters?.location?.city?.trim();

    const state =
      filters?.location?.state?.trim();

    const country =
      filters?.location?.country?.trim();

    if (!city) {
      throw new Error(
        "City is required for manual location search",
      );
    }

    const location =
      await prisma.locationMaster.findFirst({
        where: {
          active: true,

          city: {
            equals: city,
            mode: "insensitive",
          },

          ...(state
            ? {
              state: {
                equals: state,
                mode: "insensitive",
              },
            }
            : {}),

          ...(country
            ? {
              country: {
                equals: country,
                mode: "insensitive",
              },
            }
            : {}),
        },

        select: {
          latitude: true,
          longitude: true,
        },
      });

    if (!location) {
      throw new Error(
        `Location "${city}" not found`,
      );
    }

    manualLocation = {
      latitude: Number(
        location.latitude,
      ),

      longitude: Number(
        location.longitude,
      ),
    };

    console.log(
      "MANUAL LOCATION RESOLVED:",
      {
        city,
        state,
        country,
        latitude:
          manualLocation.latitude,
        longitude:
          manualLocation.longitude,
      },
    );
  }

  // ========================================================
  // DISTANCE
  // ========================================================

const distanceKm =
  filters?.distanceKm ??
  (
    hasManualLocationFilter
      ? 100
      : currentUser.profile.max_distance_km ?? 1000
  );

  // ========================================================
  // FALLBACK FILTER QUERY
  // IMPORTANT:
  //
  // Remove ONLY:
  // - location
  // - distanceKm
  //
  // Keep:
  // - age
  // - height
  // - interests
  // - languages
  // - education
  // - profession
  // - zodiac
  // - lifestyle
  // - ambition
  // - income
  // - networking
  // - etc.
  // ========================================================

  let fallbackFilterQuery:
    any = {
    where: {},
  };

  if (filters) {
    const {
      location:
      _ignoredLocation,

      distanceKm:
      _ignoredDistance,

      ...filtersWithoutLocation
    } = filters;

    fallbackFilterQuery =
      buildFilterQuery({
        ...filtersWithoutLocation,

        familyIncomeIds,
      });
  }

  console.log(
    "FALLBACK FILTER QUERY:",
    JSON.stringify(
      fallbackFilterQuery,
      null,
      2,
    ),
  );

  const fallbackUserFilters =
    Object.fromEntries(
      Object.entries(
        fallbackFilterQuery
          .where || {},
      ).filter(
        ([key]) =>
          key !== "profile",
      ),
    );

  const fallbackProfileFilters =
    fallbackFilterQuery
      .where?.profile?.is ||
    {};

  // ========================================================
  // SQL MATCH CONDITIONS
  // ========================================================

  const matchConditions =
    Prisma.sql`
        u.deleted_at IS NULL
        AND u.account_status = 'ACTIVE'::"AccountStatus"
        AND u.id <> ${userId}::uuid
        AND NOT EXISTS (
          SELECT 1
          FROM swipes s
          WHERE
            s."swiperId" = ${userId}::uuid
            AND s."targetUserId" = u.id
        )

        AND NOT EXISTS (
          SELECT 1
          FROM "UserBlock" b
          WHERE
            (
              b."blockerId"::uuid = ${userId}::uuid
              AND b."blockedId"::uuid = u.id
            )
            OR
            (
              b."blockedId"::uuid = ${userId}::uuid
              AND b."blockerId"::uuid = u.id
            )
        )

        AND u.gender::text =
          ANY(
            ARRAY[
              ${Prisma.join(
      genderFilter,
    )}
            ]::text[]
          )

        AND p.interested_in::text =
          ANY(
            ARRAY[
              ${Prisma.join(
      interestedInFilter,
    )}
            ]::text[]
          )

       ${orientationGenderOptions.length > 0
        ? Prisma.sql`
          AND u.gender_option::text =
            ANY(
              ARRAY[
                ${Prisma.join(
          orientationGenderOptions,
        )}
              ]::text[]
            )
        `
        : Prisma.empty
      }
      `;

  // ========================================================
  // REUSABLE SELECT
  // ========================================================

  const userSelect = {
    id: true,

    full_name: true,

    birth_date: true,

    height: true,
    trust_score: true,
    created_at: true,

    last_active_at: true,

    profile: {
      select: {
        city: true,

        state: true,

        country: true,

        area: true,

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

    photos: {
      select: {
        id: true,

        media_url: true,

        media_type: true,

        order: true,

        is_primary: true,
      },

      orderBy: {
        order:
          "asc" as const,
      },

      take: 1,
    },
  };

  // ========================================================
  // PAGINATION VARIABLES
  // ========================================================

  const batchSize =
    Math.max(
      Math.ceil(
        pageLimit *
        OVERFETCH,
      ),
      30,
    );

  const collected:
    any[] = [];

  const meterById =
    new Map<
      string,
      number
    >();

  let nextCursor:
    string | null = null;

  let filledCursor:
    Cursor | null =
    null;

  let locationFallbackUsed =
    decodedCursor?.mode ===
    "FALLBACK";

  // ========================================================
  // NORMAL LOCATION SEARCH
  // ========================================================

  /**
   * If cursor says FALLBACK,
   * DON'T retry location.
   *
   * We already know frontend
   * is paging through fallback
   * results.
   */

  const shouldRunNormalLocationSearch =
    decodedCursor?.mode !==
    "FALLBACK";

  if (
    shouldRunNormalLocationSearch
  ) {
    let cursorState:
      Cursor | null =
      decodedCursor;

    // ======================================================
    // CASE 1:
    // MANUAL LOCATION → LOCATION MASTER → POSTGIS
    // ======================================================

    if (
      hasManualLocationFilter &&
      manualLocation
    ) {
      console.log(
        "LOCATION MODE: MANUAL LOCATION",
        {
          latitude:
            manualLocation.latitude,

          longitude:
            manualLocation.longitude,

          distanceKm,
        },
      );

      // ------------------------------------------------------
      // SEARCH POINT
      // ------------------------------------------------------

      const searchPoint =
        Prisma.sql`
      ST_SetSRID(
        ST_MakePoint(
          ${manualLocation.longitude},
          ${manualLocation.latitude}
        ),
        4326
      )::geography
    `;

      // ------------------------------------------------------
      // SEARCH
      // ------------------------------------------------------

      for (
        let round = 0;
        round < MAX_ROUNDS &&
        collected.length < pageLimit;
        round++
      ) {
        const candidateStart =
          performance.now();

        const rows =
          await prisma.$queryRaw<
            {
              id: string;
              sort_val: number;
            }[]
          >`
        SELECT
          u.id,

          (
            p.location::geography
            <-> ${searchPoint}
          )::float8 AS sort_val

        FROM users u

        JOIN user_profiles p
          ON p.user_id = u.id

        WHERE
          ${matchConditions}

          AND p.location IS NOT NULL

          AND ST_DWithin(
            p.location::geography,
            ${searchPoint},
            ${distanceKm * 1000}
          )

          ${cursorState
              ? Prisma.sql`
                  AND (
                    (
                      p.location::geography
                      <-> ${searchPoint}
                    ) > ${cursorState.k}

                    OR (
                      (
                        p.location::geography
                        <-> ${searchPoint}
                      ) = ${cursorState.k}

                      AND u.id >
                        ${cursorState.id}::uuid
                    )
                  )
                `
              : Prisma.empty
            }

        ORDER BY
          p.location::geography
            <-> ${searchPoint} ASC,

          u.id ASC

        LIMIT ${batchSize};
      `;

        console.log(
          `MANUAL LOCATION candidate round ${round}:`,
          performance.now() -
          candidateStart,
          "ms",
          "rows:",
          rows.length,
        );

        if (rows.length === 0) {
          break;
        }

        // ----------------------------------------------------
        // SAVE DISTANCE
        // ----------------------------------------------------

        for (const row of rows) {
          meterById.set(
            row.id,
            Number(row.sort_val),
          );
        }

        const idOrder =
          rows.map(
            (row) => row.id,
          );

        // ----------------------------------------------------
        // HYDRATE USERS
        // ----------------------------------------------------

        const hydrateStart =
          performance.now();

        const hydrated =
          await prisma.user.findMany({
            where: {
              id: {
                in: idOrder,
              },

              account_status:
                "ACTIVE",

              deleted_at:
                null,

              /*
               * IMPORTANT
               *
               * Use fallback filters here.
               *
               * These contain all selected
               * filters EXCEPT:
               *
               * location
               * distanceKm
               *
               * Therefore city/state/country
               * are NOT compared against
               * candidate profiles.
               */
              ...fallbackUserFilters,

              ...(Object.keys(
                fallbackProfileFilters,
              ).length > 0
                ? {
                  profile: {
                    is:
                      fallbackProfileFilters,
                  },
                }
                : {}),
            },

            select:
              userSelect,
          });

        console.log(
          `MANUAL LOCATION hydration round ${round}:`,
          performance.now() -
          hydrateStart,
          "ms",
          "users:",
          hydrated.length,
        );

        // ----------------------------------------------------
        // PRESERVE SQL DISTANCE ORDER
        // ----------------------------------------------------

        const byId =
          new Map(
            hydrated.map(
              (user) => [
                user.id,
                user,
              ],
            ),
          );

        let pageFilled =
          false;

        for (const row of rows) {
          const user =
            byId.get(row.id);

          if (!user) {
            continue;
          }

          collected.push(
            user,
          );

          if (
            collected.length ===
            pageLimit
          ) {
            filledCursor = {
              k: Number(
                row.sort_val,
              ),

              id:
                row.id,

              mode:
                "LOCATION",
            };

            pageFilled =
              true;

            break;
          }
        }

        if (pageFilled) {
          break;
        }

        // ----------------------------------------------------
        // NEXT SQL BATCH
        // ----------------------------------------------------

        const tail =
          rows[
          rows.length - 1
          ];

        cursorState = {
          k: Number(
            tail.sort_val,
          ),

          id:
            tail.id,

          mode:
            "LOCATION",
        };

        if (
          rows.length <
          batchSize
        ) {
          break;
        }
      }
    }

    // ======================================================
    // CASE 2:
    // DISTANCE / LAT / LNG
    // ======================================================

    else if (
      validCurrentUserCoordinates
    ) {
      console.log(
        "LOCATION MODE: DISTANCE",
        `${distanceKm} KM`,
      );

      const me =
        Prisma.sql`
            ST_SetSRID(
              ST_MakePoint(
                ${myLongitude},
                ${myLatitude}
              ),
              4326
            )::geography
          `;

      for (
        let round = 0;
        round < MAX_ROUNDS &&
        collected.length <
        pageLimit;
        round++
      ) {
        const candidateStart =
          performance.now();

        const rows =
          await prisma.$queryRaw<
            {
              id: string;
              sort_val: number;
            }[]
          >`
              SELECT
                u.id,

                (
                  p.location::geography
                  <-> ${me}
                )::float8
                  AS sort_val

              FROM users u

              JOIN user_profiles p
                ON p.user_id = u.id

              WHERE
                ${matchConditions}

                AND p.location
                  IS NOT NULL

                AND ST_DWithin(
                  p.location::geography,
                  ${me},
                  ${distanceKm * 1000}
                )

                ${cursorState
              ? Prisma.sql`
                        AND (
                          (
                            p.location::geography
                            <-> ${me}
                          ) > ${cursorState.k}

                          OR (
                            (
                              p.location::geography
                              <-> ${me}
                            ) = ${cursorState.k}

                            AND u.id >
                              ${cursorState.id}::uuid
                          )
                        )
                      `
              : Prisma.empty
            }

              ORDER BY
                p.location::geography
                  <-> ${me} ASC,

                u.id ASC

              LIMIT ${batchSize};
            `;

        console.log(
          `DISTANCE candidate round ${round}:`,
          performance.now() -
          candidateStart,
          "ms",
          "rows:",
          rows.length,
        );

        if (
          rows.length === 0
        ) {
          break;
        }

        for (
          const row of rows
        ) {
          meterById.set(
            row.id,
            Number(
              row.sort_val,
            ),
          );
        }

        const idOrder =
          rows.map(
            (row) =>
              row.id,
          );

        const hydrateStart =
          performance.now();

        const hydrated =
          await prisma.user.findMany(
            {
              where: {
                id: {
                  in: idOrder,
                },
                account_status: "ACTIVE",
                deleted_at: null,
                ...fallbackUserFilters,

                ...(Object.keys(
                  fallbackProfileFilters,
                ).length > 0
                  ? {
                    profile: {
                      is: fallbackProfileFilters,
                    },
                  }
                  : {}),
              },

              select:
                userSelect,
            },
          );

        console.log(
          `DISTANCE hydration round ${round}:`,
          performance.now() -
          hydrateStart,
          "ms",
          "users:",
          hydrated.length,
        );

        const byId =
          new Map(
            hydrated.map(
              (user) => [
                user.id,
                user,
              ],
            ),
          );

        let pageFilled =
          false;

        for (
          const row of rows
        ) {
          const user =
            byId.get(
              row.id,
            );

          if (!user) {
            continue;
          }

          collected.push(
            user,
          );

          if (
            collected.length ===
            pageLimit
          ) {
            filledCursor = {
              k: Number(
                row.sort_val,
              ),

              id: row.id,

              mode:
                "LOCATION",
            };

            pageFilled =
              true;

            break;
          }
        }

        if (pageFilled) {
          break;
        }

        const tail =
          rows[
          rows.length -
          1
          ];

        cursorState = {
          k: Number(
            tail.sort_val,
          ),

          id: tail.id,

          mode:
            "LOCATION",
        };

        if (
          rows.length <
          batchSize
        ) {
          break;
        }
      }
    } else {
      /**
       * Current user has no
       * latitude / longitude.
       *
       * Don't query (0,0).
       *
       * Directly go to fallback.
       */

      console.log(
        "CURRENT USER HAS NO VALID LAT/LNG. SKIPPING DISTANCE AND USING FALLBACK.",
      );
    }
  }

  // ========================================================
  // LOCATION FALLBACK
  // ========================================================

  /**
   * Run fallback when:
   *
   * 1. manual location returned 0
   *
   * OR
   *
   * 2. distance returned 0
   *
   * OR
   *
   * 3. current user has no lat/lng
   *
   * OR
   *
   * 4. previous cursor was already
   *    in FALLBACK mode.
   */

  if (
    collected.length === 0 &&
  !hasManualLocationFilter
  ) {
    locationFallbackUsed =
      true;

    console.log(
      "====================================",
    );

    console.log(
      "NO USERS FOUND WITH LOCATION.",
    );

    console.log(
      "RUNNING FALLBACK WITHOUT LOCATION/DISTANCE.",
    );

    console.log(
      "ALL OTHER FILTERS ARE STILL ACTIVE.",
    );

    console.log(
      "====================================",
    );

    /**
     * If we already returned
     * fallback page 1,
     * page 2 should continue
     * using its fallback cursor.
     *
     * Otherwise fallback starts
     * fresh.
     */

    let fallbackCursorState:
      Cursor | null =
      decodedCursor?.mode ===
        "FALLBACK"
        ? decodedCursor
        : null;

    // clear distance because
    // fallback users may not have it
    meterById.clear();

    for (
      let round = 0;
      round < MAX_ROUNDS &&
      collected.length <
      pageLimit;
      round++
    ) {
      const candidateStart =
        performance.now();

      /**
       * IMPORTANT:
       *
       * NO:
       *
       * ST_DWithin()
       *
       * NO:
       *
       * city/state/country
       *
       * Only base compatibility
       * conditions here.
       */

      const rows =
        await prisma.$queryRaw<
          {
            id: string;
            sort_val: number;
          }[]
        >`
            SELECT
              u.id,

              (
                EXTRACT(
                  EPOCH FROM u.created_at
                ) * 1000
              )::float8
                AS sort_val

            FROM users u

            JOIN user_profiles p
              ON p.user_id = u.id

            WHERE
              ${matchConditions}

              ${fallbackCursorState
            ? Prisma.sql`
                      AND (
                        (
                          EXTRACT(
                            EPOCH FROM u.created_at
                          ) * 1000
                        ) < ${fallbackCursorState.k}

                        OR (
                          (
                            EXTRACT(
                              EPOCH FROM u.created_at
                            ) * 1000
                          ) = ${fallbackCursorState.k}

                          AND u.id <
                            ${fallbackCursorState.id}::uuid
                        )
                      )
                    `
            : Prisma.empty
          }

            ORDER BY
              sort_val DESC,
              u.id DESC

            LIMIT ${batchSize};
          `;

      console.log(
        `FALLBACK candidate round ${round}:`,
        performance.now() -
        candidateStart,
        "ms",
        "rows:",
        rows.length,
      );

      if (
        rows.length === 0
      ) {
        break;
      }

      const idOrder =
        rows.map(
          (row) =>
            row.id,
        );

      const hydrateStart =
        performance.now();

      /**
       * Here we're using:
       *
       * fallbackUserFilters
       * +
       * fallbackProfileFilters
       *
       * Therefore location is gone,
       * but every other filter stays.
       */

      const hydrated =
        await prisma.user.findMany(
          {
            where: {
              id: {
                in: idOrder,
              },
              account_status: "ACTIVE",
              deleted_at: null,
              ...fallbackUserFilters,

              ...(Object.keys(
                fallbackProfileFilters,
              ).length > 0
                ? {
                  profile: {
                    is:
                      fallbackProfileFilters,
                  },
                }
                : {}),
            },

            select:
              userSelect,
          },
        );

      console.log(
        `FALLBACK hydration round ${round}:`,
        performance.now() -
        hydrateStart,
        "ms",
        "users:",
        hydrated.length,
      );

      const byId =
        new Map(
          hydrated.map(
            (user) => [
              user.id,
              user,
            ],
          ),
        );

      let pageFilled =
        false;

      for (
        const row of rows
      ) {
        const user =
          byId.get(
            row.id,
          );

        if (!user) {
          continue;
        }

        collected.push(
          user,
        );

        if (
          collected.length ===
          pageLimit
        ) {
          filledCursor = {
            k: Number(
              row.sort_val,
            ),

            id: row.id,

            mode:
              "FALLBACK",
          };

          pageFilled =
            true;

          break;
        }
      }

      if (pageFilled) {
        break;
      }

      const tail =
        rows[
        rows.length -
        1
        ];

      fallbackCursorState =
      {
        k: Number(
          tail.sort_val,
        ),

        id: tail.id,

        mode:
          "FALLBACK",
      };

      if (
        rows.length <
        batchSize
      ) {
        break;
      }
    }
  }

  // ========================================================
  // STILL NO USERS
  // ========================================================

  if (
    collected.length === 0
  ) {
    return {
      users: [],

      nextCursor: null,

      locationFallbackUsed,
    };
  }

  // ========================================================
  // PAGE
  // ========================================================

  const page =
    collected.slice(
      0,
      pageLimit,
    );

  if (filledCursor) {
    nextCursor =
      encodeCursor(
        filledCursor,
      );
  }

  const candidateIds =
    page.map(
      (user) =>
        user.id,
    );

  // ========================================================
  // REPLY TIME STATS
  // ========================================================

  const replyStats =
    await prisma.userReplyStats.findMany({
      where: {
        userId: {
          in: candidateIds,
        },
      },

      select: {
        userId: true,
        medianReplyMinutes: true,
        sampleCount: true,
      },
    });

  const replyStatsMap =
    new Map(
      replyStats.map(
        (stat) => [
          stat.userId,
          stat,
        ],
      ),
    );
  // ========================================================
  // BOOSTS
  // ========================================================

  const boostStart = performance.now();

  const activeBoostUsages =
    await prisma.boostUsage.findMany({
      where: {
        user_id: {
          in: candidateIds,
        },

        is_active: true,

        status: "ACTIVE",

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
        boost_id: true,
        boost_type: true,
        duration: true,
        started_at: true,
        expected_end_at: true,

        boost: {
          select: {
            id: true,
            name: true,
            title: true,
            boostDuration: true,
            visibilityMultiplier: true,
          },
        },
      },

      orderBy: {
        started_at: "desc",
      },
    });

  console.log(
    "boosts:",
    performance.now() - boostStart,
    "ms",
  );


  // ========================================================
  // CREATE ACTIVE BOOST MAP
  // ========================================================

  const activeBoostMap = new Map<
    string,
    (typeof activeBoostUsages)[number]
  >();

  for (const usage of activeBoostUsages) {
    // If somehow multiple ACTIVE usages exist,
    // keep latest one because query is ordered DESC.
    if (!activeBoostMap.has(usage.user_id)) {
      activeBoostMap.set(
        usage.user_id,
        usage,
      );
    }
  }

  const boostedUserIds = new Set(
    activeBoostMap.keys(),
  );

  // ========================================================
  // PRESENCE
  // ========================================================

  const presenceStart =
    performance.now();

  const presenceMap =
    await getUsersPresence(
      candidateIds,
    );

  console.log(
    "presence:",
    performance.now() -
    presenceStart,
    "ms",
  );

  // ========================================================
  // COMPATIBILITY SCORE
  // ========================================================

  const compatibilityStart =
    performance.now();

  const compatibilityScores =
    await prisma.userCompatibility.findMany(
      {
        where: {
          userId,

          targetUserId: {
            in: candidateIds,
          },
        },

        select: {
          targetUserId: true,

          score: true,

          percentage: true,
        },
      },
    );

  console.log(
    "compatibility scores:",
    performance.now() -
    compatibilityStart,
    "ms",
  );

  const compatibilityMap =
    new Map(
      compatibilityScores.map(
        (compatibility) => [
          compatibility.targetUserId,
          compatibility,
        ],
      ),
    );

  // ========================================================
  // ENRICH USERS
  // ========================================================

  const nowMs = Date.now();

  const boostWindow =
    NEW_USER_BOOST_HOURS *
    60 *
    60 *
    1000;

  const enriched =
    page.map(
      (user) => {
        const presence =
          presenceMap[
          user.id
          ];

        const meters =
          meterById.get(
            user.id,
          );

        const compat =
          compatibilityMap.get(
            user.id,
          );

        const replyStat =
          replyStatsMap.get(
            user.id,
          );

        const replyTime =
          replyStat &&
            replyStat.medianReplyMinutes !== null &&
            replyStat.sampleCount >= MIN_REPLY_SAMPLES
            ? getReplyTimeLabel(
              replyStat.medianReplyMinutes,
            )
            : null;

        const matchScore =
          compat?.percentage ??
          0;

        const compatibilityScore =
          compat?.score ?? 0;

        // ====================================================
        // ACTIVE BOOST INFORMATION
        // ====================================================

        const activeBoost =
          activeBoostMap.get(user.id);

        const isBoosted =
          !!activeBoost;

        const boostType =
          activeBoost?.boost_type ??
          activeBoost?.boost?.name ??
          null;

        const boostEndsAt =
          activeBoost?.expected_end_at ??
          null;

        const boostStartedAt =
          activeBoost?.started_at ??
          null;

        const boostDuration =
          activeBoost?.duration ??
          activeBoost?.boost?.boostDuration ??
          null;

        const visibilityMultiplier =
          activeBoost?.boost?.visibilityMultiplier ??
          1;

        return {
          id: user.id,

          full_name:
            user.full_name,

          birth_date:
            formatBirthDate(
              user.birth_date,
            ),

          age: calculateAge(
            user.birth_date,
          ),

          height:
            user.height,

          created_at:
            user.created_at,

          last_active_at:
            user.last_active_at,

          profile: {
            city:
              user.profile
                ?.city ||
              null,

            state:
              user.profile
                ?.state ||
              null,

            country:
              user.profile
                ?.country ||
              null,

            latitude:
              user.profile
                ?.latitude ||
              null,

            longitude:
              user.profile
                ?.longitude ||
              null,
          },

          eduWork: {
            professionId:
              user.eduWork
                ?.professionId ||
              null,

            profession:
              user.eduWork
                ?.profession ||
              null,
          },

          photos:
            user.photos ||
            [],

          matchScore,

          /**
           * Distance is available
           * only when actual
           * distance mode was used.
           *
           * For:
           *
           * manual city mode
           * fallback mode
           *
           * distance is null.
           */

          distanceKm:
            meters != null
              ? Math.round(
                (
                  meters /
                  1000
                ) *
                100,
              ) / 100
              : null,

          trust: user.trust_score ?? 0,

          replyTime,

          isOnline:
            presence?.isOnline ||
            false,

          lastActiveAt:
            presence?.lastActiveAt ||
            null,

          lastSeen:
            formatLastSeen(
              presence?.lastActiveAt,
            ),

          // ================================================
          // DYNAMIC BOOST DATA
          // ================================================

          isBoosted,

          boost: isBoosted
            ? {
              usageId:
                activeBoost!.id,

              type:
                boostType,

              title:
                activeBoost!.boost?.title ??
                null,

              durationMinutes:
                boostDuration,

              visibilityMultiplier,

              startedAt:
                boostStartedAt,

              endsAt:
                boostEndsAt,
            }
            : null,
        };
      },
    );

  // ========================================================
  // SORT RETURNED PAGE
  // ========================================================

  const sortedUsers =
    enriched.sort(
      (a, b) => {
        const aActivity =
          a.lastActiveAt
            ?.getTime() ||
          0;

        const bActivity =
          b.lastActiveAt
            ?.getTime() ||
          0;

        const aCreated =
          a.created_at
            ? new Date(
              a.created_at,
            ).getTime()
            : 0;

        const bCreated =
          b.created_at
            ? new Date(
              b.created_at,
            ).getTime()
            : 0;

        const aIsNew =
          nowMs -
          aCreated <
          boostWindow;

        const bIsNew =
          nowMs -
          bCreated <
          boostWindow;

        // 1. BOOSTED FIRST
        if (
          a.isBoosted !==
          b.isBoosted
        ) {
          return a.isBoosted
            ? -1
            : 1;
        }

        // 2. NEW USERS
        if (
          aIsNew !==
          bIsNew
        ) {
          return aIsNew
            ? -1
            : 1;
        }

        // 3. MATCH SCORE
        if (
          a.matchScore !==
          b.matchScore
        ) {
          return (
            b.matchScore -
            a.matchScore
          );
        }

        // 4. ACTIVE USERS
        return (
          bActivity -
          aActivity
        );
      },
    );

  // ========================================================
  // TRACK BOOST IMPRESSIONS
  // ========================================================

  const boostedVisibleUsers = sortedUsers.filter(
    (feedUser) =>
      feedUser.isBoosted &&
      feedUser.id !== userId
  );

  Promise.all(
    boostedVisibleUsers.map((feedUser) =>
      trackBoostEvent({
        targetUserId: feedUser.id,
        actorId: userId,
        type: "IMPRESSION", // see note below
      })
    )
  ).catch((error) => {
    console.error(
      "Boost impression tracking error:",
      error
    );
  });

  // ========================================================
  // RESPONSE
  // ========================================================

  return {
    users: sortedUsers,
    nextCursor,
    locationFallbackUsed,
  };
};

export const getFeedDetailsService = async (
  userId: string,
  currentUserId: string
): Promise<UserFeedResponse> => {
  const CACHE_KEY = `feed:details:${userId}:${currentUserId}`;

  // =====================================================
  // 1. PREVENT SELF PROFILE VIEW
  // =====================================================

  const shouldTrackProfileView =
    userId !== currentUserId;

  // =====================================================
  // 2. CHECK REDIS
  // =====================================================

  const cachedFeedDetails =
    await redis.get<UserFeedResponse>(CACHE_KEY);

  if (cachedFeedDetails) {

    console.log("✅ Feed Details from Redis");

    // Track even when profile comes from Redis
    if (shouldTrackProfileView) {
      await trackBoostEvent({
        targetUserId: userId,       // Profile owner
        actorId: currentUserId,      // Person viewing profile
        type: "PROFILE_VIEW",
      });
    }

    return cachedFeedDetails;
  }


  // =====================================================
  // 3. GET PROFILE FROM DATABASE
  // =====================================================

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

  // =====================================================
  // 4. GET REPLY TIME FOR THIS PARTICULAR USER
  // =====================================================

  const replyStats = await prisma.userReplyStats.findUnique({
    where: {
      userId: userId,
    },
    select: {
      userId: true,
      medianReplyMinutes: true,
      sampleCount: true,
    },
  });

  // Same logic as your main Feed API
  const replyTime =
    replyStats &&
      replyStats.medianReplyMinutes !== null &&
      replyStats.sampleCount >= MIN_REPLY_SAMPLES
      ? getReplyTimeLabel(replyStats.medianReplyMinutes) ?? ""
      : "";

  // 3. Transform data
  const response: UserFeedResponse = transformUserData(user, replyTime);

  // 4. Save to Redis
  await redis.set(CACHE_KEY, response, {
    ex: CACHE_TTL,
  });

  console.log("💾 Feed Details cached");

  // =====================================================
  // 6. TRACK BOOST PROFILE VIEW
  // =====================================================

  if (shouldTrackProfileView) {

    await trackBoostEvent({
      targetUserId: userId,
      actorId: currentUserId,
      type: "PROFILE_VIEW",
    });
  }

  // =====================================================
  // 7. RETURN
  // =====================================================
  return response;
};

// Helper function to transform user data
const transformUserData = (user: any, replyTime: string): UserFeedResponse => {
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
    phone_number: user.phone_number,

    // Static values
    matchScore: STATIC_MATCH_SCORE,
    trust: user.trust_score ?? 0,
    replyTime: replyTime,
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
    area: user.profile?.area || null,
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


