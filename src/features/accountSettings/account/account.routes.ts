// account.routes.ts

import { Router } from "express";



import {
  pauseAccountController,
  resumeAccountController,
  deleteAccountController,
} from "./account.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router = Router();

router.patch(
  "/account/pause",
  authMiddleware,
  pauseAccountController,
);

router.patch(
  "/account/resume",
  authMiddleware,
  resumeAccountController,
);

router.delete(
  "/account/delete",
  authMiddleware,
  deleteAccountController,
);

export default router;