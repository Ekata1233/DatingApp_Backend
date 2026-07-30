import express from "express";
import { createPackageController, getAllPackagesController, getPackageByIdController, getPackageBySlugController, getPackageCardsController, updatePackageController } from "./package.controller";

const router = express.Router();

router.post("/create", createPackageController);

router.patch(
    "/update/:id",
    updatePackageController
);
router.get("/get/list", getAllPackagesController);


router.get("/get/cards", getPackageCardsController);
router.get("/get/:id", getPackageByIdController);
router.get("/get/slug/:slug", getPackageBySlugController);


export default router;
