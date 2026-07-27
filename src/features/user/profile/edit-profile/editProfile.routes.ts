import express from "express";
import { updateBasicInfo, updateBio, updateEduWork, updateLocation, updateQuestionAnswers, updateUserPrompt} from "./editProfile.controller";
import authMiddleware from "../../../../middleware/auth.middleware";

const router = express.Router();

router.patch("/edit-basic-info", authMiddleware, updateBasicInfo);

router.patch(
  "/edit-profile/basic-info",
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
export default router;
