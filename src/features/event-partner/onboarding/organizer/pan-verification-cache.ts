import { randomUUID } from "node:crypto";

export interface CachedPanDetails {
  panNumber: string;
  documentType: string;
  documentId: string;
  fullName: string;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  category?: string | null;
  dateOfBirth?: string | null;
  maskedAadhaarNumber?: string | null;
  isAadhaarLinked?: boolean | null;
  referenceId?: string | null;
}

export interface CachedPanVerification {
  partnerId: string;
  businessId: string;
  panDetails: CachedPanDetails;
}

export const createPanFetchToken = () => randomUUID();

export const panCacheKey = (token: string) =>
  `event-partner:pan:${token}`;