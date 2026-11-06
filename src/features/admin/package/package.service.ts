
import { FeatureCategory } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";
import { PackageRepository } from "./package.repository";
import {
  CreatePackageInput,
  UpdatePackageInput,
} from "./package.validation";

const packageRepository = new PackageRepository(prisma);

/* =====================================================
   CREATE OR UPDATE PACKAGE
===================================================== */

export const createOrUpdatePackageService = async (
  input: CreatePackageInput
) => {
  const existingPackageByName =
    await packageRepository.findPackageByName(input.name);

  if (!existingPackageByName && input.slug) {
    const existingPackageBySlug =
      await packageRepository.findPackageBySlug(input.slug);

    if (existingPackageBySlug) {
      throw new Error("A package with this slug already exists");
    }
  }

  if (
    existingPackageByName &&
    input.slug !== existingPackageByName.slug
  ) {
    const slugConflict =
      await packageRepository.findPackageBySlug(input.slug);

    if (slugConflict) {
      throw new Error("A package with this slug already exists");
    }
  }

  /* =====================================================
     FEATURE LOOKUP
     INVALID FEATURE CODE VALIDATION REMOVED
  ===================================================== */

  const featureCodes = (input.limits ?? []).map(
    (limit) => limit.featureCode
  );

  const features =
    await packageRepository.findFeaturesByCodes(featureCodes);

  const featureMap = new Map<string, string>();

  features.forEach((feature) => {
    featureMap.set(feature.code, feature.id);
  });

  /* =====================================================
     PRICE DATA
  ===================================================== */

  const priceData = input.prices.map((price) => ({
    ...price,
    months:
      price.months ?? getDefaultMonths(price.billingCycle),
  }));

  /* =====================================================
     LIMIT DATA
  ===================================================== */

  const limitsData = (input.limits ?? []).map((limit) => ({
    ...limit,
    limit: limit.unlimited ? null : limit.limit,
  }));

  /* =====================================================
     UPDATE EXISTING PACKAGE
  ===================================================== */

  if (existingPackageByName) {
    const updatedPackage =
      await packageRepository.updatePackage(
        existingPackageByName.id,
        input,
        priceData,
        limitsData,
        featureMap
      );

    return updatedPackage;
  }

  /* =====================================================
     CREATE NEW PACKAGE
  ===================================================== */

  const newPackage =
    await packageRepository.createPackage(
      input,
      priceData,
      limitsData,
      featureMap
    );

  return newPackage;
};

/* =====================================================
   GET DEFAULT MONTHS
===================================================== */

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

/* =====================================================
   UPDATE PACKAGE
===================================================== */

export const updatePackageService = async (
  input: UpdatePackageInput
) => {
  console.time("Total Update Package API");

  console.time("findPackageById");

  const existing =
    await packageRepository.findPackageById(input.id);

  console.timeEnd("findPackageById");

  if (!existing) {
    throw new Error("Package not found");
  }

  /* =====================================================
     SLUG VALIDATION - UNCHANGED
  ===================================================== */

  if (input.slug) {
    console.time("findPackageBySlug");

    const slug =
      await packageRepository.findPackageBySlug(input.slug);

    console.timeEnd("findPackageBySlug");

    if (slug && slug.id !== input.id) {
      throw new Error("Slug already exists");
    }
  }

  /* =====================================================
     FEATURE LOOKUP
     INVALID FEATURE CODE VALIDATION REMOVED
  ===================================================== */

  const featureMap = new Map<string, string>();

  if (input.limits?.length) {
    const codes = input.limits.map(
      (x) => x.featureCode
    );

    console.time("findFeaturesByCodes");

    const features =
      await packageRepository.findFeaturesByCodes(codes);

    console.timeEnd("findFeaturesByCodes");

    features.forEach((feature) => {
      featureMap.set(feature.code, feature.id);
    });
  }

  /* =====================================================
     PRICE DATA
  ===================================================== */

  const prices =
    input.prices?.map((p) => ({
      ...p,
      months:
        p.months ?? getDefaultMonths(p.billingCycle),
    })) ?? [];

  /* =====================================================
     LIMIT DATA
  ===================================================== */

  const limits =
    input.limits?.map((l) => ({
      ...l,
      limit: l.unlimited ? null : l.limit,
    })) ?? [];

  /* =====================================================
     UPDATE PACKAGE IN REPOSITORY
  ===================================================== */

  console.time("updatePackage");

  const result =
    await packageRepository.updatePackage(
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

/* =====================================================
   GET ALL PACKAGES
===================================================== */

export const getAllPackagesService = async () => {
  return packageRepository.findAllPackages();
};

/* =====================================================
   GET PACKAGE BY ID
===================================================== */

export const getPackageByIdService = async (
  id: string
) => {
  const pkg =
    await packageRepository.findPackageDetailsById(id);

  if (!pkg) {
    throw new Error("Package not found");
  }

  const features = await prisma.packageFeature.findMany({
    where: {
      category: "STATUS_BADGES",
      slug: "premium",
      active: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  console.log("STATUS BADGES:", features);

  return pkg;
};

/* =====================================================
   GET PACKAGE BY SLUG
===================================================== */

export const getPackageBySlugService = async (
  slug: string
) => {
  const pkg =
    await packageRepository.findPackageDetailsBySlug(slug);

  if (!pkg) {
    throw new Error("Package not found");
  }

  return pkg;
};

/* =====================================================
   GET PACKAGE CARDS
===================================================== */

export const getPackageCardsService = async () => {
  const packages =
    await packageRepository.findPackageCards();

  return packages.map((pkg) => {
    const categoryCount: Record<string, number> = {};

    pkg.limits.forEach((item) => {
      const category = item.feature.category;

      categoryCount[category] =
        (categoryCount[category] || 0) + 1;
    });

    const totalFeatures = pkg.limits.length;

    const totalCategories =
      Object.keys(categoryCount).length;

    return {
      id: pkg.id,
      name: pkg.name,
      slug: pkg.slug,
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
        limit: limit.limit,
        resetPeriod: limit.resetPeriod,
      })),

      categoryCount,

      featureSummary: `${totalFeatures} features across ${totalCategories} categories`,
    };
  });
};

/* =====================================================
   PACKAGE FEATURE DTO
===================================================== */

interface PackageFeatureDTO {
  category: FeatureCategory;
  code: string;
  slug: string;
  title: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  active?: boolean;
}

/* =====================================================
   CREATE PACKAGE FEATURE
===================================================== */

export const createPackageFeatureService = async (
  data: PackageFeatureDTO
) => {
  return await prisma.packageFeature.create({
    data: {
      category: data.category,
      code: data.code,
      slug: data.slug,
      title: data.title,
      description: data.description,
      icon: data.icon,
      sortOrder: data.sortOrder ?? 0,
      active: data.active ?? true,
    },
  });
};

/* =====================================================
   GET PACKAGE FEATURES BY SLUG
===================================================== */

export const getPackageFeaturesBySlugService = async (
  slug: string
) => {
  return await prisma.packageFeature.findMany({
    where: {
      slug,
    },
    orderBy: [
      {
        category: "asc",
      },
      {
        sortOrder: "asc",
      },
    ],
  });
};
