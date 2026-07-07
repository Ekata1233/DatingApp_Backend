import { Router } from "express";
import { create, getAll } from "./realYouMatters.controller";

const router = Router();

router.post("/create", create);      // Create / Replace
router.get("/get-all", getAll);       // Get single document

export default router;
