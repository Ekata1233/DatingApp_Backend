import { Router } from "express";
import { getAdmirerDetailsController, getAdmirers } from "./admirer.controller";
import authMiddleware from "../../middleware/auth.middleware";

const router = Router();

router.get(
  "/admirers",
  authMiddleware,
  getAdmirers
);

router.get(
  "/admirers/details/:admirerId",
  authMiddleware,
  getAdmirerDetailsController,
);

export default router;