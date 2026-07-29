

import { prisma } from "../../../prisma/prismaClient";
import { PackageRepository } from "./package.repository";
import { CreatePackageInput, UpdatePackageInput } from "./package.validation";

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



export const updatePackageService = async (
  input: UpdatePackageInput
) => {
  console.time("Total Update Package API");

  console.time("findPackageById");
  const existing = await packageRepository.findPackageById(input.id);
  console.timeEnd("findPackageById");

  if (!existing) {
    throw new Error("Package not found");
  }

  // slug validation
  if (input.slug) {
    console.time("findPackageBySlug");

    const slug = await packageRepository.findPackageBySlug(input.slug);

    console.timeEnd("findPackageBySlug");

    if (slug && slug.id !== input.id) {
      throw new Error("Slug already exists");
    }
  }

  let featureMap = new Map<string, string>();

  if (input.limits?.length) {
    const codes = input.limits.map((x) => x.featureCode);

    console.time("findFeaturesByCodes");

    const features = await packageRepository.findFeaturesByCodes(codes);

    console.timeEnd("findFeaturesByCodes");

    const found = new Set(features.map((x) => x.code));

    const invalid = codes.filter((x) => !found.has(x));

    if (invalid.length) {
      throw new Error(`Invalid feature codes : ${invalid.join(",")}`);
    }

    features.forEach((f) => {
      featureMap.set(f.code, f.id);
    });
  }

  const prices =
    input.prices?.map((p) => ({
      ...p,
      months: p.months ?? getDefaultMonths(p.billingCycle),
    })) ?? [];

  const limits =
    input.limits?.map((l) => ({
      ...l,
      limit: l.unlimited ? null : l.limit,
    })) ?? [];

  console.time("updatePackage");

  const result = await packageRepository.updatePackage(
    input.id,
    input,
    prices,
    limits,
    featureMap
  );

  console.timeEnd("updatePackage");
  console.timeEnd("Total Update Package API");

  return result;
};




export const getAllPackagesService = async () => {
  return packageRepository.findAllPackages();
};

export const getPackageByIdService = async (id: string) => {
  const pkg = await packageRepository.findPackageDetailsById(id);

  if (!pkg) {
    throw new Error("Package not found");
  }

  return pkg;
};

export const getPackageBySlugService = async (slug: string) => {
  const pkg = await packageRepository.findPackageDetailsBySlug(slug);

  if (!pkg) {
    throw new Error("Package not found");
  }

  return pkg;
};

export const getPackageCardsService = async () => {
  const packages = await packageRepository.findPackageCards();

  return packages.map((pkg) => {
    const categoryCount: Record<string, number> = {};

    pkg.limits.forEach((item) => {
      const category = item.feature.category;

      categoryCount[category] =
        (categoryCount[category] || 0) + 1;
    });

    const totalFeatures = pkg.limits.length;
    const totalCategories = Object.keys(categoryCount).length;

    return {
      id: pkg.id,
      name: pkg.name,
      badgeLabel: pkg.badgeLabel,
      discoveryPool: pkg.discoveryPool,
      active: pkg.active,

      price:
        pkg.prices[0]?.price != null
          ? Number(pkg.prices[0].price)
          : null,

      originalPrice:
        pkg.prices[0]?.originalPrice != null
          ? Number(pkg.prices[0].originalPrice)
          : null,

      features: pkg.limits.map((limit) => ({
        title: limit.feature.title,
        description: limit.feature.description,
      })),

      categoryCount,

      featureSummary: `${totalFeatures} features across ${totalCategories} categories`,
    };
  });
};