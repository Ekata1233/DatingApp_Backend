import { createMatchRepository, findMatchBetweenUsersRepository, findMatchTriggerMessageRepository, matchRepository } from "./match.repository";

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

export const createMatchFromReplyService = async (
  conversationId: string,
  replyingUserId: string,
) => {
  /*
   * Find Rose/Gift/Compliment where:
   *
   * sender = other user
   * receiver = replyingUserId
   */
  const triggerMessage =
    await findMatchTriggerMessageRepository(
      conversationId,
      replyingUserId,
    );

  if (!triggerMessage) {
    return {
      matched: false,
      reason: "NO_MATCH_TRIGGER",
    };
  }

  const otherUserId = triggerMessage.senderId;

  if (otherUserId === replyingUserId) {
    return {
      matched: false,
      reason: "INVALID_USERS",
    };
  }

  /*
   * Check existing match
   */
  const existingMatch =
    await findMatchBetweenUsersRepository(
      replyingUserId,
      otherUserId,
    );

  if (existingMatch) {
    return {
      matched: false,
      alreadyMatched:
        existingMatch.is_active &&
        !existingMatch.is_deleted,

      previouslyUnmatched:
        !existingMatch.is_active ||
        existingMatch.is_deleted,

      match: existingMatch,
    };
  }

  /*
   * Create/reactivate match
   */
  const match = await createMatchRepository(
    replyingUserId,
    otherUserId,
  );

  let matchedBy:
    | "ROSE_REPLY"
    | "GIFT_REPLY"
    | "COMPLIMENT_REPLY";

  if (triggerMessage.roseId) {
    matchedBy = "ROSE_REPLY";
  } else if (triggerMessage.giftId) {
    matchedBy = "GIFT_REPLY";
  } else {
    matchedBy = "COMPLIMENT_REPLY";
  }

  return {
    matched: true,
    matchedBy,
    match,
  };
};