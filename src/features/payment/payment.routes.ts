import { Router } from "express";
import { createPaymentOrder, verifyPaymentController } from "./payment.controller";
import authMiddleware from "../../middleware/auth.middleware";

const router = Router();

router.post("/create-order", authMiddleware, createPaymentOrder);

router.post(
    "/verify",
    authMiddleware,
    verifyPaymentController
);

export default router;