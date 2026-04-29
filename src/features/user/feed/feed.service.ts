import { prisma } from "../../../prisma/prismaClient";
import { buildFilterQuery } from "../../../utils/feedFilter.util";
import { formatLastSeen } from "../../../utils/lastSeen";
import { getUsersPresence } from "../../lastActivity/lastActivity.service";
import { FeedParams } from "./feed.types";

// =========================
// HELPERS
// =========================

export const getGenderFromInterest = (lookingFor: string) => {
  const value = lookingFor?.toUpperCase();

  if (value === "MEN") return ["MEN"];
  if (value === "WOMEN") return ["WOMEN"];
  return ["MEN", "WOMEN"];
};

export const getOrientationCompatibility = (orientation: string) => {
  const map: Record<string, string[]> = {
    STRAIGHT: ["STRAIGHT", "BISEXUAL"],
    GAY: ["GAY", "BISEXUAL"],
    LESBIAN: ["LESBIAN", "BISEXUAL"],
    BISEXUAL: ["STRAIGHT", "GAY", "LESBIAN", "BISEXUAL"],
  };

  return map[orientation?.toUpperCase()] || [];
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
  // 1. Current User
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!currentUser || !currentUser.profile) {
    throw new Error("User profile not found");
  }

  const { interested_in, sexual_orientation } = currentUser.profile;
  const { gender, gender_option } = currentUser;

  if (!gender || !gender_option || !interested_in) {
    throw new Error("Required fields missing");
  }

  // -------------------------
  // FILTER BUILD
  // -------------------------


  const filterQuery = filters
    ? buildFilterQuery(filters, currentUser)
    : { where: {} };

  const userFilters = Object.fromEntries(
    Object.entries(filterQuery.where || {}).filter(([k]) => k !== "profile"),
  );

  const profileFilters = filterQuery.where?.profile?.is || {};

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

const allUsers = await prisma.user.findMany({
  where: {
    id: { notIn: excludedArray },
    deleted_at: null,

    // ✅ APPLY USER FILTERS
    ...userFilters,

    // ✅ APPLY PROFILE FILTERS (THIS WAS MISSING)
    ...(Object.keys(profileFilters).length > 0 && {
      profile: {
        is: profileFilters,
      },
    }),
  },
  include: { profile: true },
});


  // =========================
  // 5. APPLY FILTERS (STEPWISE)
  // =========================

  // STEP 1 → Gender match (my preference)
  const genderMatched = allUsers.filter((user) =>
    genderFilter.includes(user.gender?.toUpperCase()),
  );

  // STEP 2 → Mutual interest
  const mutualInterest = genderMatched.filter(
    (user) =>
      user.profile?.interested_in?.toUpperCase() === gender?.toUpperCase(),
  );

  // STEP 3 → Orientation (they match me)
  const orientationMatched = mutualInterest.filter((user) =>
    orientationFilter.includes(user.gender_option?.toUpperCase()),
  );

  // STEP 4 → Reverse orientation (I match them)
  const finalMatched = orientationMatched.filter((user) => {
    const theirCompatible = getOrientationCompatibility(
      user.profile?.sexual_orientation,
    );

    return theirCompatible.includes(sexual_orientation?.toUpperCase());
  });

  // =========================
  // 6. SORT + LIMIT
  // =========================

const users = finalMatched.slice(0, limit);


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

   return {
      ...user,
      isOnline: presence?.isOnline || false,
      lastActiveAt: presence?.lastActiveAt || null, // 👈 important
      lastSeen: formatLastSeen(presence?.lastActiveAt),
      createdAt: user.created_at,
    };
});

const sortedUsers = usersWithPresence.sort((a, b) => {
  const now = Date.now();

  const aActivity = a.lastActiveAt?.getTime() || 0;
  const bActivity = b.lastActiveAt?.getTime() || 0;

  const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;

  const boostWindow = NEW_USER_BOOST_HOURS * 60 * 60 * 1000;

  const aIsNew = now - aCreated < boostWindow;
  const bIsNew = now - bCreated < boostWindow;

  // 🔥 1. NEW USER BOOST
  if (aIsNew && !bIsNew) return -1;
  if (!aIsNew && bIsNew) return 1;

  // 🔥 2. RECENT ACTIVITY
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
