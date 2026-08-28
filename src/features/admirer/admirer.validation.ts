import { z } from "zod";

export const getAdmirersSchema = z.object({
  type: z.enum(["LIKE", "ROSE"]),
  direction: z.enum(["RECEIVED", "SENT"]),
});

export type GetAdmirersQuery = z.infer<
  typeof getAdmirersSchema
>;