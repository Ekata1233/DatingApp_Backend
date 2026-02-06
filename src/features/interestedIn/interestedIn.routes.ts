import { Router } from "express";
import { create, getAll } from "./interestedIn.controller";

const router = Router();

router.post("/", create);
router.get("/", getAll);

export default router;
