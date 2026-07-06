import { prisma } from "../../../../prisma/prismaClient"
import { IExperiencePayload } from "./experience.types"

export const createExperience = async (payload: IExperiencePayload) => {
  return prisma.experience.create({
    data: {
      title: payload.title,
      sortOrder: payload.sortOrder ?? null,
      isActive: payload.isActive ?? true,
    },
  })
}

export const getAllExperience = async () => {
  return prisma.experience.findMany({
    orderBy: { sortOrder: "asc" },
  })
}

export const updateExperience = async (
  id: number,
  payload: IExperiencePayload
) => {
  return prisma.experience.update({
    where: { id },
    data: {
      title: payload.title,
      sortOrder: payload.sortOrder,
      isActive: payload.isActive,
    },
  })
}

export const deleteExperience = async (id: number) => {
  return prisma.experience.delete({
    where: { id },
  })
}

export const getActiveExperience = async () => {
  return prisma.experience.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  })
}