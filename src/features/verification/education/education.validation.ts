import { z } from "zod";
import { EducationFile } from "./education.type";

export const educationVerificationSchema = z
  .object({
    institutionName: z
      .string()
      .trim()
      .min(2, "Institution name is required")
      .max(200, "Institution name is too long"),

    degreeName: z
      .string()
      .trim()
      .min(2, "Degree name is required")
      .max(150, "Degree name is too long"),

    fieldOfStudy: z
      .string()
      .trim()
      .max(150, "Field of study is too long")
      .optional(),

    startYear: z.coerce
      .number()
      .int()
      .min(1950, "Invalid start year")
      .max(new Date().getFullYear(), "Start year cannot be in the future")
      .optional(),

    graduationYear: z.coerce
      .number()
      .int()
      .min(1950, "Invalid graduation year")
      .max(
        new Date().getFullYear() + 10,
        "Invalid graduation year"
      )
      .optional(),

    isCurrentlyStudying: z
      .union([
        z.boolean(),
        z.enum(["true", "false"]),
      ])
      .transform((value) => {
        if (typeof value === "boolean") {
          return value;
        }

        return value === "true";
      }),
  })
  .superRefine((data, ctx) => {
    if (
      data.startYear &&
      data.graduationYear &&
      data.graduationYear < data.startYear
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["graduationYear"],
        message: "Graduation year cannot be before start year",
      });
    }

    if (
      !data.isCurrentlyStudying &&
      !data.graduationYear
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["graduationYear"],
        message:
          "Graduation year is required if you are not currently studying",
      });
    }
  });

export const educationIdSchema = z.string().uuid(
  "Invalid education verification ID"
);

export const educationReviewSchema = z
  .object({
    action: z.enum(["APPROVE", "REJECT"]),

    rejectionReason: z
      .string()
      .trim()
      .min(3, "Rejection reason is required")
      .max(500)
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
          "Rejection reason is required when rejecting verification",
      });
    }
  });
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const validateEducationFile = (
  file: EducationFile,
  fieldName: string
) => {
  if (!file) {
    throw new Error(`${fieldName.toUpperCase()}_REQUIRED`);
  }

  if (
    file.size &&
    file.size > MAX_FILE_SIZE
  ) {
    throw new Error(
      `${fieldName.toUpperCase()}_FILE_TOO_LARGE`
    );
  }

  if (
    file.mimetype &&
    !ALLOWED_TYPES.includes(file.mimetype)
  ) {
    throw new Error(
      `${fieldName.toUpperCase()}_INVALID_FILE_TYPE`
    );
  }

  const fileBuffer =
    file.buffer || file.data;

  if (!fileBuffer) {
    throw new Error(
      `${fieldName.toUpperCase()}_FILE_BUFFER_MISSING`
    );
  }

  return fileBuffer;
};
export type EducationVerificationInput =
  z.infer<typeof educationVerificationSchema>;