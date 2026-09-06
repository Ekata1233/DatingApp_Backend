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
  "/proposals",
  authMiddleware,
  relationshipTagController.createProposal
);

/**
 * Get received relationship tag proposals
 *
 * GET /api/relationship-tags/proposals/received
 */
router.get(
  "/proposals/received",
  authMiddleware,
  relationshipTagController.getReceivedProposals
);

/**
 * POST
 * /api/relationship-tags/proposals/:proposalId/accept
 */
router.post(
  "/proposals/:proposalId/accept",
  authMiddleware,
  relationshipTagController.acceptProposal
);

router.post(
  "/proposals/:proposalId/reject",
  authMiddleware,
  relationshipTagController.rejectProposal
);

router.post(
  "/proposals/:proposalId/cancel",
  authMiddleware,
  relationshipTagController.cancelProposal
);

export default router;