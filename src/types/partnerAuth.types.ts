import { Request } from "express";

export type PartnerRole = "ORGANIZER" | "HOST";

export interface PartnerTokenPayload {
  partnerId: string;
  sessionId: string;
  role?: PartnerRole;
  businessId?: string;
  tokenType: "PARTNER";
}

export interface PartnerAuthData {
  id: string;
  sessionId: string;
  role?: PartnerRole;
  businessId?: string;
  hostId?: string;
}

export interface PartnerRequest extends Request {
  partner?: PartnerAuthData;

  eventAccess?: {
    eventId: string;
    businessDetailsId: string;
  };
}