import express from "express";
import { deleteUserPromptController, getEditProfileController, updateBasicInfo, updateBio, updateEduWork, updateLocation, updateQuestionAnswers, updateUserPrompt} from "./editProfile.controller";
import authMiddleware from "../../../../middleware/auth.middleware";

const router = express.Router();

router.patch("/edit-profile/basic-info", authMiddleware, updateBasicInfo);

router.patch(
  "/edit-profile/bio",
  authMiddleware,
  updateBio
);

router.patch(
  "/edit-profile/answers",
  authMiddleware,
  updateQuestionAnswers
);

router.patch(
  "/edit-profile/education-work",
  authMiddleware,
  updateEduWork
);

router.patch(
  "/edit-profile/prompts",
  authMiddleware,
  updateUserPrompt
);

router.patch(
  "/edit-profile/location",
  authMiddleware,
  updateLocation
);

router.delete("/edit-profile/prompt/:promptId", authMiddleware, deleteUserPromptController);

router.get(
  "/profile/details",
  authMiddleware,
  getEditProfileController
);
export default router;
