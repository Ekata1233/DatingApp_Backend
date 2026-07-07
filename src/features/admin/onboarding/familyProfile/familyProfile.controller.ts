import { Request, Response } from "express";
import { createCategoryValidation, createFamilyIncomeValidation, createMasterValueValidation, updateCategoryValidation, updateFamilyIncomeValidation, updateMasterValueValidation } from "./familyProfile.validation";
import { createCategoryService, createFamilyIncomeService, createMasterValueService, deleteCategoryService, deleteFamilyIncomeService, deleteMasterValueService, getCategoriesService, getFamilyIncomeService, getMasterValuesService, updateCategoryService, updateFamilyIncomeService, updateMasterValueService } from "./familyProfile.service";

export const createCategoryController = async (
  req: Request,
  res: Response
) => {
  try {
    const data = createCategoryValidation.parse(req.body);

    const category = await createCategoryService(data);

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateCategoryController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const data = updateCategoryValidation.parse(req.body);

    const category = await updateCategoryService(id, data);

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteCategoryController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    await deleteCategoryService(id);

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCategoriesController = async (
  req: Request,
  res: Response
) => {
  try {
    const categories = await getCategoriesService();

    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: categories,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const createMasterValueController = async (
  req: Request,
  res: Response
) => {
  try {

    const data = createMasterValueValidation.parse(req.body);

    const value = await createMasterValueService(data);

    return res.status(201).json({
      success: true,
      message: "Master value created successfully",
      data: value,
    });

  } catch (error: any) {

    return res.status(400).json({
      success: false,
      message: error.message,
    });

  }
};

export const updateMasterValueController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const data = updateMasterValueValidation.parse(req.body);

    const value = await updateMasterValueService(id, data);

    return res.status(200).json({
      success: true,
      message: "Master value updated successfully",
      data: value,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteMasterValueController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    await deleteMasterValueService(id);

    return res.status(200).json({
      success: true,
      message: "Master value deleted successfully",
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMasterValuesController = async (
  req: Request,
  res: Response
) => {
  try {
    const values = await getMasterValuesService();

    return res.status(200).json({
      success: true,
      message: "Master values fetched successfully",
      data: values,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const createFamilyIncomeController = async (
  req: Request,
  res: Response
) => {
  try {

    const data = createFamilyIncomeValidation.parse(req.body);

    const income = await createFamilyIncomeService(data);

    return res.status(201).json({
      success: true,
      message: "Family income created successfully",
      data: income,
    });

  } catch (error: any) {

    return res.status(400).json({
      success: false,
      message: error.message,
    });

  }
};

export const updateFamilyIncomeController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const data = updateFamilyIncomeValidation.parse(req.body);

    const income = await updateFamilyIncomeService(id, data);

    return res.status(200).json({
      success: true,
      message: "Family income updated successfully",
      data: income,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteFamilyIncomeController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    await deleteFamilyIncomeService(id);

    return res.status(200).json({
      success: true,
      message: "Family income deleted successfully",
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getFamilyIncomeController = async (
  req: Request,
  res: Response
) => {
  try {
    const incomes = await getFamilyIncomeService();

    return res.status(200).json({
      success: true,
      message: "Family income fetched successfully",
      data: incomes,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};