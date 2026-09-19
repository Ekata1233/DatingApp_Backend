import { prisma } from "../../prisma/prismaClient";

export const endExpiredBoostsService = async () => {
  const now = new Date();

  const expiredBoosts = await prisma.boostUsage.findMany({
    where: {
      status: "ACTIVE",
      is_active: true,
      expected_end_at: {
        lte: now,
      },
    },
    select: {
      id: true,
      user_id: true,
      boost_type: true,
      expected_end_at: true,
    },
  });

  if (expiredBoosts.length === 0) {
    return {
      endedCount: 0,
    };
  }

  const expiredIds = expiredBoosts.map(
    (boost) => boost.id
  );

  const result = await prisma.boostUsage.updateMany({
    where: {
      id: {
        in: expiredIds,
      },
      status: "ACTIVE",
      is_active: true,
    },
    data: {
      status: "COMPLETED",
      is_active: false,
      ended_at: now,
    },
  });

  console.log(
    `Ended ${result.count} expired boost(s)`
  );

  return {
    endedCount: result.count,
  };
};