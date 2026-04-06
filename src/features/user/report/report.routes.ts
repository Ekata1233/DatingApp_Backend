import express from "express";
import { reportUserController } from "./report.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router = express.Router();

router.patch(
  "/report",
  authMiddleware,
  reportUserController
);
export default router;