import { z } from "zod";

export const createBoostSchema = z.object({
  name: z.enum(["BOOST", "PRIMETIME", "SUPER"]),
  title: z.string(),
  description: z.string().optional(),

  options: z.array(
    z.object({
      id: z.string().uuid().optional(), // ✅ ONLY FOR UPDATE FLOW
      label: z.string(),
      boostCount: z.number(),
      timePerBoost: z.number(), // ✅ MUST BE HERE

      pricePerBoost: z.number(),
      totalPrice: z.number(),

      discounted_price: z.number().optional(),
      discount_percent: z.number().optional(),

      is_best_value: z.boolean().optional(),
      is_popular: z.boolean().optional(),
    })
  ),
});

const whyBoostWorksItemSchema = z.object({
  icon: z.string().optional(),
  title: z.string(),
  description: z.string(),
  tag: z.string().optional(),
});

const boostVsSuperBoostFeatureSchema = z.object({
  feature: z.string(),
  boost: z.string(),
  super: z.string(),
});

export const boostInfoSchema = z.object({
  name: z.enum(["BOOST", "PRIMETIME", "SUPER"]),

  whyBoostWorks: z.array(whyBoostWorksItemSchema),

  boostVsSuperBoost: z.object({
    title: z.string(),
    features: z.array(boostVsSuperBoostFeatureSchema),
  }),
});

export const boostFeaturesSchema = z.object({
  name: z.enum(["BOOST", "PRIMETIME", "SUPER"]),

  boostDuration: z.number().int().positive(),

  singleBoostWalletPrice: z.number().nonnegative(),

  visibilityMultiplier: z.number().int().positive(),
});

export type BoostFeaturesInput = z.infer<typeof boostFeaturesSchema>;
export type BoostInfoInput = z.infer<typeof boostInfoSchema>;
// ✅ IMPORTANT
export type CreateBoostInput = z.infer<typeof createBoostSchema>;
