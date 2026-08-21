// import { chatRepository } from "../chat.repository";

// export const messageService = {

// async getNewMatches(userId: string) {
//   const messages =
//     await chatRepository.findNewMatches(userId);

//   const uniqueSenders = new Map();

//   for (const message of messages) {
//     if (!uniqueSenders.has(message.senderId)) {
//       uniqueSenders.set(
//         message.senderId,
//         message
//       );
//     }
//   }

//   return Array.from(
//     uniqueSenders.values()
//   );
// }

// }