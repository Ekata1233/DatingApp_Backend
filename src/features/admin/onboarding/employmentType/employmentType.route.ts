import { Router } from "express";

import {
  create,
  update,
  getAll,
  getOne,
  remove,
  getActive,
} from "./employmentType.controller";

const router = Router();

router.post("/employment-type/create", create);
router.put("/employment-type/update/:id", update);
router.get("/employment-type/get-all", getAll);

// Get
/**
 * @swagger
 * /api/onboarding/employment-type/get:
 *   get:
 *     summary: Get all employment type onboarding options
 *     tags: [Onboarding Dynamic Data]
 *     x-sort-order: 5
 *     description: Fetches a list of all employment type onboarding options available in the system.
 *     responses:
 *       200:
 *         description: Employment type options fetched successfully
 */
router.get("/employment-type/get", getActive);
router.get("/employment-type/get/:id", getOne);
router.delete("/employment-type/remove/:id", remove);

export default router;