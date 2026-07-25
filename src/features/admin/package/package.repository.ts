import { Prisma, PrismaClient } from "@prisma/client";
import { CreatePackageDTO, PriceInput, PlanLimitInput } from "./package.types";

export class PackageRepository {
  constructor(private prisma: PrismaClient) {}

  async findPackageByName(name: string) {
    return this.prisma.package.findUnique({
      where: { name: name as any },
    });
  }

  async findPackageBySlug(slug: string) {
    return this.prisma.package.findUnique({
      where: { slug },
    });
  }

  async findFeaturesByCodes(codes: string[]) {
    return this.prisma.packageFeature.findMany({
      where: {
        code: { in: codes },
        active: true,
      },
    });
  }

  async createPackage(
    data: CreatePackageDTO,
    priceData: PriceInput[],
    limitsData: PlanLimitInput[],
    featureMap: Map<string, string>
  ) {
    return this.prisma.$transaction(async (tx) => {
      const pkg = await tx.package.create({
        data: {
          name: data.name,
          slug: data.slug,
          tagline: data.tagline,
          badgeLabel: data.badgeLabel,
          discoveryPool: data.discoveryPool,
          visibilityRule: data.visibilityRule,
          description: data.description,
          isPopular: data.isPopular ?? false,
          active: data.active ?? true,
          sortOrder: data.sortOrder ?? 0,
          prices: {
            create: priceData.map((price) => ({
              billingCycle: price.billingCycle,
              months: price.months,
              price: price.price,
              originalPrice: price.originalPrice,
              discountPercent: price.discountPercent,
              isHighlighted: price.isHighlighted ?? false,
              active: price.active ?? true,
            })),
          },
          limits: {
            create: limitsData.map((limit) => ({
              featureId: featureMap.get(limit.featureCode)!,
              enabled: limit.enabled,
              unlimited: limit.unlimited,
              limit: limit.limit,
              resetPeriod: limit.resetPeriod,
            })),
          },
        },
        include: {
          prices: {
            where: { active: true },
            orderBy: { createdAt: "asc" },
          },
          limits: {
            include: {
              feature: {
                select: {
                  id: true,
                  code: true,
                  title: true,
                  category: true,
                  description: true,
                },
              },
            },
          },
        },
      });

      return pkg;
    });
  }

  async updatePackage(
    packageId: string,
    data: CreatePackageDTO,
    priceData: PriceInput[],
    limitsData: PlanLimitInput[],
    featureMap: Map<string, string>
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.package.update({
        where: { id: packageId },
        data: {
          slug: data.slug,
          tagline: data.tagline,
          badgeLabel: data.badgeLabel,
          discoveryPool: data.discoveryPool,
          visibilityRule: data.visibilityRule,
          description: data.description,
          isPopular: data.isPopular ?? false,
          active: data.active ?? true,
          sortOrder: data.sortOrder ?? 0,
        },
      });

      for (const price of priceData) {
        await tx.packagePrice.upsert({
          where: {
            packageId_billingCycle: {
              packageId,
              billingCycle: price.billingCycle,
            },
          },
          create: {
            packageId,
            billingCycle: price.billingCycle,
            months: price.months,
            price: price.price,
            originalPrice: price.originalPrice,
            discountPercent: price.discountPercent,
            isHighlighted: price.isHighlighted ?? false,
            active: price.active ?? true,
          },
          update: {
            months: price.months,
            price: price.price,
            originalPrice: price.originalPrice,
            discountPercent: price.discountPercent,
            isHighlighted: price.isHighlighted ?? false,
            active: price.active ?? true,
          },
        });
      }

      for (const limit of limitsData) {
        const featureId = featureMap.get(limit.featureCode)!;
        await tx.planLimit.upsert({
          where: {
            packageId_featureId: {
              packageId,
              featureId,
            },
          },
          create: {
            packageId,
            featureId,
            enabled: limit.enabled,
            unlimited: limit.unlimited,
            limit: limit.limit,
            resetPeriod: limit.resetPeriod,
          },
          update: {
            enabled: limit.enabled,
            unlimited: limit.unlimited,
            limit: limit.limit,
            resetPeriod: limit.resetPeriod,
          },
        });
      }

      return tx.package.findUnique({
        where: { id: packageId },
        include: {
          prices: {
            orderBy: { createdAt: "asc" },
          },
          limits: {
            include: {
              feature: {
                select: {
                  id: true,
                  code: true,
                  title: true,
                  category: true,
                  description: true,
                },
              },
            },
          },
        },
      });
    });
  }
}