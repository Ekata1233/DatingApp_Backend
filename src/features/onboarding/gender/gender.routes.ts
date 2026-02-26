// gender.routes.ts
import { Router } from "express";
import { create, getAll, remove } from "./gender.controller";

const router = Router();

// Create (replaces existing)
router.post("/create", create);

// Get all (returns array with single document or empty array)
router.get("/get-all", getAll);

// Delete all
router.delete("/delete", remove);

export default router;