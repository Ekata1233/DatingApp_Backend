import { Router } from "express";



import {
  purchaseBoostWithWalletController,
} from "./boost-purchase.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router = Router();

router.post(
  "/boost/wallet/top-up",
  authMiddleware,
  purchaseBoostWithWalletController
);

export default router;