import { Router } from "express";
import { getMyBalancesController } from "./myBalance.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router = Router();

router.get(
  "/my-balances",
  authMiddleware,
  getMyBalancesController,
);

export default router;