export interface IEmploymentType {
  name: string;
  isActive: boolean;
}import { z } from "zod";

export const employmentTypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Employment type is required"),

  isActive: z.boolean(),
});