import { GovernmentIdType } from "@prisma/client";
import { GovernmentDocumentAddress } from "./government-id.provider";

export interface VerifiedGovernmentDocument {
  transactionConfirmed: boolean;

  documentAccessConfirmed: boolean;

  isAuthentic: boolean;

  documentType: GovernmentIdType;

  verifiedName: string;

  dateOfBirth: Date;
  verifiedGender: string;
  portraitBuffer: Buffer | null;

  address: GovernmentDocumentAddress;
}