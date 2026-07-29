import express from "express";
import { createPackageController, getAllPackagesController, getPackageByIdController, getPackageBySlugController, updatePackageController } from "./package.controller";

const router = express.Router();

router.post("/create", createPackageController);

router.patch(
    "/update/:id",
    updatePackageController
);
router.get("/get/list", getAllPackagesController);

router.get("/get/slug/:slug", getPackageBySlugController);

router.get("/get/:id", getPackageByIdController);
export default router;
