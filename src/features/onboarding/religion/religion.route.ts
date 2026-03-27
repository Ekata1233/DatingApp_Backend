import { Router } from "express";
import { create, getAll } from "./religion.controller";

const router = Router();

// ✅ CREATE / UPDATE
router.post("/create", create);

// ✅ GET ALL (optional flowType filter → ?flowType=dating)
router.get("/get-all", getAll);

export default router;