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