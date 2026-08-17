import { Router } from "express";
import authMiddleware from "../../../middleware/auth.middleware";
import { uploadMedia } from "./media.controller";

const router = Router();

router.post(
  "/upload",
  authMiddleware,
  uploadMedia
);

export default router;