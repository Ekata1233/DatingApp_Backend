import { PrismaClient, UserRelationshipStatus } from "@prisma/client";

const prisma = new PrismaClient();

export const relationshipTagRepository = {
    /**
     * Find receiver user
     */
    async findUserById(userId: string) {
        return prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
                full_name: true,
                deleted_at: true,
            },
        });
    },

    /**
     * Find an existing pending proposal in either direction.
     *
     * A -> B
     * OR
     * B -> A
     */
    async findPendingProposal(
        senderId: string,
        receiverId: string
    ) {
        return prisma.relationshipTagProposal.findFirst({
            where: {
                status: "PENDING",
                OR: [
                    {
                        senderId,
                        receiverId,
                    },
                    {
                        senderId: receiverId,
                        receiverId: senderId,
                    },
                ],
            },
        });
    },

    /**
     * Find an existing active relationship
     * between two users.
     */
    async findActiveRelationship(
        user1Id: string,
        user2Id: string
    ) {
        const [userA, userB] =
            user1Id < user2Id
                ? [user1Id, user2Id]
                : [user2Id, user1Id];

        return prisma.userRelationship.findFirst({
            where: {
                user1Id: userA,
                user2Id: userB,
                status: "ACTIVE",
            },
        });
    },

    /**
     * Create relationship tag proposal
     */
    async createProposalWithMessage(
        senderId: string,
        receiverId: string,
        tag: any,
        message?: string
    ) {
        return prisma.$transaction(async (tx) => {

            // ========================================
            // 1. Check users
            // ========================================

            const receiver = await tx.user.findUnique({
                where: {
                    id: receiverId,
                },
                select: {
                    id: true,
                    full_name: true,
                },
            });

            if (!receiver) {
                throw new Error("Receiver not found");
            }

            if (senderId === receiverId) {
                throw new Error(
                    "You cannot send a relationship tag proposal to yourself"
                );
            }


            // ========================================
            // 2. Check existing pending proposal
            // ========================================

            const existingProposal =
                await tx.relationshipTagProposal.findFirst({
                    where: {
                        OR: [
                            {
                                senderId,
                                receiverId,
                                status: "PENDING",
                            },
                            {
                                senderId: receiverId,
                                receiverId: senderId,
                                status: "PENDING",
                            },
                        ],
                    },
                });

            if (existingProposal) {
                throw new Error(
                    "A pending relationship tag proposal already exists"
                );
            }


            // ========================================
            // 3. Create proposal
            // ========================================

            const proposal =
                await tx.relationshipTagProposal.create({
                    data: {
                        senderId,
                        receiverId,
                        tag,
                        message: message ?? null,
                        status: "PENDING",
                    },

                    include: {
                        sender: {
                            select: {
                                id: true,
                                full_name: true,
                            },
                        },

                        receiver: {
                            select: {
                                id: true,
                                full_name: true,
                            },
                        },
                    },
                });


            // ========================================
            // 4. Find conversation
            // ========================================

            const conversation =
                await tx.conversation.findFirst({
                    where: {
                        AND: [
                            {
                                participants: {
                                    some: {
                                        userId: senderId,
                                    },
                                },
                            },
                            {
                                participants: {
                                    some: {
                                        userId: receiverId,
                                    },
                                },
                            },
                        ],
                    },
                    select: {
                        id: true,
                    },
                });


            if (!conversation) {
                throw new Error(
                    "Conversation not found between users"
                );
            }


            // ========================================
            // 5. Create chat message
            // ========================================

            const chatMessage =
                await tx.chatMessage.create({
                    data: {
                        conversationId: conversation.id,
                        senderId,

                        content:
                            message ??
                            `${proposal.sender.full_name} sent a relationship tag proposal`,

                        messageType:
                            "RELATIONSHIP_TAG_PROPOSAL",

                        metadata: {
                            proposalId: proposal.id,
                            tag: proposal.tag,
                            status: proposal.status,
                            senderId,
                            receiverId,
                            message: message ?? null,
                        },
                    },
                });


            // ========================================
            // 6. Return everything
            // ========================================

            return {
                proposal,
                message: chatMessage,
            };
        });
    },

    /**
    * Get received relationship tag proposals.
    *
    * Only PENDING proposals are returned.
    */
    async findReceivedProposals(receiverId: string) {
        return prisma.relationshipTagProposal.findMany({
            where: {
                receiverId,
                status: "PENDING",
            },

            orderBy: {
                createdAt: "desc",
            },

            include: {
                sender: {
                    select: {
                        id: true,
                        full_name: true,
                        birth_date: true,

                        photos: {
                            select: {
                                id: true,
                                media_url: true,
                                media_type: true,
                                order: true,
                            },

                            orderBy: {
                                order: "asc",
                            },

                            take: 1,
                        },
                    },
                },
            },
        });
    },

    /**
     * ----------------------------------------
     * Accept relationship tag proposal
     * ----------------------------------------
     *
     * This method:
     *
     * 1. Creates UserRelationship
     * 2. Updates proposal to ACCEPTED
     *
     * Both happen inside the same transaction.
     */
   async acceptProposal(
  proposalId: string,
  userId: string
) {
  return prisma.$transaction(async (tx) => {

    // =====================================================
    // 1. GET PROPOSAL
    // =====================================================

    const proposal =
      await tx.relationshipTagProposal.findUnique({
        where: {
          id: proposalId,
        },

        include: {
          sender: {
            select: {
              id: true,
              full_name: true,
            },
          },

          receiver: {
            select: {
              id: true,
              full_name: true,
            },
          },
        },
      });

    if (!proposal) {
      throw new Error(
        "Relationship tag proposal not found"
      );
    }

    // =====================================================
    // 2. ONLY RECEIVER CAN ACCEPT
    // =====================================================

    if (proposal.receiverId !== userId) {
      throw new Error(
        "You are not allowed to accept this proposal"
      );
    }

    // =====================================================
    // 3. PROPOSAL MUST BE PENDING
    // =====================================================

    if (proposal.status !== "PENDING") {
      throw new Error(
        "This relationship tag proposal is no longer pending"
      );
    }

    const senderId =
      proposal.senderId; // C

    const receiverId =
      proposal.receiverId; // A

    // =====================================================
    // 4. CHECK C DOES NOT ALREADY HAVE ACTIVE RELATIONSHIP
    // =====================================================

    const senderActiveRelationship =
      await tx.userRelationship.findFirst({
        where: {
          status: "ACTIVE",

          OR: [
            {
              user1Id: senderId,
            },
            {
              user2Id: senderId,
            },
          ],
        },
      });

    if (senderActiveRelationship) {
      throw new Error(
        "Proposal sender already has an active relationship"
      );
    }

    // =====================================================
    // 5. FIND A'S CURRENT ACTIVE RELATIONSHIP
    // =====================================================

    const receiverActiveRelationship =
      await tx.userRelationship.findFirst({
        where: {
          status: "ACTIVE",

          OR: [
            {
              user1Id: receiverId,
            },
            {
              user2Id: receiverId,
            },
          ],
        },

        include: {
          user1: {
            select: {
              id: true,
              full_name: true,
            },
          },

          user2: {
            select: {
              id: true,
              full_name: true,
            },
          },
        },
      });

    // =====================================================
    // 6. IF A ALREADY HAS B -> END A + B
    // =====================================================

    let previousPartner:
      | {
          id: string;
          full_name: string | null;
        }
      | null = null;

    let breakupMessage = null;

    if (receiverActiveRelationship) {

      // ===================================================
      // FIND B
      // ===================================================

      previousPartner =
        receiverActiveRelationship.user1Id ===
        receiverId
          ? receiverActiveRelationship.user2
          : receiverActiveRelationship.user1;

      // ===================================================
      // END A + B RELATIONSHIP
      // ===================================================

      await tx.userRelationship.update({
        where: {
          id: receiverActiveRelationship.id,
        },

        data: {
          status: "ENDED",
          endedAt: new Date(),
        },
      });

      // ===================================================
      // FIND A + B CONVERSATION
      // ===================================================

      const oldConversation =
        await tx.conversation.findFirst({
          where: {
            AND: [
              {
                participants: {
                  some: {
                    userId: receiverId,
                  },
                },
              },

              {
                participants: {
                  some: {
                    userId: previousPartner.id,
                  },
                },
              },
            ],
          },

          select: {
            id: true,
          },
        });

      // ===================================================
      // CREATE DIRECT BREAKUP MESSAGE FOR B
      // ===================================================

      if (oldConversation) {

        breakupMessage =
          await tx.chatMessage.create({
            data: {
              conversationId:
                oldConversation.id,

              // A sends message to old partner B
              senderId: receiverId,

              content:
                `${proposal.receiver.full_name ?? "Your partner"} has ended the relationship.`,

              messageType: "TEXT",
            },
          });
      }
    }

    // =====================================================
    // 7. NORMALIZE NEW A + C IDs
    // =====================================================

    const [user1Id, user2Id] =
      senderId < receiverId
        ? [
            senderId,
            receiverId,
          ]
        : [
            receiverId,
            senderId,
          ];

    // =====================================================
    // 8. CHECK A + C ACTIVE RELATIONSHIP
    // =====================================================

    const existingRelationship =
      await tx.userRelationship.findFirst({
        where: {
          user1Id,
          user2Id,
          status: "ACTIVE",
        },
      });

    if (existingRelationship) {
      throw new Error(
        "You already have an active relationship with this user"
      );
    }

    // =====================================================
    // 9. CREATE NEW A + C RELATIONSHIP
    // =====================================================

    const relationship =
      await tx.userRelationship.create({
        data: {
          user1Id,
          user2Id,

          tag: proposal.tag,

          status: "ACTIVE",

          startedAt: new Date(),

          proposalId: proposal.id,
        },

        include: {
          user1: {
            select: {
              id: true,
              full_name: true,
            },
          },

          user2: {
            select: {
              id: true,
              full_name: true,
            },
          },
        },
      });

    // =====================================================
    // 10. UPDATE PROPOSAL -> ACCEPTED
    // =====================================================

    const updatedProposal =
      await tx.relationshipTagProposal.update({
        where: {
          id: proposal.id,
        },

        data: {
          status: "ACCEPTED",
          respondedAt: new Date(),
        },

        include: {
          sender: {
            select: {
              id: true,
              full_name: true,
            },
          },

          receiver: {
            select: {
              id: true,
              full_name: true,
            },
          },
        },
      });

    // =====================================================
    // 11. CANCEL A'S OTHER PENDING PROPOSALS
    // =====================================================

    await tx.relationshipTagProposal.updateMany({
      where: {
        id: {
          not: proposal.id,
        },

        status: "PENDING",

        OR: [
          {
            senderId: receiverId,
          },
          {
            receiverId: receiverId,
          },
        ],
      },

      data: {
        status: "CANCELLED",
        respondedAt: new Date(),
      },
    });

    // =====================================================
    // 12. FIND A + C CONVERSATION
    // =====================================================

    const conversation =
      await tx.conversation.findFirst({
        where: {
          AND: [
            {
              participants: {
                some: {
                  userId:
                    proposal.senderId,
                },
              },
            },

            {
              participants: {
                some: {
                  userId:
                    proposal.receiverId,
                },
              },
            },
          ],
        },

        select: {
          id: true,
        },
      });

    if (!conversation) {
      throw new Error(
        "Conversation not found between users"
      );
    }

    // =====================================================
    // 13. CREATE EXISTING ACCEPTED MESSAGE
    // =====================================================

    const chatMessage =
      await tx.chatMessage.create({
        data: {
          conversationId:
            conversation.id,

          // A accepted C
          senderId: userId,

          content:
            `Relationship tag "${proposal.tag}" accepted`,

          messageType:
            "RELATIONSHIP_TAG_ACCEPTED",

          metadata: {
            proposalId:
              proposal.id,

            relationshipId:
              relationship.id,

            tag:
              proposal.tag,

            status:
              "ACCEPTED",

            senderId:
              proposal.senderId,

            receiverId:
              proposal.receiverId,
          },
        },
      });

    // =====================================================
    // 14. RETURN SAME DATA + OLD RELATIONSHIP INFO
    // =====================================================

    return {
      relationship,

      proposal:
        updatedProposal,

      message:
        chatMessage,

      previousRelationship:
        receiverActiveRelationship
          ? {
              id:
                receiverActiveRelationship.id,

              status:
                "ENDED",

              partner:
                previousPartner,

              message:
                breakupMessage,
            }
          : null,
    };
  });
},

    async rejectProposal(
        proposalId: string,
        userId: string
    ) {
        return prisma.$transaction(async (tx) => {
            const proposal = await tx.relationshipTagProposal.findUnique({
                where: {
                    id: proposalId,
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            full_name: true,
                        },
                    },
                    receiver: {
                        select: {
                            id: true,
                            full_name: true,
                        },
                    },
                },
            });

            if (!proposal) {
                throw new Error("Relationship tag proposal not found");
            }

            // Only receiver can reject
            if (proposal.receiverId !== userId) {
                throw new Error(
                    "You are not authorized to reject this proposal"
                );
            }

            if (proposal.status !== "PENDING") {
                throw new Error(
                    `Proposal is already ${proposal.status.toLowerCase()}`
                );
            }

            const updatedProposal =
                await tx.relationshipTagProposal.update({
                    where: {
                        id: proposalId,
                    },
                    data: {
                        status: "REJECTED",
                        respondedAt: new Date(),
                    },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                full_name: true,
                            },
                        },
                        receiver: {
                            select: {
                                id: true,
                                full_name: true,
                            },
                        },
                    },
                });

            return updatedProposal;
        });
    },

    async cancelProposal(
        proposalId: string,
        userId: string
    ) {
        return prisma.$transaction(async (tx) => {
            const proposal = await tx.relationshipTagProposal.findUnique({
                where: {
                    id: proposalId,
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            full_name: true,
                        },
                    },
                    receiver: {
                        select: {
                            id: true,
                            full_name: true,
                        },
                    },
                },
            });

            if (!proposal) {
                throw new Error("Relationship tag proposal not found");
            }

            // Only sender can cancel
            if (proposal.senderId !== userId) {
                throw new Error(
                    "You are not authorized to cancel this proposal"
                );
            }

            if (proposal.status !== "PENDING") {
                throw new Error(
                    `Proposal is already ${proposal.status.toLowerCase()}`
                );
            }

            const updatedProposal =
                await tx.relationshipTagProposal.update({
                    where: {
                        id: proposalId,
                    },
                    data: {
                        status: "CANCELLED",
                        respondedAt: new Date(),
                    },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                full_name: true,
                            },
                        },
                        receiver: {
                            select: {
                                id: true,
                                full_name: true,
                            },
                        },
                    },
                });

            return updatedProposal;
        });
    },

};

// end relationship.repository.ts

export const findRelationshipByIdRepository = async (
  relationshipId: string,
) => {
  return prisma.userRelationship.findUnique({
    where: {
      id: relationshipId,
    },
  });
};

export const endRelationshipRepository = async (
  relationshipId: string,
) => {
  return prisma.userRelationship.update({
    where: {
      id: relationshipId,
    },
    data: {
      status: UserRelationshipStatus.ENDED,
      endedAt: new Date(),
    },
    include: {
      user1: {
        select: {
          id: true,
          full_name: true,
          photos: {
            orderBy: {
              created_at: "asc",
            },
            take: 1,
            select: {
              id: true,
              media_url: true,
            },
          },
        },
      },

      user2: {
        select: {
          id: true,
          full_name: true,
          photos: {
            orderBy: {
              created_at: "asc",
            },
            take: 1,
            select: {
              id: true,
              media_url: true,
            },
          },
        },
      },
    },
  });
};