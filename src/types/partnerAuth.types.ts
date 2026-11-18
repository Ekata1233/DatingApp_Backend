import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

export type PartnerRole =
  | "ORGANIZER"
  | "HOST";

// ======================================================
// JWT TOKEN PAYLOAD
// ======================================================

export interface PartnerTokenPayload extends JwtPayload {
  partnerId: string;

  sessionId: string;

  tokenType: "PARTNER";

  role?: PartnerRole;

  businessId?: string;
}

// ======================================================
// AUTHENTICATED PARTNER
// ======================================================

export interface AuthenticatedPartner {
  id: string;

  sessionId: string;

  role?: PartnerRole;

  businessId?: string;

  hostId?: string;
}

// ======================================================
// EVENT ACCESS
// ======================================================

export interface PartnerEventAccess {
  eventId: string;

  businessDetailsId: string;
}

// ======================================================
// EXPRESS REQUEST
// ======================================================

export interface PartnerRequest extends Request {
  partner?: AuthenticatedPartner;

  eventAccess?: PartnerEventAccess;
}