import { z } from "zod";

export const manualAadhaarSchema = z.object({
  aadhaarNumber: z
    .string()
    .transform((value) =>
      value.replace(/\s|-/g, "")
    )
    .refine(
      (value) => /^\d{12}$/.test(value),
      "Aadhaar number must contain exactly 12 digits"
    ),

  fullName: z
    .string()
    .trim()
    .min(2, "Full name is required")
    .max(100),

  dateOfBirth: z
    .string()
    .refine((value) => {
      const date = new Date(value);

      return !isNaN(date.getTime());
    }, "Invalid date of birth"),

  gender: z
    .string()
    .trim()
    .optional(),

  address: z
    .string()
    .trim()
    .optional(),
});

export const manualAadhaarReviewSchema =
  z
    .object({
      action: z.enum([
        "APPROVE",
        "REJECT",
      ]),

      rejectionReason: z
        .string()
        .trim()
        .optional(),
    })
    .superRefine((data, ctx) => {
      if (
        data.action === "REJECT" &&
        !data.rejectionReason
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["rejectionReason"],
          message:
            "Rejection reason is required",
        });
      }
    });

    export interface AadhaarFile {
  name?: string;
  originalname?: string;
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
  data?: Buffer;
}

export interface ManualAadhaarFiles {
  aadhaarFrontPhoto?: AadhaarFile;
  aadhaarBackPhoto?: AadhaarFile;
}