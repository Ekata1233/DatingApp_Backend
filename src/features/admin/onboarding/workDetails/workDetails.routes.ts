import { Router } from "express";
import { create, getAll } from "./workDetails.controller";

const router = Router();

router.post("/create", create);
router.get("/get-all", getAll);

export default router;