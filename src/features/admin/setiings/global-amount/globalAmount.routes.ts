import { Router } from "express";

import {
  createGlobalAmountController,
  getGlobalAmountController,
} from "./globalAmount.controller";

const router = Router();

router.post(
  "/global-amounts/create",
  createGlobalAmountController,
);

router.get(
  "/global-amounts/get",
  getGlobalAmountController,
);

export default router;