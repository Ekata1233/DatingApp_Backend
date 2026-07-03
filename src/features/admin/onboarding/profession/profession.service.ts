import { prisma } from "../../../../prisma/prismaClient";
import { IProfession } from "./profession.types";

/**
 * Create Profession
 */
export const createProfession = async (payload: IProfession) => {
  return await prisma.profession.create({
    data: {
      name: payload.name,
      isActive: payload.isActive,
    },
  });
};

/**
 * Update Profession
 */
export const updateProfession = async (
  id: number,
  payload: IProfession
) => {
  return await prisma.profession.update({
    where: {
      id,
    },
    data: {
      name: payload.name,
      isActive: payload.isActive,
    },
  });
};

/**
 * Get All Profession
 */
export const getAllProfession = async () => {
  return await prisma.profession.findMany({
    orderBy: {
      id: "asc",
    },
  });
};

/**
 * Get Single Profession
 */
export const getProfessionById = async (id: number) => {
  return await prisma.profession.findUnique({
    where: {
      id,
    },
  });
};

/**
 * Delete Profession
 */
export const removeProfession = async (id: number) => {
  return await prisma.profession.delete({
    where: {
      id,
    },
  });
};