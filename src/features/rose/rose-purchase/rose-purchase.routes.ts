import { Router } from "express";
import {
  purchaseRoseWithWalletController,
} from "./rose-purchase.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router = Router();

router.post(
  "/rose/wallet/top-up",
  authMiddleware,
  purchaseRoseWithWalletController
);

export default router;