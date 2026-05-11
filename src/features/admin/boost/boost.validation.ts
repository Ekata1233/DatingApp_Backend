import { z } from "zod";

export const createBoostSchema = z.object({
  name: z.enum(["BOOST", "PRIMETIME", "SUPER"]),
  title: z.string(),
  description: z.string().optional(),

  options: z.array(
    z.object({
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

// ✅ IMPORTANT
export type CreateBoostInput = z.infer<typeof createBoostSchema>;
