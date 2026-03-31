import { Router } from "express";
import { create, getAll } from "./thingsYouLove.controller";

const router = Router();

router.post("/create", create);      // Create / Replace

/**
 * @swagger
 * /api/thingsYouLove/get-all:
 *   get:
 *     summary: Get all things you love onboarding options
 *     tags: [Dynamic Onboarding Data]
 *     description: Fetches a list of all things you love onboarding options available in the system.
 *     responses:
 *       200:
 *         description: Things you love options fetched successfully
 */
router.get("/get-all", getAll);       // Get single document
// router.delete("/remove", remove);    // Delete

export default router;
