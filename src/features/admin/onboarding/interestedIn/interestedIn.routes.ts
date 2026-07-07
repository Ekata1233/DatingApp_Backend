import { Router } from "express";
import { create, getAll } from "./interestedIn.controller";

const router = Router();

router.post("/create", create);
router.get("/get-all", getAll);
router.get("/interested-in/get", getAll);

export default router;
