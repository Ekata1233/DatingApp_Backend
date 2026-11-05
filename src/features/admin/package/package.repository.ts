import { Prisma, PrismaClient } from "@prisma/client";
import {
  CreatePackageDTO,
  UpdatePackageDTO,
  PriceInput,
  PlanLimitInput,
} from "./package.types";

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

 async findPackageById(id: string) {
  return this.prisma.package.findUnique({
    where: { id },
    select: {
      id: true,
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
      const uniqueCreateLimits = new Map<string, PlanLimitInput>();

  for (const item of limitsData) {
    const featureId = featureMap.get(item.featureCode);

    if (!featureId) {
      throw new Error(`Feature not found: ${item.featureCode}`);
    }

    uniqueCreateLimits.set(featureId, item);
  }
      return tx.package.create({
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
  create: Array.from(uniqueCreateLimits.values()).map(
    (limit) => ({
      featureId: featureMap.get(limit.featureCode)!,
      enabled: limit.enabled,
      unlimited: limit.unlimited,
      limit: limit.unlimited
        ? null
        : (limit.limit ?? null),
      resetPeriod: limit.resetPeriod,
    })
  ),
},

        },

        include: {
          prices: {
            where: {
              active: true,
            },
            orderBy: {
              createdAt: "asc",
            },
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

async updatePackage(
  packageId: string,
  data: UpdatePackageDTO,
  priceData: PriceInput[],
  limitsData: PlanLimitInput[],
  featureMap: Map<string, string>
) {
  return this.prisma.$transaction(async (tx) => {
    const updateData: Prisma.PackageUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.tagline !== undefined) updateData.tagline = data.tagline;
    if (data.badgeLabel !== undefined)
      updateData.badgeLabel = data.badgeLabel;
    if (data.discoveryPool !== undefined)
      updateData.discoveryPool = data.discoveryPool;
    if (data.visibilityRule !== undefined)
      updateData.visibilityRule = data.visibilityRule;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.isPopular !== undefined)
      updateData.isPopular = data.isPopular;
    if (data.active !== undefined)
      updateData.active = data.active;
    if (data.sortOrder !== undefined)
      updateData.sortOrder = data.sortOrder;

    console.time("package.update");

    await tx.package.update({
      where: {
        id: packageId,
      },
      data: updateData,
    });

    console.timeEnd("package.update");

    // ==========================
    // Update Prices
    // ==========================

    console.time("price.upsert");

    if (priceData.length > 0) {
      await Promise.all(
        priceData.map((price) =>
          tx.packagePrice.upsert({
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
          })
        )
      );
    }

    console.timeEnd("price.upsert");

    // ==========================
    // Update Limits
    // ==========================

 
console.time("limit.upsert");

if (limitsData.length > 0) {
  const uniqueLimits = new Map<
    string,
    Prisma.PlanLimitCreateManyInput
  >();

  for (const item of limitsData) {
    const featureId = featureMap.get(item.featureCode);

    if (!featureId) {
      throw new Error(
        `Feature not found: ${item.featureCode}`
      );
    }

    uniqueLimits.set(featureId, {
      packageId,
      featureId,
      enabled: item.enabled,
      unlimited: item.unlimited,
      limit: item.unlimited
        ? null
        : (item.limit ?? null),
      resetPeriod: item.resetPeriod,
    });
  }

  // Delete old package limits
  await tx.planLimit.deleteMany({
    where: {
      packageId,
    },
  });

  await tx.planLimit.createMany({
    data: Array.from(uniqueLimits.values()),
  });
}

console.timeEnd("limit.upsert");


    // ==========================
    // Final Response
    // ==========================

   console.time("package.findUnique");

const result = await tx.package.findUnique({
  where: {
    id: packageId,
  },
  include: {
    prices: {
      orderBy: {
        createdAt: "asc",
      },
    },
   


limits: {
  orderBy: [
    {
      feature: {
        category: "asc",
      },
    },
    {
      feature: {
        sortOrder: "asc",
      },
    },
    {
      featureId: "asc",
    },
  ],
  include: {
    feature: {
      select: {
        id: true,
        code: true,
        slug: true,
        title: true,
        category: true,
        description: true,
        sortOrder: true,
      },
    },
  },
},



  },
});
console.timeEnd("package.findUnique");

return result;
  });
}

async findAllPackages() {
  return this.prisma.package.findMany({
    orderBy: {
      sortOrder: "asc",
    },
    include: {
      prices: {
        orderBy: {
          createdAt: "asc",
        },
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
}

async findPackageDetailsById(id: string) {
  return this.prisma.package.findUnique({
    where: { id },
    include: {
      prices: {
        orderBy: {
          createdAt: "asc",
        },
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
}

async findPackageDetailsBySlug(slug: string) {
  return this.prisma.package.findUnique({
    where: { slug },
    include: {
      prices: {
        orderBy: {
          createdAt: "asc",
        },
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
}

async findPackageCards() {
  return this.prisma.package.findMany({
    orderBy: {
      sortOrder: "asc",
    },
    select: {
      id: true,
      name: true,
      slug:true,
      badgeLabel: true,
      discoveryPool: true,
      active: true,

      prices: {
        where: {
          billingCycle: "MONTHLY",
          active: true,
        },
        select: {
          price: true,
          originalPrice: true,
        },
        take: 1,
      },

      limits: {
        where: {
          enabled: true,
          
        },

        select: {
           limit: true,
           resetPeriod: true,
          feature: {
            select: {
              title: true,
              description: true,
              
              category: true,
            },
          },
        },
      },
    },
  });
}
}

