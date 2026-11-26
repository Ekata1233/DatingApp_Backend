import { PayoutCycle } from "@prisma/client";
import { UploadedFile } from "express-fileupload";
import { z } from "zod";

export const ifscSchema = z.string().trim().toUpperCase()
  .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Enter a valid IFSC code");

const accountNumberSchema = z.string().trim()
  .regex(/^\d{4,34}$/, "Enter an account number with 4 to 34 digits");

const bankAccountFields = z.object({
  accountHolderName: z.string().trim().min(1).max(150),
  accountNumber: accountNumberSchema,
  confirmAccountNumber: accountNumberSchema,
  ifscCode: ifscSchema,
  payoutCycle: z.enum(PayoutCycle),
});

export const bankAccountSchema = bankAccountFields.refine(
  (input) => input.accountNumber === input.confirmAccountNumber,
  { path: ["confirmAccountNumber"], message: "Account numbers must match" },
);

export type BankAccountInput = z.infer<typeof bankAccountSchema>;

export const editBankAccountSchema = bankAccountFields.partial().refine(
  (input) => input.accountNumber === input.confirmAccountNumber,
  { path: ["confirmAccountNumber"], message: "Provide both account number fields with matching values" },
);

export type EditBankAccountInput = z.infer<typeof editBankAccountSchema>;

export const getDocumentExtension = (file: UploadedFile) => {
  const { data } = file;
  if (file.truncated || data.length > 5 * 1024 * 1024) return null;
  if (data.subarray(0, 5).equals(Buffer.from("%PDF-"))) return "pdf";
  if (data.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "jpg";
  if (data.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) return "png";
  return null;
};
