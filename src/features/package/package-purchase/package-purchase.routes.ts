import { Router } from "express";
import {
  purchasePackageWithWalletController,
} from "./package-purchase.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router = Router();

//active package via wallet
router.post(
  "/package/wallet/purchase",
  authMiddleware,
  purchasePackageWithWalletController
);

export default router;