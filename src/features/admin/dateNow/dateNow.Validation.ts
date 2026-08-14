import { z } from "zod";
import { OptionType } from "@prisma/client";

const optionSchema = z.object({
  label: z.string().min(1, "Label is required"),
  value: z.string().min(1, "Value is required"),
  icon: z.string().url().optional().nullable(), // ✅ Allow null
  sortOrder: z.number().optional().default(0),
});

export const upsertDatePlanOptionsSchema = z.object({
  type: z.nativeEnum(OptionType),
  options: z.array(optionSchema).min(1, "At least one option is required"),
});


export const datePlanPackageInfoSchema = z.object({
  howOnePlanWorks: z.any().optional(),
  whyPeopleBuyPlans: z.any().optional(),
  goodToKnow: z.any().optional(),
});
export const datePlanPackageFeaturesSchema = z.object({
  costToPostPlan: z.number().nonnegative().optional(),
  costToPostPlanActive: z.boolean().optional(),
  costToPostPlanPaidOnly: z.boolean().optional(),

  planBoostPrice: z.number().nonnegative().optional(),
  planBoostActive: z.boolean().optional(),
  planBoostPaidOnly: z.boolean().optional(),
});