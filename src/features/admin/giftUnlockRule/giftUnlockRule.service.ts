// import { giftUnlockRuleRepository } from "./giftUnlockRule.repository";

// export const giftUnlockRuleService = {
//   getRules: async () => {
//     return giftUnlockRuleRepository.getAll();
//   },

//   createRule: async (payload: {
//     giftNumber?: number;
//     requiredMessages: number;
//     isFallback?: boolean;
//   }) => {
//     if (payload.requiredMessages < 1) {
//       throw new Error(
//         "Required messages must be at least 1",
//       );
//     }

//     return giftUnlockRuleRepository.create(payload);
//   },

//   updateRule: async (
//     id: string,
//     payload: {
//       giftNumber?: number;
//       requiredMessages?: number;
//       isFallback?: boolean;
//       isActive?: boolean;
//     },
//   ) => {
//     if (
//       payload.requiredMessages !== undefined &&
//       payload.requiredMessages < 1
//     ) {
//       throw new Error(
//         "Required messages must be at least 1",
//       );
//     }

//     return giftUnlockRuleRepository.update(
//       id,
//       payload,
//     );
//   },
// };