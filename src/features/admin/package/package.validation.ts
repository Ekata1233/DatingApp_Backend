
import { z } from "zod";

import {
  PackageType,
  BillingCycle,
  ResetPeriod,
  FeatureCategory,
} from "@prisma/client";

/* =====================================================
   ENUM SCHEMAS
===================================================== */

const billingCycleSchema = z.nativeEnum(BillingCycle);

const resetPeriodSchema = z.nativeEnum(ResetPeriod);

const packageTypeSchema = z.nativeEnum(PackageType);

/* =====================================================
   PRICE INPUT SCHEMA
===================================================== */

const priceInputSchema = z.object({
  billingCycle: billingCycleSchema,

  months: z.number().int().positive().optional(),

  price: z.number().positive("Price must be greater than 0"),

  originalPrice: z.number().positive().optional(),

  discountPercent: z.number().int().min(0).max(100).optional(),

  isHighlighted: z.boolean().optional().default(false),

  active: z.boolean().optional().default(true),
});

/* =====================================================
   PLAN LIMIT INPUT SCHEMA
   CUSTOM VALIDATION REMOVED
===================================================== */

const planLimitInputSchema = z.object({
  featureCode: z.string().min(1, "Feature code is required"),

  enabled: z.boolean(),

  unlimited: z.boolean(),

  limit: z.number().int().nullable().optional(),

  resetPeriod: resetPeriodSchema,
});

/* =====================================================
   CREATE PACKAGE SCHEMA
===================================================== */

export const createPackageSchema = z.object({
  name: packageTypeSchema,

  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),

  tagline: z.string().optional(),

  badgeLabel: z.string().optional(),

  discoveryPool: z.string().optional(),

  visibilityRule: z.string().optional(),

  description: z.string().optional(),

  isPopular: z.boolean().optional().default(false),

  active: z.boolean().optional().default(true),

  sortOrder: z.number().int().min(0).optional().default(0),

  /* -----------------------------
     PACKAGE PRICES
  ----------------------------- */

  prices: z
    .array(priceInputSchema)
    .min(1, "At least one price is required")
    .refine(
      (prices) => {
        const cycles = prices.map((p) => p.billingCycle);

        return new Set(cycles).size === cycles.length;
      },
      {
        message: "Duplicate billing cycles are not allowed",
      }
    ),

  /* -----------------------------
     PACKAGE FEATURE LIMITS
     CUSTOM VALIDATION REMOVED
  ----------------------------- */
limits: z.array(planLimitInputSchema).default([]),
});

/* =====================================================
   CREATE PACKAGE INPUT TYPE
===================================================== */

export type CreatePackageInput = z.infer<
  typeof createPackageSchema
>;

/* =====================================================
   UPDATE PACKAGE SCHEMA
===================================================== */

export const updatePackageSchema = createPackageSchema
  .partial()
  .extend({
    id: z.string().uuid("Invalid package id"),
  });

/* =====================================================
   UPDATE PACKAGE INPUT TYPE
===================================================== */

export type UpdatePackageInput = z.infer<
  typeof updatePackageSchema
>;

/* =====================================================
   PACKAGE FEATURE SCHEMA
===================================================== */

export const packageFeatureSchema = z.object({
  category: z.nativeEnum(FeatureCategory),

  code: z
    .string()
    .trim()
    .min(2)
    .transform((v) => v.toUpperCase()),

  slug: z
    .string()
    .trim()
    .min(2)
    .transform((v) => v.toLowerCase()),

  title: z.string().trim().min(2),

  description: z.string().optional(),

  icon: z.string().optional(),

  sortOrder: z.number().int().default(0),

  active: z.boolean().default(true),
});
