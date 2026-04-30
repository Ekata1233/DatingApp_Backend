import { prisma } from "../../../prisma/prismaClient";
import { buildFilterQuery } from "../../../utils/feedFilter.util";
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

  console.log("CURRENT USER:", JSON.stringify(currentUser, null, 2));
  console.log("INCOMING FILTERS:", JSON.stringify(filters, null, 2));

  const filterQuery = filters
    ? buildFilterQuery(filters, currentUser)
    : { where: {} };

  console.log("BUILT FILTER QUERY:", JSON.stringify(filterQuery, null, 2));
  const userFilters = Object.fromEntries(
    Object.entries(filterQuery.where || {}).filter(([k]) => k !== "profile"),
  );

  console.log("USER FILTERS:", userFilters);

  const profileFilters = filterQuery.where?.profile?.is || {};

  console.log("PROFILE FILTERS:", profileFilters);

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

  const users = finalMatched
    .sort((a, b) => {
      const aTime = a.last_active_at?.getTime() || 0;
      const bTime = b.last_active_at?.getTime() || 0;
      return bTime - aTime;
    })
    .slice(0, limit);

  // =========================
  // RESPONSE
  // =========================

  return {
    users,
    nextCursor: null,
  };
};
