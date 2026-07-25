import { Package, PackagePrice, PlanLimit, PackageFeature } from "@prisma/client";

export interface PackageWithRelations extends Package {
  prices: PackagePrice[];
  limits: (PlanLimit & {
    feature: Pick<PackageFeature, "id" | "code" | "title" | "category" | "description">;
  })[];
}

export function formatPackageResponse(pkg: PackageWithRelations) {
  return {
    id: pkg.id,
    name: pkg.name,
    slug: pkg.slug,
    tagline: pkg.tagline,
    badgeLabel: pkg.badgeLabel,
    discoveryPool: pkg.discoveryPool,
    visibilityRule: pkg.visibilityRule,
    description: pkg.description,
    isPopular: pkg.isPopular,
    active: pkg.active,
    sortOrder: pkg.sortOrder,
    prices: pkg.prices.map((price) => ({
      id: price.id,
      billingCycle: price.billingCycle,
      months: price.months,
      price: Number(price.price),
      originalPrice: price.originalPrice ? Number(price.originalPrice) : null,
      discountPercent: price.discountPercent,
      isHighlighted: price.isHighlighted,
      active: price.active,
    })),
    limits: pkg.limits.map((limit) => ({
      id: limit.id,
      featureId: limit.featureId,
      feature: {
        id: limit.feature.id,
        code: limit.feature.code,
        title: limit.feature.title,
        category: limit.feature.category,
        description: limit.feature.description,
      },
      enabled: limit.enabled,
      unlimited: limit.unlimited,
      limit: limit.limit,
      resetPeriod: limit.resetPeriod,
    })),
    createdAt: pkg.createdAt,
    updatedAt: pkg.updatedAt,
  };
}