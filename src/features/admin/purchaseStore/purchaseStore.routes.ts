import { Router } from "express";
import { createStoreFeature, createStoreInfoController, createStorePack, getComplimentStoreController, getRoseStoreController, getStoreController } from "./purchaseStore.controller";



const router = Router();

/*
|--------------------------------------------------------------------------
| Store Features
|--------------------------------------------------------------------------
*/

router.post("/purchase-store/features", createStoreFeature);

router.post("/purchase-store/packs",  createStorePack);

router.post(
  "/purchase-store/info",
  createStoreInfoController
); 

router.get("/purchase-store/roses", getRoseStoreController);

router.get("/purchase-store/compliments", getComplimentStoreController);
router.get("/purchase-store/all-data/:itemType", getStoreController);
export default router;