import { prisma } from "../../../../prisma/prismaClient";
import { IIntention } from "./intention.types";

export const createIntention = async (
  payload: IIntention
) => {
  // Check if a record already exists
  const existing = await prisma.intention.findFirst();

  // If exists -> update
  if (existing) {
    return prisma.intention.update({
      where: {
        id: existing.id,
      },
      data: payload,
    });
  }

  // Else create new
  return prisma.intention.create({
    data: payload,
  });
};

export const getAllIntentions = async () => {
  return prisma.intention.findMany({
    orderBy: {
      sortOrder: "asc",
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