import { Router } from "express";
import { create, getAll } from "./interestedIn.controller";

const router = Router();

router.post("/create", create);

/**
 * @swagger
 * /api/interested-in/get-all:
 *   get:
 *     summary: Get all interested-in onboarding options
 *     tags: [Dynamic Onboarding Data]
 *     description: Fetches a list of all interested-in onboarding options available in the system.
 *     responses:
 *       200:
 *         description: Interested-in options fetched successfully
 */
router.get("/get-all", getAll);
router.get("/interested-in/get", getAll);

export default router;
