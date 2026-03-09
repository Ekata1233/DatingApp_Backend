import { Router } from "express";
import { create, getAll, remove } from "./lifestyle.controller";

const router = Router();

router.post("/create", create);

/**
 * @swagger
 * /api/lifestyle/get-all:
 *   get:
 *     summary: Get all lifestyle onboarding options
 *     tags: [Dynamic Onboarding Data]
 *     description: Fetches a list of all lifestyle onboarding options available in the system.
 *     responses:
 *       200:
 *         description: Lifestyle options fetched successfully
 */
router.get("/get-all", getAll);
router.delete("/delete", remove);

export default router;

