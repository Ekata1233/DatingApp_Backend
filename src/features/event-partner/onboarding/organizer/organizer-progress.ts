import type { OrganizerStep } from "@prisma/client";

const stepNames = {
  PERSONAL_DETAILS: "about_you",
  BUSINESS_DETAILS: "business_details",
  VERIFY_ID: "verify_id",
  YOUR_EVENTS: "your_events",
  UNDER_REVIEW: "inprogress",
  AGREEMENT: "inprogress",
  COMPLETED: null,
} as const satisfies Record<OrganizerStep, string | null>;

const nextSteps = {
  about_you: "business_details",
  business_details: "verify_id",
  verify_id: "your_events",
  your_events: "inprogress",
  inprogress: null,
} as const;

export const getOrganizerStepName = (step?: OrganizerStep) =>
  step === undefined ? null : stepNames[step];

export const getOrganizerStepProgress = (step: OrganizerStep) => {
  const currentStep = getOrganizerStepName(step);
  return { currentStep, nextStep: currentStep ? nextSteps[currentStep] : null };
};
