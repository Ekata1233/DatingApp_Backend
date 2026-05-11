import { prisma } from "../../prisma/prismaClient";

export const findPackageById = async (packageId: string) => {
  return prisma.package.findFirst({
    where: {
      id: packageId,
      isActive: true
    }
  });
};

export const findPlanById = async (planId: string) => {
  return prisma.packagePlan.findFirst({
    where: {
      id: planId,
      isActive: true
    }
  });
};

export const findUserSubscription = async (userId: string) => {
  return prisma.userSubscription.findUnique({
    where: {
      user_id: userId
    }
  });
};

export const expirePreviousSubscription = async (userId: string) => {
  return prisma.userSubscription.updateMany({
    where: {
      user_id: userId,
      status: "ACTIVE"
    },
    data: {
      status: "EXPIRED"
    }
  });
};

export const createSubscription = async (data: any) => {
  return prisma.userSubscription.create({
    data
  });
};

export const updateSubscription = async (
  userId: string,
  data: any
) => {
  return prisma.userSubscription.update({
    where: {
      user_id: userId
    },
    data
  });
};
