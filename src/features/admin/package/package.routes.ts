import express from "express";
import { createPackageController, getPackagesController } from "./package.contoller";

const router = express.Router();

router.post("/create", createPackageController);
router.get("/get-all", getPackagesController); 

export default router;
