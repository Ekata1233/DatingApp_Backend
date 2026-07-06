import { prisma } from "../../../../prisma/prismaClient";
import { ISalaryRange } from "./salaryRange.types";

/**
 * Create Salary Range
 */
export const createSalaryRange = async (
  payload: ISalaryRange
) => {
  return prisma.salaryRange.create({
    data: {
      title: payload.title,
      minSalary: payload.minSalary,
      maxSalary: payload.maxSalary,
      isActive: payload.isActive,
    },
  });
};

/**
 * Update Salary Range
 */
export const updateSalaryRange = async (
  id: number,
  payload: ISalaryRange
) => {
  return prisma.salaryRange.update({
    where: {
      id,
    },
    data: {
      title: payload.title,
      minSalary: payload.minSalary,
      maxSalary: payload.maxSalary,
      isActive: payload.isActive,
    },
  });
};

/**
 * Get All Salary Ranges (Admin)
 */
export const getAllSalaryRange = async () => {
  return prisma.salaryRange.findMany({
    orderBy: {
      id: "asc",
    },
  });
};

/**
 * Get Active Salary Ranges (Onboarding)
 */
export const getActiveSalaryRange = async () => {
  return prisma.salaryRange.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      id: "asc",
    },
  });
};

/**
 * Get Single Salary Range
 */
export const getSalaryRangeById = async (
  id: number
) => {
  return prisma.salaryRange.findUnique({
    where: {
      id,
    },
  });
};

/**
 * Delete Salary Range
 */
export const removeSalaryRange = async (
  id: number
) => {
  return prisma.salaryRange.delete({
    where: {
      id,
    },
  });
};