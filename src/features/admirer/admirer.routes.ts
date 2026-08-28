import { Router } from "express";
import { getAdmirers } from "./admirer.controller";
import authMiddleware from "../../middleware/auth.middleware";

const router = Router();

router.get(
  "/admirers",
  authMiddleware,
  getAdmirers
);

export default router;