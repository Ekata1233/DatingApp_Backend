// import { z } from "zod";
// import { PackageType } from "@prisma/client";

// export const createPackageSchema = z.object({
//   name: z.nativeEnum(PackageType),
//   title: z.string(),
//   description: z.string().optional(),

//   plans: z.array(
//     z.object({
//       durationMonths: z.number(),
//       originalPrice: z.number(),
//       discountedPrice: z.number().optional(),
//       discountPercent: z.number().optional(),
//       isPopular: z.boolean().optional(),
//       isBestValue: z.boolean().optional(),
//     })
//   ),

//   features: z.array(
//     z.object({
//       key: z.string(),
//       label: z.string(),
//       isHighlighted: z.boolean().optional(),
//     })
//   ),
// });

// export type CreatePackageInput = z.infer<typeof createPackageSchema>;


import { z } from "zod";
import { PackageType, BillingCycle, ResetPeriod } from "@prisma/client";

const billingCycleSchema = z.nativeEnum(BillingCycle);
const resetPeriodSchema = z.nativeEnum(ResetPeriod);
const packageTypeSchema = z.nativeEnum(PackageType);

const priceInputSchema = z.object({
  billingCycle: billingCycleSchema,
  months: z.number().int().positive().optional(),
  price: z.number().positive("Price must be greater than 0"),
  originalPrice: z.number().positive().optional(),
  discountPercent: z.number().int().min(0).max(100).optional(),
  isHighlighted: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
});

const planLimitInputSchema = z.object({
  featureCode: z.string().min(1, "Feature code is required"),
  enabled: z.boolean(),
  unlimited: z.boolean(),
  limit: z.number().int().positive().nullable().optional(),
  resetPeriod: resetPeriodSchema,
}).refine(
  (data) => {
    if (data.unlimited && data.limit !== null && data.limit !== undefined) {
      return false;
    }
    if (!data.unlimited && (!data.limit || data.limit <= 0)) {
      return false;
    }
    if (data.unlimited && data.resetPeriod !== "NONE") {
      return false;
    }
    return true;
  },
  {
    message: "Unlimited features must have null limit and NONE reset period. Limited features require a positive limit.",
  }
);

export const createPackageSchema = z.object({
  name: packageTypeSchema,
  slug: z.string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  tagline: z.string().optional(),
  badgeLabel: z.string().optional(),
  discoveryPool: z.string().optional(),
  visibilityRule: z.string().optional(),
  description: z.string().optional(),
  isPopular: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).optional().default(0),
  prices: z.array(priceInputSchema)
    .min(1, "At least one price is required")
    .refine(
      (prices) => {
        const cycles = prices.map(p => p.billingCycle);
        return new Set(cycles).size === cycles.length;
      },
      { message: "Duplicate billing cycles are not allowed" }
    ),
  limits: z.array(planLimitInputSchema)
    .refine(
      (limits) => {
        const codes = limits.map(l => l.featureCode);
        return new Set(codes).size === codes.length;
      },
      { message: "Duplicate feature codes are not allowed" }
    ),
});

export type CreatePackageInput = z.infer<typeof createPackageSchema>;