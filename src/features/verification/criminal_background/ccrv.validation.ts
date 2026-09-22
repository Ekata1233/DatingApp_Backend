import { z } from "zod";

export const generateCCRVSchema = z.object({

  father_name: z
    .string()
    .trim()
    .max(256, "Father's name is too long")
    .optional(),

  consent: z.literal(true),

});

export type GenerateCCRVInput =
  z.infer<typeof generateCCRVSchema>;