// import { ONBOARDING_FLOWS } from "../config/onboardingFlows";

// export const getNextStep = (flowType: string, currentStep: string) => {
//   const flow = ONBOARDING_FLOWS[flowType as keyof typeof ONBOARDING_FLOWS];

//   if (!flow) throw new Error("Invalid flow type");

//   const index = flow.indexOf(currentStep);

//   if (index === -1 || index === flow.length - 1) {
//     return "COMPLETE";
//   }

//   return flow[index + 1];
// };
// ..

import { ONBOARDING_FLOWS } from "../config/onboardingFlows";

const DATING_FLOW = ONBOARDING_FLOWS.DATING;

export const getNextStep = (currentStep: string) => {
  const index = DATING_FLOW.indexOf(currentStep);

  if (index === -1 || index === DATING_FLOW.length - 1) {
    return "COMPLETE";
  }

  return DATING_FLOW[index + 1];
};