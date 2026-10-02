import { z } from "zod";

export const addMoneySchema = z.object({
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .max(100000, "Maximum add money amount is 100000"),
});

export type AddMoneyInput = z.infer<
  typeof addMoneySchema
>;