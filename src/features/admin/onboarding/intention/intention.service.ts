import { prisma } from "../../../../prisma/prismaClient";
import { IIntention } from "./intention.types";

export const createIntention = async (
  payload: IIntention
) => {

  const existing = await prisma.intention.findFirst({
    include: {
      options: true,
    },
  });

  // UPDATE
  if (existing) {
    return prisma.intention.update({
      where: {
        id: existing.id,
      },

      data: {
        title: payload.title,
        description: payload.description,
        sortOrder: payload.sortOrder,
        isActive: payload.isActive,

        options: {
          deleteMany: {},

          create: payload.options,
        },
      },

      include: {
        options: true,
      },
    });
  }

  // CREATE

  return prisma.intention.create({
    data: {
      title: payload.title,
      description: payload.description,
      sortOrder: payload.sortOrder,
      isActive: payload.isActive,

      options: {
        create: payload.options,
      },
    },

    include: {
      options: true,
    },
  });
};

export const getAllIntentions = async () => {
  return prisma.intention.findMany({
    include: {
      options: true,
    },
  });
};

export const deleteIntention = async () => {
  const existing = await prisma.intention.findFirst();

  if (!existing) return null;

  return prisma.intention.delete({
    where: {
      id: existing.id,
    },
  });
};