import express from "express";
import { blockUserController } from "./block.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router = express.Router();

router.patch(
  "/block",
  authMiddleware,
  blockUserController
);
export default router;