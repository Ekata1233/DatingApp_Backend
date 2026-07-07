import { Router } from "express";
import {
  create,
  getAll,
  remove,
} from "./intention.controller";

const router = Router();

// Create OR Update (Single API)
router.post("/create", create);
router.get("/get-all", getAll);

// Get
/**
 * @swagger
 * /api/onboarding/intention/get:
 *   get:
 *     summary: Get all intention onboarding options
 *     tags: [Onboarding Dynamic Data]
 *     x-sort-order: 1
 *     description: Fetches a list of all intention onboarding options available in the system.
 *     responses:
 *       200:
 *         description: Intention options fetched successfully
 */
router.get("/intention/get", getAll);

// Delete
router.delete("/delete", remove);

export default router;