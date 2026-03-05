import { Router } from "express";
import * as GenderController from "./gender.controller";

const router = Router();

router.post("/add", GenderController.create);
router.get("/", GenderController.getAll);

export default router;
