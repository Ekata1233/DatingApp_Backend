import { Router } from "express";
import {
  create,
  getAll,
  remove,
} from "./intention.controller";

const router = Router();

/**
 * @swagger
 * /api/onboarding/intention/create:
 *   post:
 *     summary: Create or update intention
 *     tags: [Onboarding Dynamic Data]
 *     x-sort-order: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               value:
 *                 type: string
 *     responses:
 *       200:
 *         description: Intention created successfully
 *       400:
 *         description: Bad request
 */
router.post("/create", create);

/**
 * @swagger
 * /api/onboarding/intention/get:
 *   get:
 *     summary: Get all intention onboarding options
 *     tags: [Onboarding Dynamic Data]
 *     x-sort-order: 2
 *     description: Fetches a list of all intention onboarding options available in the system.
 *     responses:
 *       200:
 *         description: Intention options fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       value:
 *                         type: string
 */
router.get("/intention/get", getAll);

/**
 * @swagger
 * /api/onboarding/intention/delete:
 *   delete:
 *     summary: Delete an intention
 *     tags: [Onboarding Dynamic Data]
 *     x-sort-order: 3
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Intention deleted successfully
 *       404:
 *         description: Intention not found
 */
router.delete("/delete", remove);

export default router;