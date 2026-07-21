// import { Prisma } from "@prisma/client";
// import { prisma } from "../../../prisma/prismaClient";
// import { buildFilterQuery } from "../../../utils/feedFilter.util";
// import { formatLastSeen } from "../../../utils/lastSeen";
// import { calculateMatchScore } from "../../../utils/matchScore.constants";
// import { getUsersPresence } from "../../lastActivity/lastActivity.service";
// import { FeedParams } from "./feed.types";

// // =========================
// // HELPERS
// // =========================
// export const calculateAge = (birthDate: Date | null) => {
//   if (!birthDate) return null;

//   const today = new Date();
//   let age = today.getFullYear() - birthDate.getFullYear();

//   const month = today.getMonth() - birthDate.getMonth();

//   if (
//     month < 0 ||
//     (month === 0 && today.getDate() < birthDate.getDate())
//   ) {
//     age--;
//   }

//   return age;
// };

// export const getGenderFromInterest = (myInterest?: string): string[] => {
//   const value = myInterest?.toUpperCase();
//   const allGenders = [
//     "MEN",
//     "WOMEN",
//     "NON_BINARY",
//     "PREFER_NOT_TO_SAY",
//   ];
//   if (!value || value === "EVERYONE") {
//     return allGenders;
//   }
//   return allGenders.includes(value) ? [value] : allGenders;
// };

// export const getOrientationCompatibility = (orientation?: string | null): string[] => {
//   const map: Record<string, string[]> = {
//     STRAIGHT: ["STRAIGHT", "BISEXUAL", "PANSEXUAL", "QUEER"],
//     GAY: ["GAY", "BISEXUAL", "PANSEXUAL", "QUEER"],
//     LESBIAN: ["LESBIAN", "BISEXUAL", "PANSEXUAL", "QUEER"],
//     BISEXUAL: [
//       "STRAIGHT",
//       "GAY",
//       "LESBIAN",
//       "BISEXUAL",
//       "PANSEXUAL",
//       "QUEER",
//     ],
//     PANSEXUAL: [
//       "STRAIGHT",
//       "GAY",
//       "LESBIAN",
//       "BISEXUAL",
//       "PANSEXUAL",
//       "DEMISEXUAL",
//       "QUEER",
//     ],
//     DEMISEXUAL: [
//       "STRAIGHT",
//       "GAY",
//       "LESBIAN",
//       "BISEXUAL",
//       "PANSEXUAL",
//       "DEMISEXUAL",
//       "QUEER",
//     ],
//     QUEER: [
//       "STRAIGHT",
//       "GAY",
//       "LESBIAN",
//       "BISEXUAL",
//       "PANSEXUAL",
//       "DEMISEXUAL",
//       "QUEER",
//     ],
//     ASEXUAL: ["ASEXUAL"],
//     AROMATIC: ["AROMATIC"],
//     NOT_LISTED: [],
//   };

//   return map[orientation?.toUpperCase() ?? ""] ?? [];
// };

// const NEW_USER_BOOST_HOURS = 48; // you can change: 24 / 48 / 72

// // =========================
// // FEED SERVICE
// // =========================

// export const getFeedService = async ({
//   userId,
//   cursor,
//   limit,
//   filters,
// }: FeedParams) => {

//   console.log("filter : ", filters)
//   // 1. Current User
//   const currentUser = await prisma.user.findUnique({
//     where: { id: userId },
//    include: {
//       profile: true,
//       eduWork: true,
//       bio: true,
//       photos: true,
//       answer: {
//         include: {
//           question: true,
//           option: true,
//         },
//       },
//     },
//   });

//   if (!currentUser || !currentUser.profile) {
//     throw new Error("User profile not found");
//   }

//   const { interested_in, sexual_orientation } = currentUser.profile;
//   const { gender, gender_option } = currentUser;

//   const myLatitude = Number(currentUser.profile.latitude);
//   const myLongitude = Number(currentUser.profile.longitude);
//   const maxDistance = currentUser.profile.max_distance_km ?? 50;

//   if (!gender || !gender_option || !interested_in) {
//     throw new Error("Required fields missing");
//   }

//   // -------------------------
//   // FILTER BUILD
//   // -------------------------

//   console.log(JSON.stringify(filters, null, 2));

//   const filterQuery = filters
//     ? buildFilterQuery(filters)
//     : { where: {} };

//   console.log("filterQuery filter : ", filterQuery)


//   const userFilters = Object.fromEntries(
//     Object.entries(filterQuery.where || {}).filter(([k]) => k !== "profile"),
//   );


//   console.log("userFilters filter : ", userFilters)


//   const profileFilters = filterQuery.where?.profile?.is || {};

//   console.log("profile filter : ", profileFilters)
//   // If user manually selected city/state/country,
//   // don't use PostGIS nearby search.
//   const hasManualLocationFilter =
//     !!filters?.location?.city ||
//     !!filters?.location?.state ||
//     !!filters?.location?.country;
//   // =========================
//   // 2. EXCLUSIONS
//   // =========================

//   const [swipes, blocks, blockedBy] = await Promise.all([
//     prisma.userSwipe.findMany({
//       where: { swiperId: userId },
//       select: { targetUserId: true },
//     }),
//     prisma.userBlock.findMany({
//       where: { blockerId: userId },
//       select: { blockedId: true },
//     }),
//     prisma.userBlock.findMany({
//       where: { blockedId: userId },
//       select: { blockerId: true },
//     }),
//   ]);

//   const excludedIds = new Set<string>([
//     userId,
//     ...swipes.map((s) => s.targetUserId),
//     ...blocks.map((b) => b.blockedId),
//     ...blockedBy.map((b) => b.blockerId),
//   ]);

//   const excludedArray = Array.from(excludedIds);

//   // =========================
//   // 3. FILTER PREP
//   // =========================

//   const myInterest = interested_in?.toUpperCase();
//   const myOrientation = sexual_orientation?.toUpperCase();

//   const genderFilter = getGenderFromInterest(myInterest);
//   const orientationFilter = getOrientationCompatibility(myOrientation);

//   // =========================
//   // 4. FETCH BASE USERS
//   // =========================

//   const nearbyUsers = await prisma.$queryRaw<
//     { id: string; distance: number }[]
//   >`
// SELECT
//     u.id,
//     ROUND(
//       (
//         ST_Distance(
//           p.location,
//           ST_SetSRID(
//             ST_MakePoint(${myLongitude}, ${myLatitude}),
//             4326
//           )::geography
//         ) / 1000
//       )::numeric,
//       2
//     ) AS distance
// FROM users u
// JOIN user_profiles p
//     ON p.user_id = u.id
// WHERE
//     u.deleted_at IS NULL
//     AND u.id <> ${userId}::uuid
//     AND u.id NOT IN (
//       ${Prisma.join(excludedArray.map(id => Prisma.sql`${id}::uuid`))}
//     )

//     ${hasManualLocationFilter
//       ? Prisma.empty
//       : Prisma.sql`
//           AND ST_DWithin(
//             p.location,
//             ST_SetSRID(
//               ST_MakePoint(${myLongitude}, ${myLatitude}),
//               4326
//             )::geography,
//             ${maxDistance * 1000}
//           )
//         `
//     };
// `;
//   console.log("near by users : ", nearbyUsers)

//   const allUsers = await prisma.user.findMany({
//     where: {
//       ...(hasManualLocationFilter
//         ? {}
//         : {
//           id: {
//             in: nearbyUsers.map((u) => u.id),
//           },
//         }),
//       ...userFilters,
//       ...(Object.keys(profileFilters).length > 0 && {
//         profile: {
//           is: profileFilters,
//         },
//       }),

//     },
//     include: {
//       profile: true,
//       eduWork: true,
//       bio: true,
//       photos: true,
//       answer: {
//         include: {
//           question: true,
//           option: true,
//         },
//       },
//     },
//   });

//   const distanceMap = new Map(
//     nearbyUsers.map((u) => [u.id, Number(u.distance)])
//   );

//   // =========================
//   // 5. APPLY FILTERS (STEPWISE)
//   // =========================

//   // STEP 1 → Gender match (my preference)
//   const genderMatched = allUsers.filter((user) =>
//     genderFilter.includes(user.gender!.toUpperCase()),
//   );

//   // STEP 2 → Mutual interest
//   const mutualInterest = genderMatched.filter(
//     (user) =>
//       user.profile?.interested_in?.toUpperCase() === gender?.toUpperCase(),
//   );

//   // STEP 3 → Orientation (they match me)
//   const orientationMatched = mutualInterest.filter((user) =>
//     orientationFilter.includes(user.gender_option?.toUpperCase() ?? ""),
//   );

//   // STEP 4 → Reverse orientation (I match them)
//   const finalMatched = orientationMatched.filter((user) => {
//     const theirCompatible = getOrientationCompatibility(
//       user.profile?.sexual_orientation,
//     );

//     return theirCompatible.includes(sexual_orientation?.toUpperCase() ?? "");
//   });

//   // =========================
//   // 6. SORT + LIMIT
//   // =========================

//   const users = finalMatched

//   // =========================
//   // 6.5 ACTIVE BOOST USERS
//   // =========================

//   const activeBoosts = await prisma.boostUsage.findMany({
//     where: {
//       is_active: true,
//       ended_at: {
//         gt: new Date(), // still active
//       },
//     },
//     select: {
//       user_id: true,
//     },
//   });

//   // Convert to Set for O(1)
//   const boostedUserIds = new Set(activeBoosts.map((b) => b.user_id));

//   // =========================
//   // 7. PRESENCE (REDIS)
//   // =========================
//   const userIds = users.map((u) => u.id);

//   // 🔥 Fetch from Redis
//   const presenceMap = await getUsersPresence(userIds);

//   // =========================
//   // 8. ATTACH LAST SEEN
//   // =========================

//   const usersWithPresence = users.map((user) => {
//     const presence = presenceMap[user.id];

//     const matchScore = calculateMatchScore(
//       currentUser,
//       user
//     );

//     return {
//       ...user,
//       matchScore,
//       age: calculateAge(user.birth_date),
//       isOnline: presence?.isOnline || false,
//       lastActiveAt: presence?.lastActiveAt || null, // 👈 important
//       lastSeen: formatLastSeen(presence?.lastActiveAt),
//       createdAt: user.created_at,
//       isBoosted: boostedUserIds.has(user.id),
//       distanceKm: distanceMap.get(user.id) ?? null,
//     };
//   });

//   console.log("Users with presence info:", usersWithPresence);

//   const sortedUsers = usersWithPresence.sort((a, b) => {
//     const now = Date.now();

//     const aActivity = a.lastActiveAt?.getTime() || 0;
//     const bActivity = b.lastActiveAt?.getTime() || 0;

//     const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
//     const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;

//     const boostWindow = NEW_USER_BOOST_HOURS * 60 * 60 * 1000;

//     const aIsNew = now - aCreated < boostWindow;
//     const bIsNew = now - bCreated < boostWindow;

//     // 🔥 1. PAID BOOST (HIGHEST PRIORITY)
//     if (a.isBoosted && !b.isBoosted) return -1;
//     if (!a.isBoosted && b.isBoosted) return 1;

//     // 🔥 2. NEW USER BOOST
//     if (aIsNew && !bIsNew) return -1;
//     if (!aIsNew && bIsNew) return 1;

//     // 🔥 3. Match Score
//     if (a.matchScore !== b.matchScore) {
//       return Number(b.matchScore) - Number(a.matchScore);
//     }
//     // 🔥 4. RECENT ACTIVITY
//     return bActivity - aActivity;

//   });

//   // =========================
//   // RESPONSE
//   // =========================

//   return {
//     users: sortedUsers,
//     nextCursor: null,
//   };
// };

// import { Prisma } from "@prisma/client";
// import { prisma } from "../../../prisma/prismaClient";
// import { buildFilterQuery } from "../../../utils/feedFilter.util";
// import { formatLastSeen } from "../../../utils/lastSeen";
// import { calculateMatchScore } from "../../../utils/matchScore.constants";
// import { getUsersPresence } from "../../lastActivity/lastActivity.service";
// import { FeedParams } from "./feed.types";

// // =========================
// // HELPERS (unchanged)
// // =========================
// export const calculateAge = (birthDate: Date | null) => {
//   if (!birthDate) return null;
//   const today = new Date();
//   let age = today.getFullYear() - birthDate.getFullYear();
//   const month = today.getMonth() - birthDate.getMonth();
//   if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) age--;
//   return age;
// };

// export const getGenderFromInterest = (myInterest?: string): string[] => {
//   const value = myInterest?.toUpperCase();
//   const allGenders = ["MEN", "WOMEN", "NON_BINARY", "PREFER_NOT_TO_SAY"];
//   if (!value || value === "EVERYONE") return allGenders;
//   return allGenders.includes(value) ? [value] : allGenders;
// };

// export const getOrientationCompatibility = (
//   orientation?: string | null,
// ): string[] => {
//   const map: Record<string, string[]> = {
//     STRAIGHT: ["STRAIGHT", "BISEXUAL", "PANSEXUAL", "QUEER"],
//     GAY: ["GAY", "BISEXUAL", "PANSEXUAL", "QUEER"],
//     LESBIAN: ["LESBIAN", "BISEXUAL", "PANSEXUAL", "QUEER"],
//     BISEXUAL: ["STRAIGHT", "GAY", "LESBIAN", "BISEXUAL", "PANSEXUAL", "QUEER"],
//     PANSEXUAL: ["STRAIGHT", "GAY", "LESBIAN", "BISEXUAL", "PANSEXUAL", "DEMISEXUAL", "QUEER"],
//     DEMISEXUAL: ["STRAIGHT", "GAY", "LESBIAN", "BISEXUAL", "PANSEXUAL", "DEMISEXUAL", "QUEER"],
//     QUEER: ["STRAIGHT", "GAY", "LESBIAN", "BISEXUAL", "PANSEXUAL", "DEMISEXUAL", "QUEER"],
//     ASEXUAL: ["ASEXUAL"],
//     AROMATIC: ["AROMATIC"],
//     NOT_LISTED: [],
//   };
//   return map[orientation?.toUpperCase() ?? ""] ?? [];
// };

// // =========================
// // CONFIG
// // =========================
// // These MUST match your Prisma enums exactly. Columns are cast to ::text in SQL
// // so mixed-case string columns would silently miss — keep DB values uppercase
// // (enums) or normalise the column.
// const ALL_INTEREST_VALUES = ["MEN", "WOMEN", "NON_BINARY", "PREFER_NOT_TO_SAY", "EVERYONE"];
// const ALL_ORIENTATIONS = [
//   "STRAIGHT", "GAY", "LESBIAN", "BISEXUAL", "PANSEXUAL",
//   "DEMISEXUAL", "QUEER", "ASEXUAL", "AROMATIC", "NOT_LISTED",
// ];

// const NEW_USER_BOOST_HOURS = 48;
// const DEFAULT_PAGE_LIMIT = 20;
// // Overfetch factor: structured UI filters run AFTER the geo/match SQL, so we
// // pull extra rows per round to still fill a full page. Tune if your UI filters
// // are very selective.
// const OVERFETCH = 3;
// const MAX_ROUNDS = 5;

// // VERIFY: which column actually stores orientation? Original code was
// // inconsistent (forward used user.gender_option, reverse used
// // profile.sexual_orientation). Unified below onto profile.sexual_orientation
// // (the semantically correct field). If your real data lives in
// // user.gender_option, set ORIENTATION_TABLE = "u" and ORIENTATION_COL accordingly.
// const ORIENTATION_TABLE = "p"; // "p" = user_profiles, "u" = users
// const ORIENTATION_COL = "sexual_orientation"; // or "gender_option" (then use "u")

// // =========================
// // CURSOR (keyset)
// // =========================
// type Cursor = { k: number; id: string }; // k = meters (geo) OR created_at ms (manual)

// const encodeCursor = (c: Cursor): string =>
//   Buffer.from(JSON.stringify(c)).toString("base64url");

// const decodeCursor = (raw?: string | null): Cursor | null => {
//   if (!raw) return null;
//   try {
//     const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
//     if (typeof parsed?.k === "number" && typeof parsed?.id === "string") {
//       return parsed as Cursor;
//     }
//     return null;
//   } catch {
//     return null;
//   }
// };

// // =========================
// // FEED SERVICE
// // =========================
// export const getFeedService = async ({
//   userId,
//   cursor,
//   limit,
//   filters,
// }: FeedParams) => {
//   const pageLimit = limit ?? DEFAULT_PAGE_LIMIT;
//   const decodedCursor = decodeCursor(cursor as string | undefined);

//   // -------------------------
//   // 1. CURRENT USER
//   // -------------------------
//   const currentUser = await prisma.user.findUnique({
//     where: { id: userId },
//     include: {
//       profile: true,
//       eduWork: true,
//       bio: true,
//       photos: true,
//       answer: { include: { question: true, option: true } },
//     },
//   });

//   if (!currentUser || !currentUser.profile) {
//     throw new Error("User profile not found");
//   }

//   const { interested_in, sexual_orientation } = currentUser.profile;
//   const { gender } = currentUser;

//   if (!gender || !interested_in) {
//     throw new Error("Required fields missing");
//   }

//   const myGender = gender.toUpperCase();
//   const myInterest = interested_in.toUpperCase();
//   const myOrientation = (sexual_orientation ?? "").toUpperCase();

//   const myLatitude = Number(currentUser.profile.latitude);
//   const myLongitude = Number(currentUser.profile.longitude);
//   const maxDistance = currentUser.profile.max_distance_km ?? 50;

//   // -------------------------
//   // 2. PARALLEL QUERIES (only active boosts needed here; swipes/blocks now
//   //    live inside the SQL as NOT EXISTS — no giant arrays)
//   // -------------------------
//   const now = new Date();
//   const activeBoosts = await prisma.boostUsage.findMany({
//     where: { is_active: true, ended_at: { gt: now } },
//     select: { user_id: true },
//   });
//   const boostedUserIds = new Set(activeBoosts.map((b) => b.user_id));

//   // -------------------------
//   // 3. PRECOMPUTE MATCH FILTERS (all pushed into SQL)
//   // -------------------------
//   // (a) genders I want to see
//   const genderFilter = getGenderFromInterest(myInterest);

//   // (b) mutual interest — target.interested_in whose expansion includes MY
//   //     gender. Includes "EVERYONE" (the bug that dropped everyone-targets).
//   const interestedInFilter = ALL_INTEREST_VALUES.filter((v) =>
//     getGenderFromInterest(v).includes(myGender),
//   );

//   // (c) forward orientation — their orientation must be in MY compat set
//   const orientationForward = getOrientationCompatibility(myOrientation);

//   // (d) reverse orientation — their orientation whose compat set includes ME
//   const orientationReverse = ALL_ORIENTATIONS.filter((o) =>
//     getOrientationCompatibility(o).includes(myOrientation),
//   );

//   // If either orientation set is empty (e.g. NOT_LISTED), nothing matches.
//   if (orientationForward.length === 0 || orientationReverse.length === 0) {
//     return { users: [], nextCursor: null };
//   }

//   // -------------------------
//   // UI-supplied structured filters (age / city / etc.)
//   // Applied in the Prisma hydration step (see loop).
//   // -------------------------
//   const filterQuery = filters ? buildFilterQuery(filters) : { where: {} };
//   const userFilters = Object.fromEntries(
//     Object.entries(filterQuery.where || {}).filter(([k]) => k !== "profile"),
//   );
//   const profileFilters = filterQuery.where?.profile?.is || {};

//   const hasManualLocationFilter =
//     !!filters?.location?.city ||
//     !!filters?.location?.state ||
//     !!filters?.location?.country;

//   // -------------------------
//   // SQL fragments shared by both modes
//   // -------------------------
//   const orientCol = Prisma.raw(`${ORIENTATION_TABLE}.${ORIENTATION_COL}`);

//   const matchConditions = Prisma.sql`
//     u.deleted_at IS NULL
//     AND u.id <> ${userId}::uuid
//     AND NOT EXISTS (
//       SELECT 1 FROM swipes  s
//        WHERE s."swiperId" = ${userId}::uuid
//       AND s."targetUserId" = u.id
//     )
//     AND NOT EXISTS (
//     SELECT 1
//     FROM "UserBlock" b
//     WHERE (
//         b."blockerId"::uuid = ${userId}::uuid
//         AND b."blockedId"::uuid = u.id
//     )
//     OR (
//         b."blockedId"::uuid = ${userId}::uuid
//         AND b."blockerId"::uuid = u.id
//     )
// )
//     AND u.gender::text = ANY(ARRAY[${Prisma.join(genderFilter)}]::text[])
//     AND p.interested_in::text = ANY(ARRAY[${Prisma.join(interestedInFilter)}]::text[])
//     AND ${orientCol}::text = ANY(ARRAY[${Prisma.join(orientationForward)}]::text[])
//     AND ${orientCol}::text = ANY(ARRAY[${Prisma.join(orientationReverse)}]::text[])
//   `;

//   // -------------------------
//   // Page fetch loop (keyset + overfetch to survive structured filters)
//   // -------------------------
//   const batchSize = Math.max(pageLimit * OVERFETCH, 60);
//   const collected: any[] = [];
//   const meterById = new Map<string, number>();

//   let cursorState: Cursor | null = decodedCursor;
//   let nextCursor: string | null = null;
//   let filledCursor: Cursor | null = null;

//   for (let round = 0; round < MAX_ROUNDS && collected.length < pageLimit; round++) {
//     let rows: { id: string; sort_val: number }[];

//     if (hasManualLocationFilter) {
//       // Manual location -> no PostGIS. Keyset on created_at (newest first).
//       rows = await prisma.$queryRaw<{ id: string; sort_val: number }[]>`
//         SELECT
//           u.id,
//           (EXTRACT(EPOCH FROM u.created_at) * 1000)::float8 AS sort_val
//         FROM users u
//         JOIN user_profiles p ON p.user_id = u.id
//         WHERE ${matchConditions}
//           ${cursorState
//             ? Prisma.sql`AND (
//                 (EXTRACT(EPOCH FROM u.created_at) * 1000) < ${cursorState.k}
//                 OR ((EXTRACT(EPOCH FROM u.created_at) * 1000) = ${cursorState.k} AND u.id < ${cursorState.id}::uuid)
//               )`
//             : Prisma.empty}
//         ORDER BY sort_val DESC, u.id DESC
//         LIMIT ${batchSize};
//       `;
//     } else {
//       // Geo -> PostGIS distance + ST_DWithin. Keyset on raw meters (nearest first).
//       rows = await prisma.$queryRaw<{ id: string; sort_val: number }[]>`
//         SELECT
//           u.id,
//           ST_Distance(
//             p.location,
//             ST_SetSRID(ST_MakePoint(${myLongitude}, ${myLatitude}), 4326)::geography
//           )::float8 AS sort_val
//         FROM users u
//         JOIN user_profiles p ON p.user_id = u.id
//         WHERE ${matchConditions}
//           AND ST_DWithin(
//             p.location,
//             ST_SetSRID(ST_MakePoint(${myLongitude}, ${myLatitude}), 4326)::geography,
//             ${maxDistance * 1000}
//           )
//           ${cursorState
//             ? Prisma.sql`AND (
//                 ST_Distance(p.location, ST_SetSRID(ST_MakePoint(${myLongitude}, ${myLatitude}), 4326)::geography) > ${cursorState.k}
//                 OR (
//                   ST_Distance(p.location, ST_SetSRID(ST_MakePoint(${myLongitude}, ${myLatitude}), 4326)::geography) = ${cursorState.k}
//                   AND u.id > ${cursorState.id}::uuid
//                 )
//               )`
//             : Prisma.empty}
//         ORDER BY sort_val ASC, u.id ASC
//         LIMIT ${batchSize};
//       `;
//     }

//     if (rows.length === 0) break; // no more candidates at all

//     if (!hasManualLocationFilter) {
//       for (const r of rows) meterById.set(r.id, Number(r.sort_val));
//     }

//     // Hydrate ONLY this batch, applying the UI structured filters here.
//     const idOrder = rows.map((r) => r.id);
//     const hydrated = await prisma.user.findMany({
//       where: {
//         id: { in: idOrder },
//         ...userFilters,
//         ...(Object.keys(profileFilters).length > 0
//           ? { profile: { is: profileFilters } }
//           : {}),
//       },
//       include: {
//         profile: true,
//         eduWork: true,
//         bio: true,
//         photos: true,
//         answer: { include: { question: true, option: true } },
//       },
//     });
//     const byId = new Map(hydrated.map((u) => [u.id, u]));

//     // Walk in DB order; append survivors; capture exact cursor when page fills.
//     let pageFilled = false;
//     for (const r of rows) {
//       const u = byId.get(r.id);
//       if (!u) continue;
//       collected.push(u);
//       if (collected.length === pageLimit) {
//         filledCursor = { k: Number(r.sort_val), id: r.id };
//         pageFilled = true;
//         break;
//       }
//     }

//     if (pageFilled) break;

//     // advance cursor to the tail of this DB batch and continue
//     const tail = rows[rows.length - 1];
//     cursorState = { k: Number(tail.sort_val), id: tail.id };

//     if (rows.length < batchSize) break; // SQL exhausted
//   }

//   if (collected.length === 0) {
//     return { users: [], nextCursor: null };
//   }

//   const page = collected.slice(0, pageLimit);
//   if (filledCursor) nextCursor = encodeCursor(filledCursor);

//   // -------------------------
//   // 4. REDIS PRESENCE
//   // -------------------------
//   const presenceMap = await getUsersPresence(page.map((u) => u.id));

//   // -------------------------
//   // 5. MATCH SCORE + ENRICH
//   // -------------------------
//   const nowMs = Date.now();
//   const boostWindow = NEW_USER_BOOST_HOURS * 60 * 60 * 1000;

//   const enriched = page.map((user) => {
//     const presence = presenceMap[user.id];
//     const meters = meterById.get(user.id);
//     return {
//       ...user,
//       matchScore: calculateMatchScore(currentUser, user),
//       age: calculateAge(user.birth_date),
//       isOnline: presence?.isOnline || false,
//       lastActiveAt: presence?.lastActiveAt || null,
//       lastSeen: formatLastSeen(presence?.lastActiveAt),
//       createdAt: user.created_at,
//       isBoosted: boostedUserIds.has(user.id),
//       distanceKm: meters != null ? Math.round((meters / 1000) * 100) / 100 : null,
//     };
//   });

//   // -------------------------
//   // 6. RE-RANK WITHIN PAGE (boost > new-user > matchScore > activity)
//   //    NOTE: this is IN-PAGE ranking. See the boost caveat in the answer.
//   // -------------------------
//   const sortedUsers = enriched.sort((a, b) => {
//     const aActivity = a.lastActiveAt?.getTime() || 0;
//     const bActivity = b.lastActiveAt?.getTime() || 0;
//     const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
//     const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
//     const aIsNew = nowMs - aCreated < boostWindow;
//     const bIsNew = nowMs - bCreated < boostWindow;

//     if (a.isBoosted !== b.isBoosted) return a.isBoosted ? -1 : 1;
//     if (aIsNew !== bIsNew) return aIsNew ? -1 : 1;
//     if (a.matchScore !== b.matchScore) {
//       return Number(b.matchScore) - Number(a.matchScore);
//     }
//     return bActivity - aActivity;
//   });

//   // -------------------------
//   // 7. RESPONSE
//   // -------------------------
//   return {
//     users: sortedUsers,
//     nextCursor, // base64url keyset cursor, or null when no more pages
//   };
// };


import { Prisma } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";
import { buildFilterQuery } from "../../../utils/feedFilter.util";
import { formatLastSeen } from "../../../utils/lastSeen";
import { calculateMatchScore } from "../../../utils/matchScore.constants";
import { getUsersPresence } from "../../lastActivity/lastActivity.service";
import { CurrentUser, FeedParams } from "./feed.types";
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
// HELPERS (unchanged)
// =========================
export const calculateAge = (
  birthDate: Date | string | null
): number | null => {
  console.log("calculateAge called");
  console.log("birthDate:", birthDate);
  console.log("typeof:", typeof birthDate);

  if (!birthDate) return null;

  const dob =
    birthDate instanceof Date
      ? birthDate
      : new Date(birthDate);

  console.log("dob:", dob);
  console.log("instanceof Date:", dob instanceof Date);
  console.log("constructor:", dob.constructor.name);
  console.log("getTime:", dob.getTime());

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
const OVERFETCH = 3;
const MAX_ROUNDS = 5;

// VERIFY which column stores orientation. Unified on profile.sexual_orientation.
const ORIENTATION_TABLE = "p"; // "p" = user_profiles, "u" = users
const ORIENTATION_COL = "sexual_orientation"; // or "gender_option" (then use "u")

// =========================
// CURSOR (keyset)
// =========================
type Cursor = { k: number; id: string }; // k = meters (geo) OR created_at ms (manual)

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
// FEED SERVICE
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
  // 1 + 2. CURRENT USER + ACTIVE BOOSTS (parallel — independent queries)
  // -------------------------
  const USER_CACHE_TTL = 60 * 10;
  const USER_CACHE_KEY = `feed:user:${userId}`;

  const currentUserPromise = async (): Promise<CurrentUser | null> => {
    const cached = await redis.get<CurrentUser>(USER_CACHE_KEY);

    if (cached) {
      console.log("✅ Current User from Redis");
      return cached;
    }

    console.log("📦 Current User from DB");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        eduWork: true,
        bio: true,
        photos: true,
        answer: {
          include: {
            question: true,
            option: true,
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

  const [currentUser, activeBoosts] = await Promise.all([
    currentUserPromise(),
    prisma.boostUsage.findMany({
      where: {
        is_active: true,
        ended_at: {
          gt: now,
        },
      },
      select: {
        user_id: true,
      },
    }),
  ]);

  if (!currentUser || !currentUser.profile) {
    throw new Error("User profile not found");
  }

  const boostedUserIds = new Set(activeBoosts.map((b) => b.user_id));

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
  // 3. PRECOMPUTE MATCH FILTERS (all pushed into SQL)
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
  const filterQuery = filters ? buildFilterQuery(filters) : { where: {} };
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

  // Reusable geography point for `me` (bound as params on each interpolation).
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
  // Page fetch loop (keyset + overfetch)
  // -------------------------
  const batchSize = Math.max(pageLimit * OVERFETCH, 60);
  const collected: any[] = [];
  const meterById = new Map<string, number>();

  let cursorState: Cursor | null = decodedCursor;
  let nextCursor: string | null = null;
  let filledCursor: Cursor | null = null;

  for (let round = 0; round < MAX_ROUNDS && collected.length < pageLimit; round++) {
    let rows: { id: string; sort_val: number }[];

    if (hasManualLocationFilter) {
      // Manual location -> no PostGIS. Keyset on created_at (newest first).
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
    } else {
      // Geo -> KNN via <-> so the GiST index drives ordering (no full sort).
      // Distance (meters) computed ONCE per row. ST_DWithin prunes to radius
      // using the same index; LIMIT lets the index scan stop early.
      rows = await prisma.$queryRaw<{ id: string; sort_val: number }[]>`
        SELECT
          u.id,
          (p.location::geography <-> ${me})::float8 AS sort_val
        FROM users u
        JOIN user_profiles p ON p.user_id = u.id
        WHERE ${matchConditions}
          AND ST_DWithin(p.location::geography, ${me}, ${maxDistance * 1000})
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
    }

    if (rows.length === 0) break;

    if (!hasManualLocationFilter) {
      for (const r of rows) meterById.set(r.id, Number(r.sort_val));
    }

    // Hydrate ONLY this batch, applying UI structured filters here.
    // NOTE: `answer` include is the heaviest part — drop it if the feed card
    // does not render Q&A.
    const idOrder = rows.map((r) => r.id);
    const hydrated = await prisma.user.findMany({
      where: {
        id: { in: idOrder },
        ...userFilters,
        ...(Object.keys(profileFilters).length > 0
          ? { profile: { is: profileFilters } }
          : {}),
      },
      include: {
        profile: true,
        eduWork: true,
        bio: true,
        photos: true,
        answer: { include: { question: true, option: true } },
      },
    });
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

  // -------------------------
  // 4. REDIS PRESENCE
  // -------------------------
  const presenceMap = await getUsersPresence(page.map((u) => u.id));

  // -------------------------
  // 5. MATCH SCORE + ENRICH
  // -------------------------
  const nowMs = Date.now();
  const boostWindow = NEW_USER_BOOST_HOURS * 60 * 60 * 1000;

  const enriched = page.map((user) => {
    const presence = presenceMap[user.id];
    const meters = meterById.get(user.id);
    return {
      ...user,
      matchScore: calculateMatchScore(currentUser, user),
      age: calculateAge(user.birth_date),
      isOnline: presence?.isOnline || false,
      lastActiveAt: presence?.lastActiveAt || null,
      lastSeen: formatLastSeen(presence?.lastActiveAt),
      createdAt: user.created_at,
      isBoosted: boostedUserIds.has(user.id),
      distanceKm: meters != null ? Math.round((meters / 1000) * 100) / 100 : null,
      // Static values
      trust: "75%",
      replyTime: "5 m reply",
    };
  });

  // -------------------------
  // 6. RE-RANK WITHIN PAGE
  // -------------------------
  const sortedUsers = enriched.sort((a, b) => {
    const aActivity = a.lastActiveAt?.getTime() || 0;
    const bActivity = b.lastActiveAt?.getTime() || 0;
    const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    const aIsNew = nowMs - aCreated < boostWindow;
    const bIsNew = nowMs - bCreated < boostWindow;

    if (a.isBoosted !== b.isBoosted) return a.isBoosted ? -1 : 1;
    if (aIsNew !== bIsNew) return aIsNew ? -1 : 1;
    if (a.matchScore !== b.matchScore) {
      return Number(b.matchScore) - Number(a.matchScore);
    }
    return bActivity - aActivity;
  });

  // -------------------------
  // 7. RESPONSE
  // -------------------------
  return {
    users: sortedUsers,
    nextCursor,
  };
};
