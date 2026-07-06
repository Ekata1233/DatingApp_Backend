import { prisma } from "../../../../prisma/prismaClient";
import { IEmploymentType } from "./employmentType.types";

/**
 * Create Employment Type
 */
export const createEmploymentType = async (
  payload: IEmploymentType
) => {
  return prisma.employmentType.create({
    data: {
      name: payload.name,
      isActive: payload.isActive,
    },
  });
};

/**
 * Update Employment Type
 */
export const updateEmploymentType = async (
  id: number,
  payload: IEmploymentType
) => {
  return prisma.employmentType.update({
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
 * Get All Employment Types
 */
export const getAllEmploymentType = async () => {
  return prisma.employmentType.findMany({
    orderBy: {
      id: "asc",
    },
  });
};

/**
 * Get Single Employment Type
 */
export const getEmploymentTypeById = async (
  id: number
) => {
  return prisma.employmentType.findUnique({
    where: {
      id,
    },
  });
};

/**
 * Delete Employment Type
 */
export const removeEmploymentType = async (
  id: number
) => {
  return prisma.employmentType.delete({
    where: {
      id,
    },
  });
};