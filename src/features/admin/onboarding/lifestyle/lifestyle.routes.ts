import { Router } from "express";
import { create, getAll } from "./lifestyle.controller";

const router = Router();

router.post("/create", create);

/**
 * @swagger
 * /api/question/fetch?category=DATING&screen=LIFESTYLE:
 *   get:
 *     summary: Get all lifestyle onboarding options
 *     tags: [Onboarding Dynamic Data]
 *     x-sort-order: 1
 *     description: Fetches a list of all lifestyle onboarding options available in the system.
 *     responses:
 *       200:
 *         description: Lifestyle question options fetched successfully
 */

/**
 * @swagger
 * /api/question/fetch?category=DATING&screen=THINGS_U_LOVE:
 *   get:
 *     summary: Get all Interests onboarding options
 *     tags: [Onboarding Dynamic Data]
 *     x-sort-order: 8
 *     description: Fetches a list of all Interest onboarding options available in the system.
 *     responses:
 *       200:
 *         description: Interest question options fetched successfully
 */
router.get("/get-all", getAll);
// router.delete("/delete", remove);

export default router;

