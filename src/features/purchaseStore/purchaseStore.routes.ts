// purchaseStore.routes.ts
import { Router } from "express";

const router = Router();

router.post(
    "/create",
    authenticate,
    validate(createPurchaseSchema),
    createPurchaseController
);

export default router;