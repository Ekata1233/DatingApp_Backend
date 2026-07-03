import { Router } from "express";
import {
  create,
  getAll,
  remove,
} from "./intention.controller";

const router = Router();

// Create OR Update (Single API)
router.post("/create", create);

// Get
router.get("/get-all", getAll);

// Delete
router.delete("/delete", remove);

export default router;