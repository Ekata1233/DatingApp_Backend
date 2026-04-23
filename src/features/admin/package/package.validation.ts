import { z } from "zod";

export const createPackageSchema = z.object({
  name: z.enum(["BOOST", "PRIMETIME", "SUPER"]),
  title: z.string().min(1),
  description: z.string().optional().nullable(),

  options: z.array(
    z.object({
      label: z.string().min(1),
      boostCount: z.number().int().positive(),
      pricePerBoost: z.number().positive(),
      discounted_price: z.number().optional().nullable(),
      discount_percent: z.number().optional().nullable(),
      totalPrice: z.number().positive(),
      is_best_value: z.boolean().optional(),
      is_popular: z.boolean().optional()
    })
  ).min(1)
});

export type CreatePackageInput = z.infer<typeof createPackageSchema>;
