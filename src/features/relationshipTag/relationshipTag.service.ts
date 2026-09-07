import { RelationshipTag, UserRelationshipStatus } from "@prisma/client";
import { calculateAge } from "../chat/chat.repository";
import { endRelationshipRepository, findRelationshipByIdRepository, relationshipTagRepository } from "./relationshipTag.repository";
import { RelationshipTagProposalInput } from "./relationshipTag.validation";
import { prisma } from "../../prisma/prismaClient";

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
      await relationshipTagRepository.createProposalWithMessage(
        senderId,
        receiverId,
        tag,
        message
      );

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

    return proposals.map((proposal) => ({
      id: proposal.id,
      tag: proposal.tag,
      status: proposal.status,
      message: proposal.message,
      createdAt: proposal.createdAt,

      sender: {
        id: proposal.sender.id,
        fullName: proposal.sender.full_name,

        age: calculateAge(
          proposal.sender.birth_date
        ),

        photos: proposal.sender.photos,
      },
    }));
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

// relationship.service.ts

const getRelationshipTagLabel = (
  tag: RelationshipTag,
) => {
  const labels: Record<
    RelationshipTag,
    string
  > = {
    IN_RELATIONSHIP: "In a relationship",
    OPEN_RELATIONSHIP: "Open relationship",
    ENGAGED: "Engaged",
    DATE_TO_MARRY: "Dating to marry",
  };

  return labels[tag];
};

const getFirstName = (
  fullName?: string | null,
) => {
  if (!fullName) {
    return "Partner";
  }

  return fullName.trim().split(/\s+/)[0];
};

const formatSinceDate = (
  date: Date,
) => {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
    },
  ).format(date);
};

/**
 * Determines whether this relationship
 * should hide the user from normal/new matches.
 */
const isExclusiveRelationship = (
  tag: RelationshipTag,
): boolean => {
  const exclusiveTags: RelationshipTag[] = [
    RelationshipTag.IN_RELATIONSHIP,
    RelationshipTag.ENGAGED,
    RelationshipTag.DATE_TO_MARRY,
  ];

  return exclusiveTags.includes(tag);
};

export const getCommitmentManagementService =async (
    userId: string,
  ) => {
    // -----------------------------------------
    // 1. Find all ACTIVE relationships
    // -----------------------------------------

    const relationships =
      await prisma.userRelationship.findMany({
        where: {
          status:
            UserRelationshipStatus.ACTIVE,

          OR: [
            {
              user1Id: userId,
            },
            {
              user2Id: userId,
            },
          ],
        },

        include: {
          user1: {
            select: {
              id: true,
              full_name: true,

              photos: {
                orderBy: {
                  order: "asc",
                },

                select: {
                  media_url: true,
                },

                take: 1,
              },
            },
          },

          user2: {
            select: {
              id: true,
              full_name: true,

              photos: {
                orderBy: {
                  order: "asc",
                },

                select: {
                  media_url: true,
                },

                take: 1,
              },
            },
          },

          proposal: {
            select: {
              id: true,
              senderId: true,
              receiverId: true,
              tag: true,
              status: true,
              message: true,
              createdAt: true,
              respondedAt: true,
            },
          },
        },

        orderBy: {
          startedAt: "desc",
        },
      });

    // -----------------------------------------
    // 2. No commitment
    // -----------------------------------------

    if (!relationships.length) {
  return {
    hasCommitment: false,

    status: "SINGLE",

    title: "You're single",

    message: "Open to new matches again",

    commitments: [],
  };
}

    // -----------------------------------------
    // 3. Transform for mobile screen
    // -----------------------------------------

    const commitments = relationships.map(
      (relationship) => {
        const isUser1 =
          relationship.user1Id === userId;

        // Logged-in user
        const self = isUser1
          ? relationship.user1
          : relationship.user2;

        // Other person
        const partner = isUser1
          ? relationship.user2
          : relationship.user1;

        const tagLabel =
          getRelationshipTagLabel(
            relationship.tag,
          );

        const exclusive =
          isExclusiveRelationship(
            relationship.tag,
          );

        const firstName =
          getFirstName(
            partner.full_name,
          );

        return {
          relationshipId:
            relationship.id,

          // ================================
          // SELF PROFILE
          // ================================

          self: {
            id: self.id,

            fullName:
              self.full_name,

            firstName:
              getFirstName(
                self.full_name,
              ),

            photo:
              self.photos[0]
                ?.media_url ?? null,
          },

          // ================================
          // PARTNER PROFILE
          // ================================

          partner: {
            id: partner.id,

            fullName:
              partner.full_name,

            firstName,

            photo:
              partner.photos[0]
                ?.media_url ?? null,

            identityVerified: false,
          },

          tag: relationship.tag,

          tagLabel,

          title:
            `Together with ${firstName}`,

          exclusivity: {
            isExclusive: exclusive,

            hiddenFromNewMatches:
              exclusive,

            label: exclusive
              ? "Exclusive — hidden from new matches"
              : "Open relationship",
          },

          sharedIntent: {
            value:
              relationship.tag,

            label:
              tagLabel,
          },

          since:
            relationship.startedAt,

          sinceLabel:
            formatSinceDate(
              relationship.startedAt,
            ),

          confirmation: {
            mutuallyConfirmed: true,

            label:
              "Mutually confirmed",

            proposalId:
              relationship.proposal
                ?.id ?? null,

            confirmedAt:
              relationship.proposal
                ?.respondedAt ??
              relationship.startedAt,
          },

          createdAt:
            relationship.createdAt,

          updatedAt:
            relationship.updatedAt,
        };
      },
    );

    return {
      hasCommitment: true,
      commitments,
    };
  };
  

  // relationship.service.ts
  

export const endRelationshipService = async (
  userId: string,
  relationshipId: string,
) => {
  const relationship =
    await findRelationshipByIdRepository(relationshipId);

  if (!relationship) {
    throw new Error("Relationship not found");
  }

  // Only relationship users can end it
  const isRelationshipUser =
    relationship.user1Id === userId ||
    relationship.user2Id === userId;

  if (!isRelationshipUser) {
    throw new Error(
      "You are not authorized to end this relationship",
    );
  }

  if (
    relationship.status ===
    UserRelationshipStatus.ENDED
  ) {
    throw new Error(
      "Relationship is already ended",
    );
  }

  const endedRelationship =
    await endRelationshipRepository(
      relationshipId,
    );

  const partner =
    endedRelationship.user1Id === userId
      ? endedRelationship.user2
      : endedRelationship.user1;

  const self =
    endedRelationship.user1Id === userId
      ? endedRelationship.user1
      : endedRelationship.user2;

  return {
    id: endedRelationship.id,
    tag: endedRelationship.tag,
    status: endedRelationship.status,
    startedAt: endedRelationship.startedAt,
    endedAt: endedRelationship.endedAt,

    self: {
      id: self.id,
      fullName: self.full_name,
      profilePhoto:
        self.photos[0]?.media_url ?? null,
    },

    partner: {
      id: partner.id,
      fullName: partner.full_name,
      profilePhoto:
        partner.photos[0]?.media_url ?? null,
    },
  };
};