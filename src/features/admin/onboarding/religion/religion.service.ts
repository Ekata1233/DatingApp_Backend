import { prisma } from "../../../../prisma/prismaClient";
import { IReligionPayload, IReligion } from "./religion.types";

/**
 * Create Religion
 */
export const createReligionData = async (
  payload: IReligionPayload
) => {
  return prisma.$transaction(async (tx) => {
    await tx.community.deleteMany();
    await tx.religion.deleteMany();

    for (const religion of payload.religions) {
      const createdReligion = await tx.religion.create({
        data: {
          name: religion.name,
          priority: religion.priority,
          active: religion.active,
        },
      });

      if (religion.communities.length > 0) {
        await tx.community.createMany({
          data: religion.communities.map((community) => ({
            religionId: createdReligion.id,
            name: community.name,
            priority: community.priority,
            active: community.active,
          })),
        });
      }
    }

    return tx.religion.findMany({
      include: {
        communities: {
          orderBy: {
            priority: "asc",
          },
        },
      },
      orderBy: {
        priority: "asc",
      },
    });
  });
};

/**
 * Update Religion
 */
export const updateReligionData = async (
  id: number,
  payload: IReligion
) => {
  return prisma.$transaction(async (tx) => {
    await tx.religion.update({
      where: {
        id,
      },
      data: {
        name: payload.name,
        priority: payload.priority,
        active: payload.active,
      },
    });

    await tx.community.deleteMany({
      where: {
        religionId: id,
      },
    });

    if (payload.communities.length > 0) {
      await tx.community.createMany({
        data: payload.communities.map((community) => ({
          religionId: id,
          name: community.name,
          priority: community.priority,
          active: community.active,
        })),
      });
    }

    return tx.religion.findUnique({
      where: {
        id,
      },
      include: {
        communities: {
          orderBy: {
            priority: "asc",
          },
        },
      },
    });
  });
};

/**
 * Get All Religion
 */
export const getAllReligionData = async () => {
  return prisma.religion.findMany({
    include: {
      communities: {
        orderBy: {
          priority: "asc",
        },
      },
    },
    orderBy: {
      priority: "asc",
    },
  });
};

/**
 * Get Single Religion
 */
export const getReligionById = async (id: number) => {
  return prisma.religion.findUnique({
    where: {
      id,
    },
    include: {
      communities: {
        orderBy: {
          priority: "asc",
        },
      },
    },
  });
};

/**
 * Delete Religion
 */
export const removeReligionData = async (id: number) => {
  return prisma.$transaction(async (tx) => {
    await tx.community.deleteMany({
      where: {
        religionId: id,
      },
    });

    return tx.religion.delete({
      where: {
        id,
      },
    });
  });
};