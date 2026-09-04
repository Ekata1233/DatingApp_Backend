import { z } from "zod";

export const datePlanIdParamsSchema = z.object({
  datePlanId: z
    .string()
    .uuid("Invalid date plan ID"),
});

export const activateDatePlanBoostSchema = z.object({
  boostOptionId: z
    .string()
    .uuid("Invalid boost option ID"),
});