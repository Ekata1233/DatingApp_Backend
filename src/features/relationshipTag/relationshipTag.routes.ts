import { Router } from "express";
import { relationshipTagController } from "./relationshipTag.controller";
import authMiddleware from "../../middleware/auth.middleware";

const router = Router();

/**
 * Send relationship tag proposal
 *
 * POST /api/relationship-tags/proposals
 */
router.post(
  "/relationship-tags/create-proposals",
  authMiddleware,
  relationshipTagController.createProposal
);

/**
 * Get received relationship tag proposals
 *
 * GET /api/relationship-tags/proposals/received
 */
router.get(
  "/relationship-tags/received-proposals",
  authMiddleware,
  relationshipTagController.getReceivedProposals
);

/**
 * POST
 * /api/relationship-tags/proposals/:proposalId/accept
 */
router.post(
  "/relationship-tags/proposals/:proposalId/accept",
  authMiddleware,
  relationshipTagController.acceptProposal
);

router.post(
  "/relationship-tags/proposals/:proposalId/reject",
  authMiddleware,
  relationshipTagController.rejectProposal
);

router.post(
  "/relationship-tags/proposals/:proposalId/cancel",
  authMiddleware,
  relationshipTagController.cancelProposal
);

export default router;