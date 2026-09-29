import { z } from "zod";

export const videoVerificationSchema = z.object({
  consent: z.literal("Y", {
    message: "User consent is required.",
  }),
});