import { relationshipTagRepository } from "./relationshipTag.repository";
import { RelationshipTagProposalInput } from "./relationshipTag.schema";

export const relationshipTagService = {

  async createProposal(
    senderId: string,
    payload: RelationshipTagProposalInput
  ) {
    const { receiverId, tag, message } = payload;

    /**
     * ----------------------------------------
     * 1. Prevent sending proposal to yourself
     * ----------------------------------------
     */
    if (senderId === receiverId) {
      throw new Error(
        "You cannot send a relationship tag proposal to yourself"
      );
    }

    /**
     * ----------------------------------------
     * 2. Check receiver exists
     * ----------------------------------------
     */
    const receiver =
      await relationshipTagRepository.findUserById(receiverId);

    if (!receiver) {
      throw new Error("User not found");
    }

    /**
     * ----------------------------------------
     * 3. Check receiver is not deleted
     * ----------------------------------------
     */
    if (receiver.deleted_at) {
      throw new Error("This user is no longer available");
    }

    /**
     * ----------------------------------------
     * 4. Check sender exists
     * ----------------------------------------
     */
    const sender =
      await relationshipTagRepository.findUserById(senderId);

    if (!sender) {
      throw new Error("Sender user not found");
    }

    /**
     * ----------------------------------------
     * 5. Check if already active relationship
     * ----------------------------------------
     */
    const activeRelationship =
      await relationshipTagRepository.findActiveRelationship(
        senderId,
        receiverId
      );

    if (activeRelationship) {
      throw new Error(
        "You already have an active relationship with this user"
      );
    }

    /**
     * ----------------------------------------
     * 6. Check existing pending proposal
     * ----------------------------------------
     *
     * Checks both directions:
     *
     * A -> B
     *
     * B -> A
     */
    const existingProposal =
      await relationshipTagRepository.findPendingProposal(
        senderId,
        receiverId
      );

    if (existingProposal) {
      throw new Error(
        "A relationship tag proposal is already pending between you and this user"
      );
    }

    /**
     * ----------------------------------------
     * 7. Create proposal
     * ----------------------------------------
     */
    const result =
      await relationshipTagRepository.createProposal({
        senderId,
        receiverId,
        tag,
        message,
      });

    /**
     * ----------------------------------------
     * 8. Return response
     * ----------------------------------------
     */
   return {
    proposal: {
      id: result.proposal.id,
      tag: result.proposal.tag,
      status: result.proposal.status,
      message: result.proposal.message,
      createdAt: result.proposal.createdAt,

      sender: {
        id: result.proposal.sender.id,
        fullName: result.proposal.sender.full_name,
      },

      receiver: {
        id: result.proposal.receiver.id,
        fullName: result.proposal.receiver.full_name,
      },
    },

    message: result.message,
  };
  },

  /**
   * Get received relationship tag proposals
   */
  async getReceivedProposals(userId: string) {
    /**
     * Make sure user exists
     */
    const user =
      await relationshipTagRepository.findUserById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    /**
     * Get pending proposals
     */
    const proposals =
      await relationshipTagRepository.findReceivedProposals(
        userId
      );

    return proposals;
  },

  /**
   * ----------------------------------------
   * Accept proposal
   * ----------------------------------------
   */
async acceptProposal(
  proposalId: string,
  userId: string
) {
  const result =
    await relationshipTagRepository.acceptProposal(
      proposalId,
      userId
    );

  const {
    relationship,
    proposal,
    message,
  } = result;


  // Determine partner
  const partner =
    userId === proposal.senderId
      ? proposal.receiver
      : proposal.sender;


  return {
    id: relationship.id,

    tag: relationship.tag,

    status: relationship.status,

    startedAt: relationship.startedAt,

    partner: {
      id: partner.id,

      fullName:
        partner.full_name,
    },

    proposal: {
      id: proposal.id,

      status: proposal.status,

      respondedAt:
        proposal.respondedAt,
    },

    // Important
    message,
  };
},

  async rejectProposal(
    proposalId: string,
    userId: string
  ) {
    const proposal =
      await relationshipTagRepository.rejectProposal(
        proposalId,
        userId
      );

    return {
      id: proposal.id,
      tag: proposal.tag,
      status: proposal.status,
      message: proposal.message,
      respondedAt: proposal.respondedAt,
      createdAt: proposal.createdAt,

      sender: {
        id: proposal.sender.id,
        fullName: proposal.sender.full_name,
      },

      receiver: {
        id: proposal.receiver.id,
        fullName: proposal.receiver.full_name,
      },
    };
  },

  async cancelProposal(
    proposalId: string,
    userId: string
  ) {
    const proposal =
      await relationshipTagRepository.cancelProposal(
        proposalId,
        userId
      );

    return {
      id: proposal.id,
      tag: proposal.tag,
      status: proposal.status,
      message: proposal.message,
      respondedAt: proposal.respondedAt,
      createdAt: proposal.createdAt,

      sender: {
        id: proposal.sender.id,
        fullName: proposal.sender.full_name,
      },

      receiver: {
        id: proposal.receiver.id,
        fullName: proposal.receiver.full_name,
      },
    };
  },


};