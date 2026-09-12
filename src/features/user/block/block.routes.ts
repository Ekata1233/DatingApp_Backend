import express from "express";
import { blockUserController, getBlockedUsersController, unblockUserController } from "./block.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router = express.Router();

router.patch(
  "/block",
  authMiddleware,
  blockUserController
);

router.delete(
  "/unblock/:blockedId",
  authMiddleware,
  unblockUserController
);

router.get(
  "/blocked-users/list",
  authMiddleware,
  getBlockedUsersController,
);
export default router;