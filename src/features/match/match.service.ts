import { matchRepository } from "./match.repository";

export const matchService = {

  async unmatch(
    currentUserId: string,
    otherUserId: string,
    reason: string,
    note?: string
  ) {

    /**
     * ----------------------------------------
     * Find active match
     * ----------------------------------------
     */

    const match = await matchRepository.findActiveMatch(
      currentUserId,
      otherUserId
    );

    if (!match) {
      throw new Error("MATCH_NOT_FOUND");
    }

    /**
     * ----------------------------------------
     * Unmatch
     * ----------------------------------------
     */

    const result = await matchRepository.unmatch(
      match.id,
      currentUserId,
      reason,
      note
    );

    return {
      matchId: match.id,
      otherUserId,
      conversationId: result.conversationId,
      reason,
      message: "Match successfully removed",
    };
  },
};