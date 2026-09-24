import { Router } from "express";


import {
  purchaseComplimentWithWalletController,
} from "./compliment-purchase.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router = Router();

router.post(
  "/compliment/wallet/top-up",
  authMiddleware,
  purchaseComplimentWithWalletController
);

export default router;