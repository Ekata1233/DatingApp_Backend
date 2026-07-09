// import { z } from "zod";

// export const validateReferralSchema = z.object({
//   body: z.object({
//     referralCode: z
//       .string({
//         required_error: "Referral code is required",
//       })
//       .trim()
//       .min(8, "Referral code must be 8 characters")
//       .max(8, "Referral code must be 8 characters"),
//   }),
// });

// export type ValidateReferralInput = z.infer<
//   typeof validateReferralSchema
// >;
