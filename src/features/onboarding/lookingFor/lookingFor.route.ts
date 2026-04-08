import { Router } from "express";
import { create, getAll } from "./lookingFor.controller";

const router = Router();

router.post("/create", create);

/**
 * @swagger
 * /api/lookingForRoutes/get-all:
 *   get:
 *     summary: Get all looking for onboarding options
 *     tags: [Dynamic Onboarding Data]
 *     description: Fetches a list of all looking for onboarding options available in the system.
 *     responses:
 *       200:
 *         description: Looking for options fetched successfully
 */
router.get("/get-all", getAll);

export default router;
