import { Router } from "express";
import { create, getAll, remove } from "./thingsYouLove.controller";

const router = Router();

router.post("/create", create);      // Create / Replace
router.get("/get-all", getAll);       // Get single document
router.delete("/remove", remove);    // Delete

export default router;
