import { z } from "zod";

export const validateReferralSchema = z.object({
  body: z.object({
    referralCode: z.string({
      error: "Referral code is required",
    })
    .trim()
    .length(8, "Referral code must be exactly 8 characters"),
  }),
});

export const applyReferralSchema=z.object({

body:z.object({

referralCode:z
.string()
.trim()
.length(8)

})

});