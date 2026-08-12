import express from "express";
import { createBoostController, createOrUpdateBoostFeaturesController, createOrUpdateBoostInfoController, deleteBoostInfoController, getBoostFeaturesController, getBoostInfoController, getBoostsController, resetBoostFeaturesController } from "./boost.contoller";

const router = express.Router();
// ============================================================
//  BOOST PACK APIs
// ============================================================
router.post("/create", createBoostController);
router.get("/get-all", getBoostsController); 

// ============================================================
// BOOST INFO APIs
// ============================================================

// Create info first time
// Update/replace info when same name already exists
router.post("/info", createOrUpdateBoostInfoController);

// Get info
router.get("/info/:name", getBoostInfoController);

// Delete only info
router.delete("/info/:name", deleteBoostInfoController);

// ============================================================
// BOOST FEATURES
// ============================================================

router.post(
  "/features",
  createOrUpdateBoostFeaturesController
);

router.get(
  "/features/:name",
  getBoostFeaturesController

);

router.delete(
  "/features/:name",
  resetBoostFeaturesController
);

export default router;
