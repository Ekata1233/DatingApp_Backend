// modules/swipe/swipe.validation.ts

import { z } from "zod";

export const swipeSchema = z.object({
  targetUserId: z.string().uuid(),
  action: z.enum(["LIKE", "PASS", "SUPERLIKE"]),
});
