import { z } from "zod";

const capacitySchema = z.number().int().min(0).max(100000);

const priceSchema = z.number().finite().min(0).max(99999999);

const discountSchema = z.number().min(0).max(100);

export const calculateRevenueSchema = z
  .object({
    priceType: z.enum(["PER_PERSON", "PER_COUPLE"]),

    totalCapacity: z.number().int().positive().max(100000),

    // Men
    menCapacity: capacitySchema.default(0),
    menEntryPrice: priceSchema.default(0),
    menDiscountPercentage: discountSchema.default(0),

    // Women
    womenCapacity: capacitySchema.default(0),
    womenEntryPrice: priceSchema.default(0),
    womenDiscountPercentage: discountSchema.default(0),

    // Other
    otherCapacity: capacitySchema.default(0),
    otherEntryPrice: priceSchema.default(0),
    otherDiscountPercentage: discountSchema.default(0),

    // Couples
    coupleCapacity: capacitySchema.default(0),
    coupleEntryPrice: priceSchema.default(0),
    coupleDiscountPercentage: discountSchema.default(0),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.priceType === "PER_PERSON") {
      const total =
        data.menCapacity +
        data.womenCapacity +
        data.otherCapacity;

      if (total !== data.totalCapacity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["totalCapacity"],
          message:
            "Men, women and other capacities must equal total capacity",
        });
      }

      if (data.coupleCapacity > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["coupleCapacity"],
          message: "Couple capacity is not allowed for PER_PERSON",
        });
      }
    }

    if (data.priceType === "PER_COUPLE") {
      if (data.coupleCapacity * 2 !== data.totalCapacity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["coupleCapacity"],
          message:
            "Couple capacity multiplied by 2 must equal total capacity",
        });
      }

      if (
        data.menCapacity > 0 ||
        data.womenCapacity > 0 ||
        data.otherCapacity > 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["priceType"],
          message:
            "Individual capacities are not allowed for PER_COUPLE",
        });
      }
    }
  });