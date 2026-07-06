import { z } from "zod";

const communitySchema = z.object({
  name: z.string().trim().min(1, "Community name is required"),
  priority: z.number().int().nonnegative(),
  active: z.boolean(),
});

const religionSchema = z.object({
  name: z.string().trim().min(1, "Religion name is required"),
  priority: z.number().int().nonnegative(),
  active: z.boolean(),
  communities: z.array(communitySchema),
});

export const religionPayloadSchema = z.object({
  religions: z.array(religionSchema).min(1, "At least one religion is required"),
});