import {
  Router,
} from "express";


import {
  createPayoutMethodController,
  deletePayoutMethodController,
  getPayoutMethodByIdController,
  getPayoutMethodsController,
  setPrimaryPayoutMethodController,
  updatePayoutMethodController,
} from "./payout-method.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router = Router();

router.post(
  "/bank-upi/create",
  authMiddleware,
  createPayoutMethodController
);

router.get(
  "/bank-upi/get",
  authMiddleware,
  getPayoutMethodsController
);

router.get(
  "/bank-upi/get/:id",
  authMiddleware,
  getPayoutMethodByIdController
);

router.patch(
  "/bank-upi/update/:id",
  authMiddleware,
  updatePayoutMethodController
);

router.patch(
  "/bank-upi/:id/primary",
  authMiddleware,
  setPrimaryPayoutMethodController
);

router.delete(
  "/bank-upi/:id/remove",
  authMiddleware,
  deletePayoutMethodController
);

export default router;