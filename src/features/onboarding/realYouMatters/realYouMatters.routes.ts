import { Router } from "express";
import { create, getAll, remove } from "./realYouMatters.controller";

const router = Router();

router.post("/create", create);      // Create / Replace

/**
 * @swagger
 * /api/realYouMatters/get-all:
 *   get:
 *     summary: Get all real you matters onboarding options
 *     tags: [Dynamic Onboarding Data]
 *     description: Fetches a list of all real you matters onboarding options available in the system.
 *     responses:
 *       200:
 *         description: Real you matters options fetched successfully
 */
router.get("/get-all", getAll);       // Get single document
router.delete("/remove", remove);    // Delete

export default router;
