import { Router } from "express";
import {
  createStoreFeature,
  createStoreInfoController,
  createStorePack,
  deleteStoreInfoController,
  deleteStorePackController,
  getComplimentStoreController,
  getRoseStoreController,
  getStoreController,
  updateStoreInfoController,
  updateStorePackController,
} from "./purchaseStore.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router = Router();



router.post("/purchase-store/features", createStoreFeature);

router.post("/purchase-store/packs", createStorePack);

router.post("/purchase-store/info", createStoreInfoController);

router.get("/purchase-store/roses", getRoseStoreController);

router.get("/purchase-store/compliments", getComplimentStoreController);
router.get("/purchase-store/all-data/:itemType",authMiddleware, getStoreController);
router.patch("/purchase-store/info/:id", updateStoreInfoController);

router.delete( "/purchase-store/info/:id", 
  deleteStoreInfoController);

  router.patch(
  "/purchase-store/packs/:id",
  updateStorePackController
);

router.delete(
  "/purchase-store/packs/:id",
  deleteStorePackController
);
export default router;
