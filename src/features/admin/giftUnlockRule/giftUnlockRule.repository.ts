// import { prisma } from "../../../prisma/prismaClient";

// export const giftUnlockRuleRepository = {
//   getAll: async () => {
//     return prisma.giftUnlockRule.findMany({
//       orderBy: [
//         {
//           isFallback: "asc",
//         },
//         {
//           giftNumber: "asc",
//         },
//       ],
//     });
//   },

//   create: async (data: {
//     giftNumber?: number | null;
//     requiredMessages: number;
//     isFallback?: boolean;
//   }) => {
//     return prisma.giftUnlockRule.create({
//       data: {
//         giftNumber: data.giftNumber ?? null,
//         requiredMessages: data.requiredMessages,
//         isFallback: data.isFallback ?? false,
//       },
//     });
//   },

//   update: async (
//     id: string,
//     data: {
//       giftNumber?: number | null;
//       requiredMessages?: number;
//       isFallback?: boolean;
//       isActive?: boolean;
//     },
//   ) => {
//     return prisma.giftUnlockRule.update({
//       where: {
//         id,
//       },
//       data,
//     });
//   },

//   delete: async (id: string) => {
//     return prisma.giftUnlockRule.delete({
//       where: {
//         id,
//       },
//     });
//   },
// };