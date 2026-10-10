import { Request, Response } from "express";
import {
  acceptRelationshipProposalService,
  endRelationshipService,
  getCommitmentManagementService,
  relationshipTagService,
} from "./relationshipTag.service";
import { getIO } from "../../config/socket";
import { relationshipTagSchema } from "./relationshipTag.validation";

export const relationshipTagController = {
  async createProposal(req: Request, res: Response) {
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

      const validation = relationshipTagSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.error.flatten(),
        });
      }

      const { receiverId, tag, message } = validation.data;

      // ========================================
      // Create proposal + chat message
      // ========================================

      const result = await relationshipTagService.createProposal(senderId, {
        receiverId,
        tag,
        message,
      });

      // ========================================
      // SOCKET.IO
      // ========================================

      const io = getIO();

      // Send to receiver
      io.to(`user:${receiverId}`).emit("message:receive", result.message);

      // Send to sender also
      io.to(`user:${senderId}`).emit("message:receive", result.message);
      /**
       * ----------------------------------------
       * Success response
       * ----------------------------------------
       */
      return res.status(201).json({
        success: true,
        message: "Relationship tag proposal sent successfully",
        data: result.proposal,
      });
    } catch (error: any) {
      console.error("CREATE PROPOSAL ERROR:", {
        message: error?.message,
        code: error?.code,
        meta: error?.meta,
      });

      const errorMessages: Record<string, string> = {
        "Conversation not found between users":
          "You need to start a conversation with this user before sending a relationship proposal.",

        "You cannot send a relationship tag proposal to yourself":
          "You cannot send a relationship proposal to yourself.",

        "User not found": "The selected user could not be found.",

        "Receiver not found": "The selected user could not be found.",

        "Sender user not found": "Your account could not be found.",

        "This user is no longer available": "This user is no longer available.",

        "You already have an active relationship with this user":
          "You are already in a relationship with this user.",

        "A relationship tag proposal is already pending between you and this user":
          "You have already sent or received a pending relationship proposal with this user.",

        "A pending relationship tag proposal already exists":
          "A relationship proposal is already pending between you and this user.",
      };

      const message = errorMessages[error?.message];

      return res.status(message ? 400 : 500).json({
        success: false,
        message:
          message ??
          "Something went wrong while sending your relationship proposal. Please try again.",
      });
    }
  },

  /**
   * GET /api/relationship-tags/proposals/received
   */
  async getReceivedProposals(req: Request, res: Response) {
    try {
      /**
       * ----------------------------------------
       * Get authenticated user
       * ----------------------------------------
       */
      const userId = (req as any).user?.id;

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
        await relationshipTagService.getReceivedProposals(userId);

      /**
       * ----------------------------------------
       * Success
       * ----------------------------------------
       */
      return res.status(200).json({
        success: true,
        message: "Relationship tag proposals fetched successfully",
        data: proposals,
      });
    } catch (error: any) {
      console.error("getReceivedProposalsController error:", error);

      if (error.message === "User not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to fetch relationship tag proposals",
      });
    }
  },

  /**
   * POST
   * /api/relationship-tags/proposals/:proposalId/accept
   */
  //   async acceptProposal(req: Request, res: Response) {
  //     try {
  //       // =====================================================
  //       // GET LOGGED-IN USER
  //       // =====================================================

  //       const userId = (req as any).user?.id;

  //       if (!userId) {
  //         return res.status(401).json({
  //           success: false,
  //           message: "Unauthorized",
  //         });
  //       }

  //       // =====================================================
  //       // GET PROPOSAL ID
  //       // =====================================================

  //       const { proposalId } = (req as any).params;

  //       if (!proposalId) {
  //         return res.status(400).json({
  //           success: false,
  //           message: "Proposal ID is required",
  //         });
  //       }

  //       // =====================================================
  //       // ACCEPT PROPOSAL
  //       // =====================================================

  //       const result = await relationshipTagService.acceptProposal(
  //         proposalId,
  //         userId,
  //       );

  //       // =====================================================
  //       // SUCCESS RESPONSE
  //       // =====================================================

  //       return res.status(200).json({
  //         success: true,

  //         message: "Relationship tag proposal accepted successfully",

  //         data: {
  //           // =============================================
  //           // NEW ACTIVE RELATIONSHIP
  //           // =============================================

  //           id: result.id,

  //           tag: result.tag,

  //           status: result.status,

  //           startedAt: result.startedAt,

  //           // =============================================
  //           // NEW PARTNER
  //           // =============================================

  //           partner: result.partner,

  //           // =============================================
  //           // ACCEPTED PROPOSAL
  //           // =============================================

  //           proposal: result.proposal,

  //           // =============================================
  //           // OLD ENDED RELATIONSHIP
  //           // =============================================

  //           endedRelationship: result.endedRelationship,

  //           // =============================================
  //           // MESSAGE FOR NEW PARTNER
  //           // =============================================

  //           acceptedMessage: result.acceptedMessage,
  //         },
  //       });
  //     } catch (error: any) {
  //       console.error("ACCEPT RELATIONSHIP TAG PROPOSAL ERROR:", error);

  //       // =====================================================
  //       // BUSINESS ERRORS
  //       // =====================================================

  //       const businessErrors = [
  //         "Relationship tag proposal not found",

  //         "You are not allowed to accept this proposal",

  //         "This relationship tag proposal is no longer pending",

  //         "You already have an active relationship with this user",

  //         "Proposal sender already has an active relationship",

  //         "Conversation not found between users",
  //       ];

  //       if (businessErrors.includes(error.message)) {
  //         return res.status(400).json({
  //           success: false,
  //           message: error.message,
  //         });
  //       }

  //       // =====================================================
  //       // INTERNAL SERVER ERROR
  //       // =====================================================

  //       return res.status(500).json({
  //         success: false,

  //         message:
  //           "Something went wrong while accepting relationship tag proposal",
  //       });
  //     }
  //   },

  async acceptProposal(req: Request, res: Response) {
    try {
      // ============================================
      // 1. GET LOGGED-IN USER
      // ============================================

      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // ============================================
      // 2. GET PROPOSAL ID
      // ============================================

      const { proposalId } = (req as any).params;

      if (!proposalId) {
        return res.status(400).json({
          success: false,
          message: "Proposal ID is required",
        });
      }

      // ============================================
      // 3. ACCEPT PROPOSAL
      // ============================================

      const result = await relationshipTagService.acceptProposal(
        proposalId,
        userId,
      );

      // ============================================
      // 4. SOCKET.IO REAL-TIME MESSAGES
      // ============================================

      try {
        const io = getIO();

        // ========================================
        // A. NEW RELATIONSHIP ACCEPTED MESSAGE
        // ========================================

        if (result.acceptedMessage) {
          const newPartnerId = result.partner.id;

          // Send to new partner C
          io.to(`user:${newPartnerId}`).emit(
            "message:receive",
            result.acceptedMessage,
          );

          // Send to current user A
          io.to(`user:${userId}`).emit(
            "message:receive",
            result.acceptedMessage,
          );

          console.log("Relationship accepted socket sent:", {
            senderId: userId,
            receiverId: newPartnerId,
            messageId: result.acceptedMessage.id,
          });
        }
        // =====================================================
        // B. OLD RELATIONSHIP ENDED MESSAGE
        // =====================================================

        const endedRelationship = result.endedRelationship;

        if (
          endedRelationship &&
          endedRelationship.user &&
          endedRelationship.message
        ) {
          const oldPartnerId = endedRelationship.user.id;
          const breakupMessage = endedRelationship.message;

          // =====================================================
          // BUILD SOCKET PAYLOAD WITH FLUTTER SCREEN DATA
          // =====================================================

          const breakupSocketPayload = {
            ...breakupMessage,

            // Keep existing chat message fields
            messageType: breakupMessage.messageType,

            // New relationship-ended screen data
            relationshipEndedScreen: result.relationshipEndedScreen ?? null,
          };

          // =====================================================
          // SEND TO OLD PARTNER B
          // =====================================================

          io.to(`user:${oldPartnerId}`).emit(
            "message:receive",
            breakupSocketPayload,
          );

          // =====================================================
          // SEND TO CURRENT USER A
          // =====================================================

          io.to(`user:${userId}`).emit("message:receive", breakupSocketPayload);
        }
      } catch (socketError) {
        // Socket failure should not change
        // successful database transaction response

        console.error("Relationship socket emission error:", socketError);
      }

      // ============================================
      // 5. SUCCESS RESPONSE
      // ============================================

      return res.status(200).json({
        success: true,

        message: "Relationship tag proposal accepted successfully",

        data: {
          id: result.id,
          tag: result.tag,
          status: result.status,
          startedAt: result.startedAt,
          partner: result.partner,
          proposal: result.proposal,
          endedRelationship: result.endedRelationship,
          acceptedMessage: result.acceptedMessage,
          relationshipEndedScreen: result.relationshipEndedScreen,
        },
      });
    } catch (error: any) {
      console.error("ACCEPT RELATIONSHIP TAG PROPOSAL ERROR:", error);

      // ============================================
      // BUSINESS ERRORS
      // ============================================

      const businessErrors = [
        "Relationship tag proposal not found",

        "You are not allowed to accept this proposal",

        "This relationship tag proposal is no longer pending",

        "You already have an active relationship with this user",

        "Proposal sender already has an active relationship",

        "Conversation not found between users",
      ];

      if (businessErrors.includes(error.message)) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      // ============================================
      // INTERNAL SERVER ERROR
      // ============================================

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while accepting relationship tag proposal",
      });
    }
  },

  async rejectProposal(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { proposalId } = req.params as {
        proposalId: string;
      };
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

      const result = await relationshipTagService.rejectProposal(
        proposalId,
        userId,
      );

      return res.status(200).json({
        success: true,
        message: "Relationship tag proposal rejected successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("rejectProposalController error:", error);

      const message = error?.message || "Failed to reject proposal";

      if (message === "Relationship tag proposal not found") {
        return res.status(404).json({
          success: false,
          message,
        });
      }

      if (
        message === "You are not authorized to reject this proposal" ||
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

  async cancelProposal(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { proposalId } = req.params as {
        proposalId: string;
      };

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

      const result = await relationshipTagService.cancelProposal(
        proposalId,
        userId,
      );

      return res.status(200).json({
        success: true,
        message: "Relationship tag proposal cancelled successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("cancelProposalController error:", error);

      const message = error?.message || "Failed to cancel proposal";

      if (message === "Relationship tag proposal not found") {
        return res.status(404).json({
          success: false,
          message,
        });
      }

      if (
        message === "You are not authorized to cancel this proposal" ||
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

// relationship.controller.ts

export const getCommitmentManagementController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user.id;

    const result = await getCommitmentManagementService(userId);

    return res.status(200).json({
      success: true,
      message: "Commitment details fetched successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("GET COMMITMENT MANAGEMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch commitment details",
    });
  }
};

// relationship.controller.ts

export const endRelationshipController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user.id;

    const relationshipId = String(req.params.relationshipId);

    const relationship = await endRelationshipService(userId, relationshipId);

    return res.status(200).json({
      success: true,
      message: "Relationship ended successfully",
      data: relationship,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to end relationship",
    });
  }
};

/* =========================================================
   ACCEPT RELATIONSHIP PROPOSAL
========================================================= */

export const acceptRelationshipProposalController = async (
  req: Request,
  res: Response,
) => {
  try {
    // =====================================================
    // 1. GET LOGGED-IN USER
    // =====================================================

    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    // =====================================================
    // 2. GET PROPOSAL ID
    // =====================================================

    const { proposalId } = (req as any).params;

    if (!proposalId) {
      return res.status(400).json({
        success: false,
        message: "Relationship proposal ID is required.",
      });
    }

    // =====================================================
    // 3. ACCEPT PROPOSAL
    // =====================================================

    const result = await acceptRelationshipProposalService(userId, proposalId);

    // =====================================================
    // 4. SUCCESS RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,
      message: result.message,

      data: {
        previousRelationship: result.previousRelationship,

        currentRelationship: result.currentRelationship,
      },
    });
  } catch (error: any) {
    console.error("ACCEPT RELATIONSHIP PROPOSAL ERROR:", error);

    // =====================================================
    // PROPOSAL NOT FOUND
    // =====================================================

    if (error.message === "RELATIONSHIP_PROPOSAL_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Relationship request not found.",
      });
    }

    // =====================================================
    // UNAUTHORIZED
    // =====================================================

    if (error.message === "NOT_AUTHORIZED_TO_ACCEPT_PROPOSAL") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to accept this relationship request.",
      });
    }

    // =====================================================
    // ALREADY ACCEPTED / REJECTED / CANCELLED
    // =====================================================

    if (error.message === "RELATIONSHIP_PROPOSAL_ALREADY_RESPONDED") {
      return res.status(409).json({
        success: false,
        message: "This relationship request has already been responded to.",
      });
    }

    // =====================================================
    // SENDER ALREADY IN RELATIONSHIP
    // =====================================================

    if (error.message === "PROPOSAL_SENDER_ALREADY_IN_RELATIONSHIP") {
      return res.status(409).json({
        success: false,
        message:
          "The user who sent this request is already in an active relationship.",
      });
    }

    // =====================================================
    // USER ID REQUIRED
    // =====================================================

    if (error.message === "USER_ID_REQUIRED") {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    // =====================================================
    // PROPOSAL ID REQUIRED
    // =====================================================

    if (error.message === "PROPOSAL_ID_REQUIRED") {
      return res.status(400).json({
        success: false,
        message: "Relationship proposal ID is required.",
      });
    }

    // =====================================================
    // PRISMA UNIQUE CONSTRAINT
    // =====================================================

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "An active relationship already exists.",
      });
    }

    // =====================================================
    // INTERNAL SERVER ERROR
    // =====================================================

    return res.status(500).json({
      success: false,
      message: "Failed to accept relationship request.",
    });
  }
};
