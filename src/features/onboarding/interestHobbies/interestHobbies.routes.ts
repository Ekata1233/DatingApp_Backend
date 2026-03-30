import { Router } from "express";
import { create, getAll } from "./interestHobbies.controller";

const router = Router();

router.post("/create", create);
router.get("/get-all", getAll);

export default router;