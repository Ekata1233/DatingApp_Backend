import { Prisma } from "@prisma/client";

export const recordDailyFeedView = async (
  tx: Prisma.TransactionClient,
  userId: string,
  targetUserId: string,
) => {
  const now = new Date();

  // UTC calendar date
  const viewDate = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    ),
  );

  await tx.userDailyFeedView.upsert({
    where: {
      userId_targetUserId_viewDate: {
        userId,
        targetUserId,
        viewDate,
      },
    },
    update: {},
    create: {
      userId,
      targetUserId,
      viewDate,
    },
  });
};