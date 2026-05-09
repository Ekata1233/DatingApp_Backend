import { z } from "zod";

export const updateBasicInfoSchema = z.object({
  full_name: z.string().optional(),
  birth_date: z.string().optional(),
  height: z.number().optional(),
  city: z.string().optional(),
  religion: z.string().optional(),
  community: z.string().optional(),
  interested_in: z.string().optional(),
  love_language: z.array(z.string()).optional()
});

export const updateBioSchema = z.object({
  bio: z
    .string()
    .max(500, "Bio cannot exceed 500 characters")
});
