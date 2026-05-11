import {
  findPackageById,
  findPlanById,
  findUserSubscription,
  expirePreviousSubscription,
  createSubscription,
  updateSubscription
} from "./package.repository";

export const activatePackageService = async (
  userId: string,
  packageId: string,
  planId: string
) => {
  const packageData = await findPackageById(packageId);

  if (!packageData) {
    throw new Error("Package not found");
  }

  const planData = await findPlanById(planId);

  if (!planData) {
    throw new Error("Plan not found");
  }

  const startDate = new Date();

  const endDate = new Date();
  endDate.setMonth(
    endDate.getMonth() + planData.durationMonths
  );

  const existingSubscription =
    await findUserSubscription(userId);

  if (existingSubscription) {
    return updateSubscription(userId, {
      packageId,
      planId,
      startDate,
      endDate,
      status: "ACTIVE"
    });
  }

  return createSubscription({
    user_id: userId,
    packageId,
    planId,
    startDate,
    endDate,
    status: "ACTIVE"
  });
};
