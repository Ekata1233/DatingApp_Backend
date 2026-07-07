export interface IAmbition {
  title: string;
  isActive: boolean;
}import { Router } from "express";

import {
  create,
  update,
  getAll,
  getActive,
  getOne,
  remove,
} from "./ambition.controller";

const router = Router();

/**
 * Admin
 */
router.post("/ambitions/create", create);
router.put("/ambitions/update/:id", update);
router.get("/ambitions/get-all", getAll);
router.get("/ambitions/get-one/:id", getOne);
router.delete("/ambitions/remove/:id", remove);

// Get
/**
 * @swagger
 * /api/onboarding/ambitions/get:
 *   get:
 *     summary: Get all ambition onboarding options
 *     tags: [Onboarding Dynamic Data]
 *     x-sort-order: 7
 *     description: Fetches a list of all ambition onboarding options available in the system.
 *     responses:
 *       200:
 *         description: Ambition options fetched successfully
 */
router.get("/ambitions/get", getActive);
export default router;