import express from "express";
import { createPackageController, updatePackageController } from "./package.controller";

const router = express.Router();

router.post("/create", createPackageController);

router.patch(
    "/update/:id",
    updatePackageController
);

export default router;
