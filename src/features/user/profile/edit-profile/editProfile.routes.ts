import express from "express";
import { updateBasicInfo, updateBio, updateUserEduWork } from "./editProfile.controller";
import authMiddleware from "../../../../middleware/auth.middleware";

const router = express.Router();

router.patch("/edit-basic-info", authMiddleware, updateBasicInfo);

router.patch(
  "/edit-bio",
  authMiddleware,
  updateBio
);

router.patch(
  "/education-work",
  authMiddleware,
  updateUserEduWork
);

export default router;
