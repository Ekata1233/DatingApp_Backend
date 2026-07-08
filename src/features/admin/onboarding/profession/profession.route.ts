import { Router } from "express";

import {
  create,
  update,
  getAll,
  getOne,
  remove,
  getActive,
} from "./profession.controller";

const router = Router();

router.post("/profession/create", create);
router.put("/profession/update/:id", update);
router.get("/profession/get-all", getAll);
router.get("/profession/get/:id", getOne);
router.delete("/profession/remove/:id", remove);

// Get
/**
 * @swagger
 * /api/onboarding/professions/get:
 *   get:
 *     summary: Get all profession onboarding options
 *     tags: [Onboarding Dynamic Data]
 *     x-sort-order: 3
 *     description: Fetches a list of all profession onboarding options available in the system.
 *     responses:
 *       200:
 *         description: Profession options fetched successfully
 */
router.get("/professions/get", getActive);

export default router;