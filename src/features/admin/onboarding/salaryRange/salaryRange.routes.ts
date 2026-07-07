import { Router } from "express";

import {
  create,
  update,
  getAll,
  getActive,
  getOne,
  remove,
} from "./salaryRange.controller";

const router = Router();

/**
 * Admin Routes
 */
router.post("/salary-ranges/create", create);
router.put("/salary-ranges/update/:id", update);
router.get("/salary-ranges/get-all", getAll);
router.get("/salary-ranges/get-one/:id", getOne);
router.delete("/salary-ranges/remove/:id", remove);

// Get
/**
 * @swagger
 * /api/onboarding/salary-ranges/get:
 *   get:
 *     summary: Get all salary-ranges onboarding options
 *     tags: [Onboarding Dynamic Data]
 *     x-sort-order: 6
 *     description: Fetches a list of all salary-ranges onboarding options available in the system.
 *     responses:
 *       200:
 *         description: salary-ranges options fetched successfully
 */
router.get("/salary-ranges/get", getActive);
export default router;