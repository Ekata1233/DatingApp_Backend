import { Request, Response } from "express";
import { relationshipTagService } from "./relationshipTag.service";
import { relationshipTagSchema } from "./relationshipTag.schema";
import { getIO } from "../../config/socket";

export const relationshipTagController = {

    async createProposal(
        req: Request,
        res: Response
    ) {
        try {
            /**
             * ----------------------------------------
             * Get authenticated user ID
             * ----------------------------------------
             */
            const senderId = (req as any).user?.id;

            if (!senderId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }

            // ========================================
            // Validate request
            // ========================================

            const validation =
                relationshipTagSchema.safeParse(req.body);

            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    errors: validation.error.flatten(),
                });
            }


            const {
                receiverId,
                tag,
                message,
            } = validation.data;

            // ========================================
            // Create proposal + chat message
            // ========================================

            const result =
                await relationshipTagService.createProposal(
                    senderId,
                    {
                        receiverId,
                        tag,
                        message,
                    }
                );

            // ========================================
            // SOCKET.IO
            // ========================================

            const io = getIO();


            // Send to receiver
            io.to(`user:${receiverId}`).emit(
                "message:receive",
                result.message
            );


            // Send to sender also
            io.to(`user:${senderId}`).emit(
                "message:receive",
                result.message
            );
            /**
             * ----------------------------------------
             * Success response
             * ----------------------------------------
             */
            return res.status(201).json({
                success: true,
                message: "Relationship tag proposal sent successfully",
                data: proposal,
            });
        } catch (error: any) {
            console.error(
                "createRelationshipTagProposalController error:",
                error
            );

            /**
             * ----------------------------------------
             * Business errors
             * ----------------------------------------
             */
            const businessErrors = [
                "You cannot send a relationship tag proposal to yourself",
                "User not found",
                "Sender user not found",
                "This user is no longer available",
                "You already have an active relationship with this user",
                "A relationship tag proposal is already pending between you and this user",
            ];

            if (businessErrors.includes(error.message)) {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }

            /**
             * ----------------------------------------
             * Unknown server error
             * ----------------------------------------
             */
            return res.status(500).json({
                success: false,
                message: "Failed to send relationship tag proposal",
            });
        }
    },

    /**
     * GET /api/relationship-tags/proposals/received
     */
    async getReceivedProposals(
        req: Request,
        res: Response
    ) {
        try {
            /**
             * ----------------------------------------
             * Get authenticated user
             * ----------------------------------------
             */
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }

            /**
             * ----------------------------------------
             * Get received proposals
             * ----------------------------------------
             */
            const proposals =
                await relationshipTagService.getReceivedProposals(
                    userId
                );

            /**
             * ----------------------------------------
             * Success
             * ----------------------------------------
             */
            return res.status(200).json({
                success: true,
                message:
                    "Relationship tag proposals fetched successfully",
                data: proposals,
            });
        } catch (error: any) {
            console.error(
                "getReceivedProposalsController error:",
                error
            );

            if (error.message === "User not found") {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }

            return res.status(500).json({
                success: false,
                message:
                    "Failed to fetch relationship tag proposals",
            });
        }
    },

    /**
     * POST
     * /api/relationship-tags/proposals/:proposalId/accept
     */
    async acceptProposal(
        req: Request,
        res: Response
    ) {
        try {
            /**
             * ----------------------------------------
             * Get authenticated user
             * ----------------------------------------
             */
            const userId = (req as any).user?.id;

            const { proposalId } = req.params;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }

            // ========================================
            // Validate proposal ID
            // ========================================

            if (!proposalId) {
                return res.status(400).json({
                    success: false,
                    message: "Proposal ID is required",
                });
            }

            // ========================================
            // Accept proposal
            // ========================================

            const result =
                await relationshipTagService.acceptProposal(
                    proposalId,
                    userId
                );


            // ========================================
            // SOCKET.IO
            // ========================================

            const io = getIO();


            // Sender + receiver
            const senderId =
                result.message.metadata &&
                    typeof result.message.metadata === "object"
                    ? (result.message.metadata as any).senderId
                    : null;

            const receiverId =
                result.message.metadata &&
                    typeof result.message.metadata === "object"
                    ? (result.message.metadata as any).receiverId
                    : null;


            // ========================================
            // Emit to sender
            // ========================================

            if (senderId) {
                io.to(`user:${senderId}`).emit(
                    "message:receive",
                    result.message
                );
            }


            // ========================================
            // Emit to receiver
            // ========================================

            if (receiverId) {
                io.to(`user:${receiverId}`).emit(
                    "message:receive",
                    result.message
                );
            }


            // ========================================
            // Response
            // ========================================

            return res.status(200).json({
                success: true,

                message:
                    "Relationship tag proposal accepted successfully",

                data: {
                    id: result.id,

                    tag: result.tag,

                    status: result.status,

                    startedAt: result.startedAt,

                    partner: result.partner,

                    proposal: result.proposal,
                },
            });
        } catch (error: any) {
            console.error(
                "acceptRelationshipTagProposalController error:",
                error
            );

            const businessErrors = [
                "Relationship tag proposal not found",
                "You are not allowed to accept this proposal",
                "This relationship tag proposal is no longer pending",
                "You already have an active relationship with this user",
            ];

            if (businessErrors.includes(error.message)) {
                let statusCode = 400;

                if (
                    error.message ===
                    "Relationship tag proposal not found"
                ) {
                    statusCode = 404;
                }

                return res.status(statusCode).json({
                    success: false,
                    message: error.message,
                });
            }

            return res.status(500).json({
                success: false,
                message:
                    "Failed to accept relationship tag proposal",
            });
        }
    },

    async rejectProposal(
        req: Request,
        res: Response
    ) {
        try {
            const userId = req.user?.id;
            const { proposalId } = req.params;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }

            if (!proposalId) {
                return res.status(400).json({
                    success: false,
                    message: "Proposal ID is required",
                });
            }

            const result =
                await relationshipTagService.rejectProposal(
                    proposalId,
                    userId
                );

            return res.status(200).json({
                success: true,
                message: "Relationship tag proposal rejected successfully",
                data: result,
            });
        } catch (error: any) {
            console.error(
                "rejectProposalController error:",
                error
            );

            const message = error?.message || "Failed to reject proposal";

            if (
                message === "Relationship tag proposal not found"
            ) {
                return res.status(404).json({
                    success: false,
                    message,
                });
            }

            if (
                message ===
                "You are not authorized to reject this proposal" ||
                message.startsWith("Proposal is already")
            ) {
                return res.status(400).json({
                    success: false,
                    message,
                });
            }

            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    },


    async cancelProposal(
        req: Request,
        res: Response
    ) {
        try {
            const userId = req.user?.id;
            const { proposalId } = req.params;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }

            if (!proposalId) {
                return res.status(400).json({
                    success: false,
                    message: "Proposal ID is required",
                });
            }

            const result =
                await relationshipTagService.cancelProposal(
                    proposalId,
                    userId
                );

            return res.status(200).json({
                success: true,
                message: "Relationship tag proposal cancelled successfully",
                data: result,
            });
        } catch (error: any) {
            console.error(
                "cancelProposalController error:",
                error
            );

            const message = error?.message || "Failed to cancel proposal";

            if (
                message === "Relationship tag proposal not found"
            ) {
                return res.status(404).json({
                    success: false,
                    message,
                });
            }

            if (
                message ===
                "You are not authorized to cancel this proposal" ||
                message.startsWith("Proposal is already")
            ) {
                return res.status(400).json({
                    success: false,
                    message,
                });
            }

            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    },


};