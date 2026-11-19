export interface OrganizerAboutYouInput {
  businessId: string;

  fullName?: string;

  email?: string;

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