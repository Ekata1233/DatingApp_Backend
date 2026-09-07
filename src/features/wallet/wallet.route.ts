import { Router } from "express";
import { getMyWalletController } from "./wallet.controller";
import authMiddleware from "../../middleware/auth.middleware";

const router = Router();

router.get(
  "/my-wallet",
  authMiddleware,
  getMyWalletController,
);

export default router;