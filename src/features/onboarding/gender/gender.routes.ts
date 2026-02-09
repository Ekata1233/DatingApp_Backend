import { Router } from "express";
import * as GenderController from "./gender.controller";

const router = Router();

router.post("/", GenderController.create);
router.get("/", GenderController.getAll);

export default router;
