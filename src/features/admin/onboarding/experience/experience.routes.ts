import { Router } from "express"
import {
  createExperienceController,
  getAllExperienceController,
  updateExperienceController,
  deleteExperienceController,
  getActiveExperienceController,
} from "./experience.controller"

const router = Router()

router.post("/experiences/create", createExperienceController)
router.get("/experiences/get-all", getAllExperienceController)
router.put("/experiences/update/:id", updateExperienceController)
router.delete("/experiences/remove/:id", deleteExperienceController)

// Get
/**
 * @swagger
 * /api/onboarding/experiences/get:
 *   get:
 *     summary: Get all experience onboarding options
 *     tags: [Onboarding Dynamic Data]
 *     x-sort-order: 4
 *     description: Fetches a list of all experience onboarding options available in the system.
 *     responses:
 *       200:
 *         description: Experience options fetched successfully
 */
router.get("/experiences/get", getActiveExperienceController)
export default router