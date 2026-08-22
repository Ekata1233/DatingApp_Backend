import { calculateAge } from "../chat.repository";
import { matchRepository } from "./match.repository";


export const matchService = {
  async getNewMatches(userId: string) {
    const messages = await matchRepository.findNewMatches(userId);

    console.log("message : ", messages)

    /**
     * One sender = one New Match card.
     *
     * Because repository returns newest first,
     * the first message we see from a sender
     * is their latest unread interaction.
     */
    const uniqueSenders = new Map<string, (typeof messages)[number]>();

    for (const message of messages) {
      if (!uniqueSenders.has(message.senderId)) {
        uniqueSenders.set(message.senderId, message);
      }
    }

    return Array.from(uniqueSenders.values()).map((message) => {
      const sender = message.sender;

      return {
        messageId: message.id,

        type: message.messageType,

        content: message.content,

        metadata: message.metadata,

        createdAt: message.createdAt,

        sender: {
          id: sender.id,
          name: sender.full_name,

          age: sender.birth_date ? calculateAge(sender.birth_date) : null,

          photo: sender.photos[0]?.media_url ?? null,
        },
      };
    });
  },
};
