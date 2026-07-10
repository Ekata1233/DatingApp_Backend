import { z } from "zod";
import { WaitlistSource } from "@prisma/client";

export const joinWaitlistSchema = z.object({
  paymentId: z.string().uuid(),

  source: z.nativeEnum(WaitlistSource).optional(),
});

export type JoinWaitlistDto = z.infer<typeof joinWaitlistSchema>;