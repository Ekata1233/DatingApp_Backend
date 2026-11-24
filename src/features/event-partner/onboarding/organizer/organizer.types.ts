export interface OrganizerAboutYouInput {
  businessId: string;

  fullName?: string;

  email?: string;
  otp?: string;

  verificationConsent?: boolean;

  whatsappUpdates?: boolean;

  verificationDocumentHash?: string;

  whatsappDocumentHash?: string;

  action: "SAVE" | "CONTINUE";
}

// ======================================================
// CONSENT DOCUMENT TYPE
// ======================================================

export interface ConsentDocument {
  version: string;
  hash: string;
  content: string;
}

// ======================================================
// ORGANIZER ONBOARDING ERROR
// ======================================================

export class OrganizerOnboardingError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);

    this.name = "OrganizerOnboardingError";
  }
}

export interface VerifyPanInput {
  partnerId: string;
  businessId: string;
  panNumber: string;
  consent: boolean;
}

export interface GridlinesPanAddress {
  line_1?: string | null;
  line_2?: string | null;
  street?: string | null;
  city?: string | null;
  line_5?: string | null;
  state?: string | null;
  pincode?: string | null;
  email?: string | null;
  phone?: string | null;
  gender?: string | null;
  aadhaar_linked?: boolean | null;
}

export interface GridlinesPanData {
  document_type?: string;
  document_id?: string;

  name?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;

  category?: string | null;
  date_of_birth?: string | null;

  masked_aadhaar_number?: string | null;
  taxpayer_profile?: boolean | null;

  address_data?: GridlinesPanAddress | null;
}

export interface GridlinesPanPayload {
  code?: string;
  message?: string;
  pan_data?: GridlinesPanData;
  reference_id?: string;
}

export interface GridlinesPanResponse extends GridlinesPanPayload {
  data?: GridlinesPanPayload;
}


export interface InitPartnerGovernmentIdInput {
  partnerId: string;
  businessId: string;
  documentType: "AADHAAR";
  consent: boolean;
}

export interface CompletePartnerGovernmentIdInput {
  partnerId: string;
  businessId: string;
  attemptId: string;
}

export class PartnerGovernmentIdError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "PartnerGovernmentIdError";
  }
}

export const normalizeIdentityName = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .replace(/\s+/g, " ");

export const normalizeIndianMobile = (value: string) => {
  let mobile = value.trim().replace(/[\s()-]/g, "");

  if (mobile.startsWith("+91")) {
    mobile = mobile.slice(3);
  } else if (
    mobile.startsWith("91") &&
    mobile.length === 12
  ) {
    mobile = mobile.slice(2);
  }

  if (!/^[6-9]\d{9}$/.test(mobile)) {
    throw new PartnerGovernmentIdError(
      400,
      "Invalid partner mobile number",
    );
  }

  return mobile;
};

