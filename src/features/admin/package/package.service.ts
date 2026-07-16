import { PackageType } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";
import { CreatePackageInput } from "./package.validation";

export const createPackageService = async (
  data: CreatePackageInput
) => {
  const { plans, features, ...packageData } = data;

  // enum validation
  if (
    !Object.values(PackageType).includes(
      packageData.name as PackageType
    )
  ) {
    throw new Error("Invalid package type");
  }

  const packageName = packageData.name as PackageType;

  // check existing package
  const existingPackage = await prisma.package.findFirst({
    where: {
      name: packageName,
    },
    include: {
      plans: true,
      features: true,
    },
  });

  // ---------------- UPDATE FLOW ----------------
  if (existingPackage) {
    // delete old plans
    await prisma.packagePlan.deleteMany({
      where: {
        packageId: existingPackage.id,
      },
    });

    // delete old features
    await prisma.packageFeature.deleteMany({
      where: {
        packageId: existingPackage.id,
      },
    });

    const updatedPackage = await prisma.package.update({
      where: {
        id: existingPackage.id,
      },
      data: {
        title: packageData.title,
        description: packageData.description,

        plans: {
          create: plans.map((plan) => ({
            durationMonths: plan.durationMonths,
            originalPrice: plan.originalPrice,
            discountedPrice: plan.discountedPrice,
            discountPercent: plan.discountPercent,
            isPopular: plan.isPopular ?? false,
            isBestValue: plan.isBestValue ?? false,
          })),
        },

        features: {
          create: features.map((feature) => ({
            key: feature.key,
            label: feature.label,
            isHighlighted:
              feature.isHighlighted ?? false,
          })),
        },
      },
      include: {
        plans: true,
        features: true,
      },
    });

    return updatedPackage;
  }

  // ---------------- CREATE FLOW ----------------
  const createdPackage = await prisma.package.create({
    data: {
      name: packageName,
      title: packageData.title,
      description: packageData.description,

      plans: {
        create: plans.map((plan) => ({
          durationMonths: plan.durationMonths,
          originalPrice: plan.originalPrice,
          discountedPrice: plan.discountedPrice,
          discountPercent: plan.discountPercent,
          isPopular: plan.isPopular ?? false,
          isBestValue: plan.isBestValue ?? false,
        })),
      },

      features: {
        create: features.map((feature) => ({
          key: feature.key,
          label: feature.label,
          isHighlighted:
            feature.isHighlighted ?? false,
        })),
      },
    },
    include: {
      plans: true,
      features: true,
    },
  });

  return createdPackage;
};
