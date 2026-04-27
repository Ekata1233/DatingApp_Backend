import { prisma } from "../../../prisma/prismaClient";
import { FeedParams } from "./feed.types";
import { buildFilterQuery } from "../../../utils/feedFilter.util";

// -------------------------
// HELPERS
// -------------------------
export const getGenderFromInterest = (lookingFor: string) => {
  if (lookingFor === "MEN") return ["MEN"];
  if (lookingFor === "WOMEN") return ["WOMEN"];
  return ["MEN", "WOMEN"];
};

export const getOrientationCompatibility = (orientation: string) => {
  const map: Record<string, string[]> = {
    STRAIGHT: ["STRAIGHT"],
    GAY: ["GAY", "BISEXUAL"],
    LESBIAN: ["LESBIAN", "BISEXUAL"],
    BISEXUAL: ["STRAIGHT", "GAY", "LESBIAN", "BISEXUAL"],
  };

  return map[orientation?.toUpperCase()] || ["STRAIGHT", "BISEXUAL"];
};

// -------------------------
// SERVICE
// -------------------------
export const getFeedService = async ({
  userId,
  cursor,
  limit,
  filters,
}: FeedParams) => {

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!currentUser?.profile) {
    throw new Error("User profile not found");
  }

  const { gender, gender_option } = currentUser;
  const { interested_in, sexual_orientation } = currentUser.profile;

  // -------------------------
  // FILTER BUILD
  // -------------------------

  console.log("CURRENT USER:", JSON.stringify(currentUser, null, 2));
  const filterQuery = filters
    ? buildFilterQuery(filters, currentUser)
    : { where: {} };

    console.log("BUILT FILTER QUERY:", JSON.stringify(filterQuery, null, 2));
  const userFilters = Object.fromEntries(
    Object.entries(filterQuery.where || {}).filter(
      ([k]) => k !== "profile"
    )
  );

  console.log("USER FILTERS:", userFilters);

  const profileFilters = filterQuery.where?.profile?.is || {};

  console.log("PROFILE FILTERS:", profileFilters);

  // -------------------------
  // EXCLUSIONS
  // -------------------------
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

  const excludedArray = Array.from(
    new Set([
      userId,
      ...swipes.map((s) => s.targetUserId),
      ...blocks.map((b) => b.blockedId),
      ...blockedBy.map((b) => b.blockerId),
    ])
  );

  const genderFilter = getGenderFromInterest(interested_in);
  const orientationFilter = getOrientationCompatibility(sexual_orientation);


  // -------------------------
  // PRIMARY USERS
  // -------------------------
  const primaryUsers = await prisma.user.findMany({
    take: limit,
    where: {
      id: { notIn: excludedArray },

      gender: { in: genderFilter },
      gender_option: { in: orientationFilter },

      deleted_at: null,

      // relaxed filters (IMPORTANT FIX)
      profile_completion: {
        gte: 20,
      },

      last_active_at: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },

      ...userFilters,

            profile: {
              is: {
                ...profileFilters,

                interested_in: {
                  in:
                    gender === "MEN"
                      ? ["MEN", "EVERYONE"]
                      : ["WOMEN", "EVERYONE"],
                },
              },
            },
    },

    orderBy: [
      { last_active_at: "desc" },
      { created_at: "desc" },
    ],
  });

  let users = primaryUsers;

  // -------------------------
  // FALLBACK (IMPORTANT FIX)
  // -------------------------
  if (users.length < limit) {
    const fallbackUsers = await prisma.user.findMany({
      take: limit - users.length,
      where: {
        id: {
          notIn: [...excludedArray, ...users.map((u) => u.id)],
        },

        deleted_at: null,

        ...userFilters,

        profile: {
          is: {
            ...profileFilters,
          },
        },
      },

      orderBy: [
        { last_active_at: "desc" },
        { created_at: "desc" },
      ],
    });

    users = [...users, ...fallbackUsers];
  }

  return {
    users,
    nextCursor: null,
  };
};
