import { prisma } from "../../../prisma/prismaClient";
import { FeedParams } from "./feed.types";

// utils/match.helper.ts

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

  return map[orientation?.toUpperCase()] || [];
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

  const { interested_in, sexual_orientation } = currentUser.profile;
  const { gender, gender_option } = currentUser;
  console.log("Intereste IN :", interested_in, sexual_orientation);

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

  const myGender = gender;
const myInterest = interested_in;
const myOrientation = sexual_orientation;

const genderFilter = getGenderFromInterest(myInterest);
const orientationFilter = getOrientationCompatibility(myOrientation);

const primaryUsers = await prisma.user.findMany({
  take: limit,
  where: {
    id: { notIn: excludedArray },

    // ✅ 1. I am interested in them
    gender: { in: genderFilter },

    // ✅ 2. Orientation compatibility
    gender_option: { in: orientationFilter },

    // ✅ 3. THEY are interested in MY gender
    profile: {
      interested_in: {
        in:
          myGender === "MEN"
            ? ["MEN", "EVERYONE"]
            : ["WOMEN", "EVERYONE"],
      },
    },

    deleted_at: null,
  },
  orderBy: [
    { last_active_at: "desc" },
    { created_at: "desc" },
  ],
});


  console.log("Primary Users Found:", primaryUsers);

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

  console.log("Total Users Returned:", users);

  return {
    users,
    nextCursor: null,
  };
};