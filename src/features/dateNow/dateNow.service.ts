// Date Now Service
import { prisma } from "../../prisma/prismaClient";
import { PlanStatus } from "@prisma/client";
import { UpdateDatePlanInput } from "./dateNow.types";

export const createDraftDatePlan = async (
  userId: string,
  activityId: string
) => {

    const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  
  if (!user) {
    throw new Error("User not found");
  }

  const activity = await prisma.datePlanOption.findUnique({
    where: { id: activityId },
  });

  if (!activity) {
    throw new Error("Activity not found");
  }
  const draftPlan = await prisma.datePlan.create({
    data: {
      userId,
      activityId,
      status: PlanStatus.DRAFT,
    },
  });

  return draftPlan;
};

export const updateDraftDatePlan = async (
  planId: string,
  userId: string,
  payload: UpdateDatePlanInput
) => {
  const plan = await prisma.datePlan.findFirst({
    where: {
      id: planId,
      userId,
    },
  });

  if (!plan) {
    throw new Error("Plan not found");
  }

  const { vibeIds, ...planData } = payload;

  const updatedPlan = await prisma.$transaction(async (tx) => {
    await tx.datePlan.update({
      where: {
        id: planId,
      },
      data: planData,
    });

    if (vibeIds) {
      await tx.datePlanVibe.deleteMany({
        where: {
          planId,
        },
      });

      await tx.datePlanVibe.createMany({
        data: vibeIds.map((vibeId) => ({
          planId,
          vibeId,
        })),
      });
    }

    return tx.datePlan.findUnique({
      where: {
        id: planId,
      },
      include: {
        vibes: true,
      },
    });
  });

  return updatedPlan;
};

export const publishDatePlan = async (
  planId: string,
  userId: string
) => {
  const plan = await prisma.datePlan.findFirst({
    where: {
      id: planId,
      userId,
    },
    include: {
      vibes: true,
    },
  });

  if (!plan) {
    throw new Error("Plan not found");
  }

  if (!plan.activityId) {
    throw new Error("Activity is required");
  }

  if (!plan.whenId) {
    throw new Error("When is required");
  }

  if (!plan.timeId) {
    throw new Error("Time is required");
  }

  if (!plan.durationId) {
    throw new Error("Duration is required");
  }

  if (!plan.visibilityId) {
    throw new Error("Visibility is required");
  }

  await prisma.datePlan.update({
    where: {
      id: planId,
    },
    data: {
      status: PlanStatus.ACTIVE,
    },
  });

  return {
    success: true,
  };
};