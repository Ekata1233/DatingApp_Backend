import express from "express";
import { createPackageController, createPackageFeature, getAllPackagesController, getPackageByIdController, getPackageBySlugController, getPackageCardsController, getPackageFeaturesBySlug, updatePackageController} from "./package.controller";

const router = express.Router();

router.post("/create", createPackageController);

router.patch(
    "/update/:id",
    updatePackageController
);
router.get("/get/list", getAllPackagesController);


router.get("/get/cards", getPackageCardsController);
router.post("/feature", createPackageFeature);
router.get("/feature/:slug", getPackageFeaturesBySlug);
router.get("/get/:id", getPackageByIdController);
router.get("/get/slug/:slug", getPackageBySlugController);


export default router;
