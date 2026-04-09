// modules/user/suggestion.service.ts
import { prisma } from "../../../prisma/prismaClient";


interface SuggestionParams {
  userId: string;
  cursor?: string;
  limit: number;
}

export const getSuggestionsService = async ({
  userId,
  cursor,
  limit,
}: SuggestionParams) => {
  // 1. Get current user profile
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!currentUser || !currentUser.profile) {
    throw new Error("User profile not found");
  }

  const {
    interested_in,
    max_distance_km,
    latitude,
    longitude,
  } = currentUser.profile;

  // 2. Fetch excluded user IDs (IMPORTANT)
  const [swipes, blocks, blockedBy]: [
  { targetUserId: string }[],
  { blockedId: string }[],
  { blockerId: string }[]
]  = await Promise.all([
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
    userId, // self
    ...swipes.map((s) => s.targetUserId),
    ...blocks.map((b) => b.blockedId),
    ...blockedBy.map((b) => b.blockerId),
  ]);

  // 3. Convert set → array
  const excludedArray = Array.from(excludedIds);

  // 4. Main Query (Cursor-based pagination ⚡)
  const users = await prisma.user.findMany({
    take: limit + 1,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
    where: {
      id: { notIn: excludedArray },
      deleted_at: null,
      onboarding_completed: true,
      profile: {
        interested_in: interested_in || undefined,
      },
    },
    include: {
      profile: true,
      photos: true,
      bio: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  // 5. Next Cursor Logic
  let nextCursor: string | null = null;

  if (users.length > limit) {
    const nextItem = users.pop();
    nextCursor = nextItem!.id;
  }

  return {
    users,
    nextCursor,
  };
};
