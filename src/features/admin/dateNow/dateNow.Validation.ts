import { z } from "zod";

export const upsertDatePlanOptionsSchema = z.object({
  type: z.enum([
    "ACTIVITY",
    "QUICK_TITLE",
    "VIBE",
    "WHEN",
    "TIME",
    "DURATION",
    "WHO_PAYS",
    "PARTICIPANTS",
    "JOIN_REQUEST_GENDER",
    "PLAN_VISIBILITY",
  ]),
  options: z.array(
    z.object({
      id: z.string().uuid().optional(),
      label: z.string().min(1),
      value: z.string().optional(),
      icon: z.string().optional(),
      sortOrder: z.number().optional(),
      isActive: z.boolean().optional(),
    })
  ),
});