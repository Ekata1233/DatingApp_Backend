import { Router } from "express";
import { createCategoryController, createFamilyIncomeController, createMasterValueController, deleteCategoryController, deleteFamilyIncomeController, deleteMasterValueController, getCategoriesController, getFamilyIncomeController, getFamilyOptionsController, getMasterValuesController, updateCategoryController, updateFamilyIncomeController, updateMasterValueController } from "./familyProfile.controller";

const router = Router();

router.post("/family-categories/create", createCategoryController);
// router.patch("/:id", updateCategoryController);
// router.delete("/:id", deleteCategoryController);
router.get("/family-categories/get-all", getCategoriesController);

router.post("/family-values/create", createMasterValueController);
// router.patch("/:id", updateMasterValueController);
// router.delete("/:id", deleteMasterValueController);
router.get("/family-values/get-all", getMasterValuesController);

router.post("/family-incomes/create", createFamilyIncomeController);
// router.patch("/:id", updateFamilyIncomeController);
// router.delete("/:id", deleteFamilyIncomeController);
router.get("/family-incomes/get-all", getFamilyIncomeController);

router.patch("/family-categories/:id", updateCategoryController);
router.delete("/family-categories/:id", deleteCategoryController);

router.patch("/family-values/:id", updateMasterValueController);
router.delete("/family-values/:id", deleteMasterValueController);

router.patch("/family-incomes/:id", updateFamilyIncomeController);
router.delete("/family-incomes/:id", deleteFamilyIncomeController);

router.get("/family/options", getFamilyOptionsController);
export default router;
