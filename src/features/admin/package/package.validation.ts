import { z } from "zod";
import { PackageType } from "@prisma/client";

export const createPackageSchema = z.object({
  name: z.nativeEnum(PackageType),
  title: z.string(),
  description: z.string().optional(),

  plans: z.array(
    z.object({
      durationMonths: z.number(),
      originalPrice: z.number(),
      discountedPrice: z.number().optional(),
      discountPercent: z.number().optional(),
      isPopular: z.boolean().optional(),
      isBestValue: z.boolean().optional(),
    })
  ),

  features: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      isHighlighted: z.boolean().optional(),
    })
  ),
});

export type CreatePackageInput = z.infer<typeof createPackageSchema>;
