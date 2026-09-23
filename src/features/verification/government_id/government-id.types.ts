import { GovernmentIdType } from "@prisma/client";

export interface VerifiedGovernmentDocument {
  transactionConfirmed: boolean;

  documentAccessConfirmed: boolean;

  isAuthentic: boolean;

  documentType: GovernmentIdType;

  verifiedName: string;

  dateOfBirth: Date;

  portraitBuffer: Buffer | null;
}