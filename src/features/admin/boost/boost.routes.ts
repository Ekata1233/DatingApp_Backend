import express from "express";
import { createBoostController, getBoostsController } from "./boost.contoller";

const router = express.Router();

router.post("/create", createBoostController);
router.get("/get-all", getBoostsController); 

export default router;
