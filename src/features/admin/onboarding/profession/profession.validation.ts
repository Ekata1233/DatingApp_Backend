import { z } from "zod";

export const professionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Profession name is required"),

  isActive: z.boolean().optional(),
});