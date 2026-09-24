import { z } from "zod";

// ============================================
// OPTION 1: MOBILE → UAN → LATEST EMPLOYMENT
// ============================================

export const mobileEmploymentSchema = z.object({
  mobile_number: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),

  // z.literal enforces consent; no extra check needed in the controller.
  consent: z.literal("Y", { message: "User consent is required." }),
});

// ============================================
// OPTION 2: UAN → LATEST EMPLOYMENT
// ============================================

export const uanEmploymentSchema = z.object({
  uan: z
    .string()
    .trim()
    .regex(/^\d{12}$/, "UAN must contain exactly 12 digits"),

  consent: z.literal("Y", { message: "User consent is required." }),
});

export type MobileEmploymentInput = z.infer<typeof mobileEmploymentSchema>;
export type UANEmploymentInput = z.infer<typeof uanEmploymentSchema>;



//Manual verification

export const employmentVerificationSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(2, "Company name must be at least 2 characters")
    .max(150, "Company name is too long"),

  joiningDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Joining date must be YYYY-MM-DD"
    )
    .refine((value) => {
      const date = new Date(`${value}T00:00:00.000Z`);

      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value &&
        date <= new Date()
      );
    }, "Invalid joining date"),

  isCurrentlyWorking: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((value) => value === true || value === "true"),
});

export const employmentReviewSchema = z
  .object({
    action: z.enum(["APPROVE", "REJECT"]),

    rejectionReason: z
      .string()
      .trim()
      .max(1000)
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.action === "REJECT" &&
      !data.rejectionReason
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["rejectionReason"],
        message: "Rejection reason is required",
      });
    }
  });

export const employmentIdSchema = z.string().uuid();

export type EmploymentVerificationInput =
  z.infer<typeof employmentVerificationSchema>;

export type EmploymentReviewInput =
  z.infer<typeof employmentReviewSchema>;

export interface EmploymentFile {
  name?: string;
  originalname?: string;
  mimetype: string;
  size: number;
  data?: Buffer;
  buffer?: Buffer;
}

export interface EmploymentFiles {
  employmentId: EmploymentFile;
  salarySlip: EmploymentFile;
  bankStatement: EmploymentFile;
}

export const validateEmploymentFile = (
  file: EmploymentFile,
  documentType: "employmentId" | "salarySlip" | "bankStatement"
): void => {
  const allowedTypes =
    documentType === "bankStatement"
      ? ["application/pdf"]
      : [
          "image/jpeg",
          "image/png",
          "image/webp",
          "application/pdf",
        ];

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error(
      `Invalid file type for ${documentType}`
    );
  }

  const fileBuffer = file.buffer || file.data;

  if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
    throw new Error(
      `Invalid file buffer for ${documentType}`
    );
  }

  if (
    fileBuffer.length === 0 ||
    fileBuffer.length > 10 * 1024 * 1024
  ) {
    throw new Error(
      `${documentType} must be less than 10 MB`
    );
  }

  if (file.mimetype === "application/pdf") {
    if (
      fileBuffer.subarray(0, 5).toString() !== "%PDF-"
    ) {
      throw new Error(
        `Invalid PDF file for ${documentType}`
      );
    }
  }

  if (file.mimetype === "image/jpeg") {
    if (
      fileBuffer[0] !== 0xff ||
      fileBuffer[1] !== 0xd8 ||
      fileBuffer[2] !== 0xff
    ) {
      throw new Error(
        `Invalid JPEG file for ${documentType}`
      );
    }
  }

  if (file.mimetype === "image/png") {
    const pngSignature =
      Buffer.from("89504e470d0a1a0a", "hex");

    if (
      !fileBuffer.subarray(0, 8).equals(pngSignature)
    ) {
      throw new Error(
        `Invalid PNG file for ${documentType}`
      );
    }
  }

  if (file.mimetype === "image/webp") {
    if (
      fileBuffer.subarray(0, 4).toString() !== "RIFF" ||
      fileBuffer.subarray(8, 12).toString() !== "WEBP"
    ) {
      throw new Error(
        `Invalid WEBP file for ${documentType}`
      );
    }
  }
};