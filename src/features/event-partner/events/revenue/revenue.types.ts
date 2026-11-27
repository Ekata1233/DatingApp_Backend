import { z } from "zod";
import { calculateRevenueSchema } from "./revenue.validation";

export type CalculateRevenueInput = z.infer<
  typeof calculateRevenueSchema
>;