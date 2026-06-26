// Date Now Routes
import express from "express";

import {
  upsertDatePlanOptions,
  getOptions
} from "./dateNow.controller";

const router = express.Router();

// No multer needed - uses existing file handling middleware
router.post("/create-options", upsertDatePlanOptions);
router.get("/options", getOptions);

export default router;