import { prisma } from "../../prisma/prismaClient";


const fieldMap: any = {
  VIEW: "total_views",
  LIKE: "total_likes",
  INTEREST: "total_interests",
  REACH: "total_reach"
};

export const trackBoostEvent = async ({
  targetUserId,
  actorId,
  type
}: {
  targetUserId: string;
  actorId: string;
  type: "VIEW" | "LIKE" | "INTEREST" | "REACH";
}) => {
  const activeBoost = await prisma.boostUsage.findFirst({
    where: {
      user_id: targetUserId,
      is_active: true,
      ended_at: null
    }
  });

  if (!activeBoost) return;

  const field = fieldMap[type];

  // prevent duplicates (for VIEW/REACH)
  if (type === "VIEW" || type === "REACH") {
    const exists = await prisma.boostEvent.findFirst({
      where: {
        boost_usage_id: activeBoost.id,
        actor_id: actorId,
        event_type: type
      }
    });

    if (exists) return;
  }

  await prisma.$transaction([
    prisma.boostUsage.update({
      where: { id: activeBoost.id },
      data: {
        [field]: { increment: 1 }
      }
    }),

    prisma.userBoostStats.upsert({
      where: { user_id: targetUserId },
      update: {
        [field]: { increment: 1 }
      },
      create: {
        user_id: targetUserId,
        [field]: 1
      }
    }),

    prisma.boostEvent.create({
      data: {
        boost_usage_id: activeBoost.id,
        user_id: targetUserId,
        actor_id: actorId,
        event_type: type
      }
    })
  ]);
};
