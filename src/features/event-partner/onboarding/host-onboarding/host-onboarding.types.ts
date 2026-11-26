import { HostStep } from "@prisma/client";
import { Request } from "express";

/* -------------------------------------------------------------------------- */
/*                               HOST REQUEST                                 */
/* -------------------------------------------------------------------------- */

export interface HostOnboardingRequest extends Request {
  partner?: {
    id: string;
    sessionId: string;
    role?: string;
    businessId?: string;
    hostId?: string;
  };

  hostContext?: {
    hostId: string;
    partnerId: string;
    businessId: string;
  };
}

/* -------------------------------------------------------------------------- */
/*                              REQUEST TYPES                                 */
/* -------------------------------------------------------------------------- */

export interface AcceptInvitationInput {
  accepted: true;
}

export interface PersonalDetailsInput {
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface CodeOfConductInput {
  codeOfConductAccepted: true;
  guestPrivacyAccepted: true;
  safetyRulesAccepted: true;
}

/* -------------------------------------------------------------------------- */
/*                             CUSTOM API ERROR                               */
/* -------------------------------------------------------------------------- */

export class HostOnboardingError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "HostOnboardingError";
  }
}

/* -------------------------------------------------------------------------- */
/*                             ONBOARDING STEPS                               */
/* -------------------------------------------------------------------------- */

export const HOST_STEP_NUMBER: Record<HostStep, number> = {
  INVITE_ACCEPTANCE: 1,
  PERSONAL_DETAILS: 2,
  VERIFY_ID: 3,
  VERIFICATION: 4,
  CODE_OF_CONDUCT: 5,
  COMPLETED: 5,
};

export const HOST_TOTAL_STEPS = 5;

/* -------------------------------------------------------------------------- */
/*                              HOST PERMISSIONS                              */
/* -------------------------------------------------------------------------- */

export const HOST_PERMISSION_OPTIONS = [
  {
    key: "canViewGuestList",
    label: "See the guest list",
    ownerOnly: false,
  },
  {
    key: "canCheckInGuests",
    label: "Check guests in",
    ownerOnly: false,
  },
  {
    key: "canUpdateRunSheetProgress",
    label: "Run sheet & itinerary",
    ownerOnly: false,
  },
  {
    key: "canViewRoomList",
    label: "Stay & room list",
    ownerOnly: false,
  },
  {
    key: "canReportIncidentSOS",
    label: "Report incidents & SOS",
    ownerOnly: false,
  },
  {
    key: "canMessageGuests",
    label: "Message guests",
    ownerOnly: false,
  },
  {
    key: "canReplyToReviews",
    label: "Reply to reviews",
    ownerOnly: false,
  },
  {
    key: "canCreateSubmitEvent",
    label: "Create & submit events",
    ownerOnly: false,
  },
  {
    key: "canEditEvent",
    label: "Edit event details & itinerary",
    ownerOnly: false,
  },
  {
    key: "canCancelEventRefund",
    label: "Cancel events & refunds",
    ownerOnly: false,
  },
  {
    key: "canManagePayouts",
    label: "Payouts, bank & invoices",
    ownerOnly: false,
  },
] as const;

/* -------------------------------------------------------------------------- */
/*                              CODE OF CONDUCT                               */
/* -------------------------------------------------------------------------- */

export const HOST_CODE_OF_CONDUCT_VERSION = "1.0";

export const HOST_CODE_OF_CONDUCT_RULES = [
  {
    id: "PROFESSIONAL_CONDUCT",
    icon: "🤝",
    title: "Be the host, not a guest",
    description:
      "No flirting with, dating or asking out guests at an event you're running.",
  },
  {
    id: "GUEST_PRIVACY",
    icon: "🔒",
    title: "Guest details stay in the app",
    description:
      "Never ask for phone numbers or Instagram, and never add guests to outside groups.",
  },
  {
    id: "SAFETY",
    icon: "🛡️",
    title: "Safety first",
    description:
      "Stay on site till the last guest leaves. Report every incident to Welvors within 24 hours.",
  },
  {
    id: "ZERO_TOLERANCE",
    icon: "🚫",
    title: "Zero tolerance",
    description:
      "No harassment, no discrimination, no alcohol or drugs while on duty.",
  },
  {
    id: "NO_EXTERNAL_PAYMENTS",
    icon: "💸",
    title: "No money from guests",
    description:
      "All payments happen in the Welvors app. Never collect cash or UPI.",
  },
];

export const HOST_CODE_OF_CONDUCT_DECLARATIONS = [
  {
    key: "codeOfConductAccepted",
    label:
      "I've read the host code of conduct and I agree to follow it",
    required: true,
  },
  {
    key: "guestPrivacyAccepted",
    label:
      "I'll keep guest details private and inside the Welvors app",
    required: true,
  },
  {
    key: "safetyRulesAccepted",
    label:
      "I understand the safety and anti-harassment (POSH) rules for hosts",
    required: true,
  },
];
