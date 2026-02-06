import { Router } from "express";
import { create, getAll } from "./interestedIn.controller";

const router = Router();

router.post("/", create);   // POST /api/interestedIn
router.get("/", getAll);    // GET  /api/interestedIn

export default router;
