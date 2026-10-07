import {
  IncomeProofType,
} from "@prisma/client";

export interface IncomeFile {
  name?: string;
  originalname?: string;
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
  data?: Buffer;
}

export interface IncomeFiles {
  primaryDocument?: IncomeFile;
  secondaryDocument?: IncomeFile;
}

export interface IncomeVerificationInput {
  annualIncome?: number;
  currency?: string;
  proofType: IncomeProofType;
  employerName?: string;
  financialYear?: string;
}

export interface ReviewIncomeVerificationInput {
  action: "APPROVE" | "REJECT";
  rejectionReason?: string;
}