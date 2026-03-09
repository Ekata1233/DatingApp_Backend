import { Router } from "express";
import { create, getAll, remove } from "./gender.controller";

const router = Router();
router.post("/create", create);
/**
 * @swagger
 * /api/gender/get-all:
 *   get:
 *     summary: Get all gender onboarding options
 *     tags: [Dynamic Onboarding Data]
 *     description: Fetches a list of all gender onboarding options available in the system.
 *     responses:
 *       200:
 *         description: Gender options fetched successfully
 */
router.get("/get-all", getAll);
router.delete("/delete", remove);

export default router;