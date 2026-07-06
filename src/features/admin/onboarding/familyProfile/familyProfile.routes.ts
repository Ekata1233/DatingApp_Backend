import { Router } from "express";
import { createCategoryController, createFamilyIncomeController, createMasterValueController, deleteCategoryController, deleteFamilyIncomeController, deleteMasterValueController, getCategoriesController, getFamilyIncomeController, getMasterValuesController, updateCategoryController, updateFamilyIncomeController, updateMasterValueController } from "./familyProfile.controller";

const router = Router();

router.post("/family-categories/create", createCategoryController);
router.patch("/:id", updateCategoryController);
router.delete("/:id", deleteCategoryController);
router.get("/family-categories/get-all", getCategoriesController);

router.post("/family-values/create", createMasterValueController);
router.patch("/:id", updateMasterValueController);
router.delete("/:id", deleteMasterValueController);
router.get("/family-values/get-all", getMasterValuesController);

router.post("/family-incomes/create", createFamilyIncomeController);
router.patch("/:id", updateFamilyIncomeController);
router.delete("/:id", deleteFamilyIncomeController);
router.get("/family-incomes/get-all", getFamilyIncomeController);

export default router;
