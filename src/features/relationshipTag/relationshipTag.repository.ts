import { PrismaClient } from "@prisma/client";

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
                        photos: {
                            select: {
                                id: true,
                                url: true,
                                is_primary: true,
                            },
                            orderBy: {
                                is_primary: "desc",
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
            /**
             * ----------------------------------------
             * 1. Get proposal
             * ----------------------------------------
             */
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

            /**
             * ----------------------------------------
             * 2. Make sure logged-in user is receiver
             * ----------------------------------------
             */
            if (proposal.receiverId !== userId) {
                throw new Error(
                    "You are not allowed to accept this proposal"
                );
            }

            /**
             * ----------------------------------------
             * 3. Make sure proposal is still pending
             * ----------------------------------------
             */
            if (proposal.status !== "PENDING") {
                throw new Error(
                    "This relationship tag proposal is no longer pending"
                );
            }

            /**
             * ----------------------------------------
             * 4. Normalize user IDs
             *
             * Always store the smaller UUID in user1Id.
             *
             * A -> B
             * B -> A
             *
             * both become the same pair.
             * ----------------------------------------
             */
            const [user1Id, user2Id] =
                proposal.senderId < proposal.receiverId
                    ? [
                        proposal.senderId,
                        proposal.receiverId,
                    ]
                    : [
                        proposal.receiverId,
                        proposal.senderId,
                    ];

            /**
             * ----------------------------------------
             * 5. Check active relationship
             * ----------------------------------------
             */
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

            /**
             * ----------------------------------------
             * 6. Create relationship
             * ----------------------------------------
             */
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

            // ========================================
            // 7. Update proposal
            // ========================================

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


            // ========================================
            // 8. Find conversation
            // ========================================

            const conversation =
                await tx.conversation.findFirst({
                    where: {
                        AND: [
                            {
                                participants: {
                                    some: {
                                        userId: proposal.senderId,
                                    },
                                },
                            },

                            {
                                participants: {
                                    some: {
                                        userId: proposal.receiverId,
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
            // 9. Create ACCEPTED chat message
            // ========================================

            const chatMessage =
                await tx.chatMessage.create({
                    data: {
                        conversationId: conversation.id,

                        // Receiver accepted the proposal
                        senderId: userId,

                        content:
                            `Relationship tag "${proposal.tag}" accepted`,

                        messageType:
                            "RELATIONSHIP_TAG_ACCEPTED",

                        metadata: {
                            proposalId: proposal.id,

                            relationshipId:
                                relationship.id,

                            tag: proposal.tag,

                            status: "ACCEPTED",

                            senderId:
                                proposal.senderId,

                            receiverId:
                                proposal.receiverId,
                        },
                    },
                });


            // ========================================
            // 10. Return everything
            // ========================================

            return {
                relationship,

                proposal: updatedProposal,

                message: chatMessage,
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