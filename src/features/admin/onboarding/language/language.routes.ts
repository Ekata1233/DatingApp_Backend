import { Router } from "express";
import {
  createLanguageController,
  deleteLanguageController,
  getActiveLanguagesController,
  getLanguageByIdController,
  getLanguagesController,
  updateLanguageController,
} from "./language.controller";

const router = Router();

router.post("/languages/create", createLanguageController);
router.get("/languages/get-all", getLanguagesController);
/**
 * @swagger
 * /api/onboarding/languages/get:
 *   get:
 *     summary: Get all language onboarding options
 *     tags: [Onboarding Dynamic Data]
 *     x-sort-order: 6
 *     description: Fetches a list of all language onboarding options available in the system.
 *     responses:
 *       200:
 *         description: Language options fetched successfully
 */
router.get("/languages/get", getActiveLanguagesController);
router.get("/languages/:id", getLanguageByIdController);
router.patch("/languages/:id", updateLanguageController);
router.delete("/languages/:id", deleteLanguageController);

export default router;