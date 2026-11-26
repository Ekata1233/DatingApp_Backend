import { VenueArrangement, VenueType } from "@prisma/client";
import { z } from "zod";

export const venueSchema = z.object({
  venueName: z.string().trim().min(1).max(150),
  fullAddress: z.string().trim().min(1).max(1000),
  venueCapacity: z.string().trim().regex(/^\d+$/).transform(Number)
    .pipe(z.number().int().min(1).max(2147483647)),
  venueType: z.enum(VenueType),
  arrangement: z.enum(VenueArrangement),
}).strict();

export type VenueInput = z.infer<typeof venueSchema>;
