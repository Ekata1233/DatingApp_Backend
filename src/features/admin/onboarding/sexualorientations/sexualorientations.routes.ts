import { Router } from "express";
import { create, getAll, remove } from "./sexualorientations.controller";

const router = Router();

router.post("/create", create);

/**
 * @swagger
 * /api/sexual-orientation/get-all:
 *   get:
 *     summary: Get all sexual orientation onboarding options
 *     tags: [Dynamic Onboarding Data]
 *     description: Fetches a list of all sexual orientation onboarding options available in the system.
 *     responses:
 *       200:
 *         description: Sexual orientation options fetched successfully
 */
router.get("/get-all", getAll);
router.delete("/delete", remove);

export default router;
