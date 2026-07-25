// import { PackageType } from "@prisma/client";
// import { prisma } from "../../../prisma/prismaClient";
// import { CreatePackageInput } from "./package.validation";

// export const createPackageService = async (
//   data: CreatePackageInput
// ) => {
//   const { plans, features, ...packageData } = data;

//   // enum validation
//   if (
//     !Object.values(PackageType).includes(
//       packageData.name as PackageType
//     )
//   ) {
//     throw new Error("Invalid package type");
//   }

//   const packageName = packageData.name as PackageType;

//   // check existing package
//   const existingPackage = await prisma.package.findFirst({
//     where: {
//       name: packageName,
//     },
//     include: {
//       plans: true,
//       features: true,
//     },
//   });

//   // ---------------- UPDATE FLOW ----------------
//   if (existingPackage) {
//     // delete old plans
//     await prisma.packagePrice.deleteMany({
//       where: {
//         packageId: existingPackage.id,
//       },
//     });

//     // delete old features
//     await prisma.packageFeature.deleteMany({
//       where: {
//         packageId: existingPackage.id,
//       },
//     });

//     const updatedPackage = await prisma.package.update({
//       where: {
//         id: existingPackage.id,
//       },
//       data: {
//         title: packageData.title,
//         description: packageData.description,

//         plans: {
//           create: plans.map((plan) => ({
//             durationMonths: plan.durationMonths,
//             originalPrice: plan.originalPrice,
//             discountedPrice: plan.discountedPrice,
//             discountPercent: plan.discountPercent,
//             isPopular: plan.isPopular ?? false,
//             isBestValue: plan.isBestValue ?? false,
//           })),
//         },

//         features: {
//           create: features.map((feature) => ({
//             key: feature.key,
//             label: feature.label,
//             isHighlighted:
//               feature.isHighlighted ?? false,
//           })),
//         },
//       },
//       include: {
//         plans: true,
//         features: true,
//       },
//     });

//     return updatedPackage;
//   }

//   // ---------------- CREATE FLOW ----------------
//   const createdPackage = await prisma.package.create({
//     data: {
//       name: packageName,
//       title: packageData.title,
//       description: packageData.description,

//       plans: {
//         create: plans.map((plan) => ({
//           durationMonths: plan.durationMonths,
//           originalPrice: plan.originalPrice,
//           discountedPrice: plan.discountedPrice,
//           discountPercent: plan.discountPercent,
//           isPopular: plan.isPopular ?? false,
//           isBestValue: plan.isBestValue ?? false,
//         })),
//       },

//       features: {
//         create: features.map((feature) => ({
//           key: feature.key,
//           label: feature.label,
//           isHighlighted:
//             feature.isHighlighted ?? false,
//         })),
//       },
//     },
//     include: {
//       plans: true,
//       features: true,
//     },
//   });

//   return createdPackage;
// };

import { prisma } from "../../../prisma/prismaClient";
import { PackageRepository } from "./package.repository";
import { CreatePackageInput } from "./package.validation";

const packageRepository = new PackageRepository(prisma);

export const createOrUpdatePackageService = async (input: CreatePackageInput) => {
  const existingPackageByName = await packageRepository.findPackageByName(input.name);
  
  if (!existingPackageByName && input.slug) {
    const existingPackageBySlug = await packageRepository.findPackageBySlug(input.slug);
    if (existingPackageBySlug) {
      throw new Error("A package with this slug already exists");
    }
  }

  if (existingPackageByName && input.slug !== existingPackageByName.slug) {
    const slugConflict = await packageRepository.findPackageBySlug(input.slug);
    if (slugConflict) {
      throw new Error("A package with this slug already exists");
    }
  }

  const featureCodes = input.limits.map((limit) => limit.featureCode);
  const features = await packageRepository.findFeaturesByCodes(featureCodes);

  const foundFeatureCodes = new Set(features.map((f) => f.code));
  const invalidCodes = featureCodes.filter((code) => !foundFeatureCodes.has(code));

  if (invalidCodes.length > 0) {
    throw new Error(`Invalid feature codes: ${invalidCodes.join(", ")}`);
  }

  const featureMap = new Map<string, string>();
  features.forEach((feature) => {
    featureMap.set(feature.code, feature.id);
  });

  const priceData = input.prices.map((price) => ({
    ...price,
    months: price.months ?? getDefaultMonths(price.billingCycle),
  }));

  const limitsData = input.limits.map((limit) => ({
    ...limit,
    limit: limit.unlimited ? null : limit.limit,
  }));

  if (existingPackageByName) {
    const updatedPackage = await packageRepository.updatePackage(
      existingPackageByName.id,
      input,
      priceData,
      limitsData,
      featureMap
    );
    return updatedPackage;
  }

  const newPackage = await packageRepository.createPackage(
    input,
    priceData,
    limitsData,
    featureMap
  );
  return newPackage;
};

function getDefaultMonths(billingCycle: string): number {
  switch (billingCycle) {
    case "MONTHLY":
      return 1;
    case "QUARTERLY":
      return 3;
    case "HALF_YEARLY":
      return 6;
    case "YEARLY":
      return 12;
    case "LIFETIME":
      return 0;
    default:
      return 1;
  }
}