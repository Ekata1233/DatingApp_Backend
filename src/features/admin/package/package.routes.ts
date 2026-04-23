import express from "express";
import { createPackageController } from "./package.contoller";

const router = express.Router();

router.post("/create", createPackageController);

export default router;
