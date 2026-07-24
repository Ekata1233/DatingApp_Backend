import { z } from "zod";
import { WaitlistSource } from "@prisma/client";

export const joinWaitlistSchema = z.object({
  source: z.nativeEnum(WaitlistSource).optional(),
  notes: z.string().optional(),
});

export type JoinWaitlistDto = z.infer<typeof joinWaitlistSchema>;