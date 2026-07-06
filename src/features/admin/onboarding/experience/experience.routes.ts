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
router.get("/experiences/get", getActiveExperienceController)
export default router