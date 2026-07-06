import { prisma } from "../../../../prisma/prismaClient";
import { IAmbition } from "./ambition.types";

/**
 * Create Ambition
 */
export const createAmbition = async (
  payload: IAmbition
) => {
  return prisma.ambition.create({
    data: {
      title: payload.title,
      isActive: payload.isActive,
    },
  });
};

/**
 * Update Ambition
 */
export const updateAmbition = async (
  id: number,
  payload: IAmbition
) => {
  return prisma.ambition.update({
    where: {
      id,
    },
    data: {
      title: payload.title,
      isActive: payload.isActive,
    },
  });
};

/**
 * Get All Ambitions (Admin)
 */
export const getAllAmbition = async () => {
  return prisma.ambition.findMany({
    orderBy: {
      id: "asc",
    },
  });
};

/**
 * Get Active Ambitions (Onboarding)
 */
export const getActiveAmbition = async () => {
  return prisma.ambition.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      id: "asc",
    },
  });
};

/**
 * Get Single Ambition
 */
export const getAmbitionById = async (
  id: number
) => {
  return prisma.ambition.findUnique({
    where: {
      id,
    },
  });
};

/**
 * Delete Ambition
 */
export const removeAmbition = async (
  id: number
) => {
  return prisma.ambition.delete({
    where: {
      id,
    },
  });
};