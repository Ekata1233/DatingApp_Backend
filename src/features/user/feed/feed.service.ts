// // modules/user/feed.service.ts
// import { prisma } from "../../../prisma/prismaClient";
// import { FeedParams } from "./feed.types";

// const MODE_CONFIG = {
//   date_to_marry: {
//     religion: true,
//     community: true,
//     fixedGender: true, // opposite gender only
//   },

//   dating: {
//     religion: false,
//     community: false,
//     fixedGender: false,
//   },

//   mature_connection: {
//     religion: true,
//     community: true,
//     fixedGender: false,
//   },
// } as const;

// const getOppositeGender = (gender: string): string | undefined => {
//   const g = gender.toLowerCase();

//   if (g === "male") return "Female";
//   if (g === "female") return "Male";

//   return undefined;
// };



// export const getFeedService = async ({
//   userId,
//   cursor,
//   limit,
//   mode,
//   // filters
// }: FeedParams) => {
//   // 1. Get current user profile
//   const currentUser = await prisma.user.findUnique({
//     where: { id: userId },
//     include: { profile: true },
//   });

//   console.log("Current User Profile:", currentUser);

//   if (!currentUser || !currentUser.profile) {
//     throw new Error("User profile not found");
//   }

//   const { interested_in, religion, community, country, state, city } =
//     currentUser.profile;

//     const { gender } = currentUser;
// console.log("User Gender:", gender);

//   // 2. Fetch excluded user IDs (swipes + blocks)
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

//   const where: any = {
//     id: { notIn: excludedArray },
//     deleted_at: null,
//     // onboarding_completed: true,
//   };

//   // 🔥 GENDER LOGIC
// // 🔥 FINAL GENDER LOGIC

// if (mode === "date_to_marry") {
//   // Only opposite gender
//   if (!gender) {
//     throw new Error("Gender is required for date_to_marry mode");
//   }
//   const opposite = getOppositeGender(gender);
//   if (opposite) {
//     where.gender = opposite;
//   }
// } else {
//   // dating + mature_connection → based on user preference
//   if (interested_in && interested_in !== "everyone") {
//     where.gender = interested_in;
//   }
//   // if "everyone" → no gender filter applied
// }


// const profileFilter: any = {};

// if (MODE_CONFIG[mode].religion && religion) {
//   profileFilter.religion = religion;
// }

// if (MODE_CONFIG[mode].community && community) {
//   profileFilter.community = community;
// }

// if (country) profileFilter.country = country;
// if (state) profileFilter.state = state;
// if (city) profileFilter.city = city;

// if (Object.keys(profileFilter).length > 0) {
//   where.profile = {
//     is: profileFilter,
//   };
// }
//   // 4. MAIN QUERY
//   const users = await prisma.user.findMany({
//     take: limit + 1,
//     ...(cursor && {
//       cursor: { id: cursor },
//       skip: 1,
//     }),

//     where,

//     // include: {
//     //   profile: true,
//     //   photos: true,
//     //   bio: true,
//     // },

//     orderBy: {
//       created_at: "desc",
//     },
//   });

//   // 5. CURSOR PAGINATION
//   let nextCursor: string | null = null;

//   if (users.length > limit) {
//     const nextItem = users.pop();
//     nextCursor = nextItem!.id;
//   }

//   return {
//     users,
//     nextCursor,
//   };
// };

import { prisma } from "../../../prisma/prismaClient";
import { FeedParams } from "./feed.types";

// utils/match.helper.ts

export const getGenderFromInterest = (lookingFor: string) => {
  if (lookingFor === "MEN") return ["MEN"];
  if (lookingFor === "WOMEN") return ["WOMEN"];
  return ["MEN", "WOMEN"]; // EVERYONE
};

// 🎯 CORE MATCHING LOGIC
export const getOrientationCompatibility = (orientation: string) => {
  const map: Record<string, string[]> = {
    STRAIGHT: ["STRAIGHT", "BISEXUAL"],
    GAY: ["GAY", "BISEXUAL"],
    LESBIAN: ["LESBIAN", "BISEXUAL"],
    BISEXUAL: ["STRAIGHT", "GAY", "LESBIAN", "BISEXUAL"],
  };

  return map[orientation] || [orientation];
};


export const getFeedService = async ({
  userId,
  cursor,
  limit,
}: FeedParams) => {
  // 1. Current User
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!currentUser || !currentUser.profile) {
    throw new Error("User profile not found");
  }

  const { interested_in } = currentUser.profile;
  const { gender, gender_option } = currentUser;

  if (!gender || !gender_option || !interested_in) {
    throw new Error("Required fields missing");
  }

  // 2. Exclusions
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

  const genderFilter = getGenderFromInterest(interested_in);
 const orientationFilter = getOrientationCompatibility(gender_option);

  // =========================================
  // 4. PRIORITY 1 → ORIENTATION MATCH
  // =========================================
  
  const primaryUsers = await prisma.user.findMany({
    take: limit,
    where: {
      id: { notIn: excludedArray },
      gender: { in: genderFilter },
      gender_option: { in: orientationFilter },
      deleted_at: null,
    },
    orderBy: [
  { last_active_at: "desc" },
  { created_at: "desc" }
]
  });

  let users = primaryUsers;

  // =========================================
  // 5. PRIORITY 2 → FALLBACK (ONLY GENDER)
  // =========================================
  if (users.length < limit) {
    const remainingLimit = limit - users.length;

    const fallbackUsers = await prisma.user.findMany({
      take: remainingLimit,
      where: {
        id: {
          notIn: [...excludedArray, ...users.map((u) => u.id)],
        },
        gender: { in: genderFilter },
        deleted_at: null,
      },
      orderBy: [
  { last_active_at: "desc" },
  { created_at: "desc" }
]
    });

    users = [...users, ...fallbackUsers];
  }

  return {
    users,
    nextCursor: null,
  };
};