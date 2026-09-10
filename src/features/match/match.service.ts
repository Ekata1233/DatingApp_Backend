import { createMatchRepository, findConversationMatchState, findMatchBetweenUsersRepository, findMatchTriggerMessageRepository, markConversationMatched, matchRepository } from "./match.repository";

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

export const createMatchFromReplyService =
  async (
    conversationId: string,
    replyingUserId: string,
  ) => {
    /**
     * 1. Check conversation state.
     */
    const conversation =
      await findConversationMatchState(
        conversationId,
      );

      console.log("conversation : ", conversation)

    if (!conversation) {
      return {
        matched: false,
        reason:
          "CONVERSATION_NOT_FOUND",
      };
    }

    /**
     * Already converted to match.
     */
    if (conversation.match) {
      return {
        matched: false,
        reason:
          "CONVERSATION_ALREADY_MATCHED",
      };
    }

    /**
     * Very important.
     *
     * Example:
     *
     * C sends Rose -> D
     *
     * matchPendingForUserId = D
     *
     * Only D's message should create match.
     */


    console.log("replying Id : ", replyingUserId)
    console.log("match pending for user Id : ", conversation.matchPendingForUserId)
    if (
      conversation.matchPendingForUserId !==
      replyingUserId
    ) {
      return {
        matched: false,
        reason:
          "USER_NOT_PENDING_FOR_MATCH",
      };
    }

    /**
     * 2. Find Rose/Gift/Compliment.
     *
     * sender = C
     * receiver = D
     */
    const triggerMessage =
      await findMatchTriggerMessageRepository(
        conversationId,
        replyingUserId,
      );

      console.log("triggermessage : ", triggerMessage)
    if (!triggerMessage) {
      return {
        matched: false,
        reason: "NO_MATCH_TRIGGER",
      };
    }

    const otherUserId =
      triggerMessage.senderId;

    if (
      !otherUserId ||
      otherUserId === replyingUserId
    ) {
      return {
        matched: false,
        reason: "INVALID_USERS",
      };
    }

    /**
     * 3. Check existing UserMatch.
     */
    const existingMatch =
      await findMatchBetweenUsersRepository(
        replyingUserId,
        otherUserId,
      );

    /**
     * Already active.
     *
     * Conversation state might be out
     * of sync, so mark it as matched.
     */
    if (
      existingMatch?.is_active &&
      !existingMatch.is_deleted
    ) {
      await markConversationMatched(
        conversationId,
        replyingUserId,
      );

      return {
        matched: false,
        alreadyMatched: true,
        reason:
          "MATCH_ALREADY_EXISTS",
        match: existingMatch,
      };
    }

    /**
     * Recommended:
     *
     * Do NOT automatically rematch users
     * after an explicit unmatch.
     */
    if (
      existingMatch &&
      (
        !existingMatch.is_active ||
        existingMatch.is_deleted
      )
    ) {
      return {
        matched: false,
        previouslyUnmatched: true,
        reason:
          "PREVIOUSLY_UNMATCHED",
        match: existingMatch,
      };
    }

    /**
     * 4. Atomic conversation claim.
     *
     * Prevent two rapid replies from
     * creating the match twice.
     */
    const conversationUpdated =
      await markConversationMatched(
        conversationId,
        replyingUserId,
      );

    if (
      conversationUpdated.count === 0
    ) {
      return {
        matched: false,
        reason:
          "MATCH_ALREADY_PROCESSED",
      };
    }

    /**
     * 5. Create UserMatch.
     */
    const match =
      await createMatchRepository(
        replyingUserId,
        otherUserId,
      );

    let matchedBy:
      | "ROSE_REPLY"
      | "GIFT_REPLY"
      | "COMPLIMENT_REPLY";

    if (triggerMessage.roseId) {
      matchedBy =
        "ROSE_REPLY";
    } else if (
      triggerMessage.giftId
    ) {
      matchedBy =
        "GIFT_REPLY";
    } else {
      matchedBy =
        "COMPLIMENT_REPLY";
    }

    return {
      matched: true,
      matchedBy,
      match,
    };
  };