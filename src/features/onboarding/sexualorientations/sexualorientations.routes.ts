import { Router } from "express";
import { create, getAll, remove } from "./sexualorientations.controller";

const router = Router();

router.post("/create", create);
router.get("/get-all", getAll);
router.delete("/delete", remove);

export default router;
