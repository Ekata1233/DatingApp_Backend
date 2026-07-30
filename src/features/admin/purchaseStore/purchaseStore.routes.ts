import { Router } from "express";
import { createStoreFeature, createStorePack, getComplimentStoreController, getRoseStoreController } from "./purchaseStore.controller";



const router = Router();

/*
|--------------------------------------------------------------------------
| Store Features
|--------------------------------------------------------------------------
*/

router.post("/purchase-store/features", createStoreFeature);

router.post("/purchase-store/packs",  createStorePack);

router.get("/purchase-store/roses", getRoseStoreController);

router.get("/purchase-store/compliments", getComplimentStoreController);
export default router;