import { Router } from "express";
import * as GenderController from "./gender.controller";

const router = Router();

router.post("/create", GenderController.create);
router.get("/getAll", GenderController.getAll);

export default router;
