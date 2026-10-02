import { Router } from "express";
import { addMoneyToWalletController, getMyWalletController } from "./wallet.controller";
import authMiddleware from "../../middleware/auth.middleware";

const router = Router();

router.get(
  "/my-wallet",
  authMiddleware,
  getMyWalletController,
);

router.post(
  "/wallet/add-money",
  authMiddleware,
  addMoneyToWalletController,
);
export default router;