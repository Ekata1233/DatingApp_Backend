import { Request, Response } from "express";
import {
  upsertDatePlanOptionsService,
  getOptionsByTypeService,
  createDatePlanPackage,
  updateDatePlanPackage,
  getDatePlanPackages,
} from "./dateNow.service";

import { upsertDatePlanOptionsSchema } from "../dateNow/dateNow.Validation";
import { OptionType } from "@prisma/client";
  
export const upsertDatePlanOptions = async (
  req: Request,
  res: Response
) => {
  try {
    const validated =
      upsertDatePlanOptionsSchema.parse(req.body);

    const result =
      await upsertDatePlanOptionsService(
        validated.type,
        validated.options
      );

    return res.status(200).json({
      success: true,
      message: "Options saved successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong",
    });
  }
};

export const getOptions = async (
  req: Request,
  res: Response
) => {
  try {
    const type = req.query.type as OptionType;

    const result = await getOptionsByTypeService(type);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong",
    });
  }
};

export const createDatePlanPackageController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const packageData = await createDatePlanPackage(req.body);

    res.status(201).json({
      success: true,
      message: "Date plan package created successfully",
      data: packageData,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateDatePlanPackageController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const packageData = await updateDatePlanPackage(
      req.params.id,
      req.body
    );

    res.json({
      success: true,
      message: "Date plan package updated successfully",
      data: packageData,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getDatePlanPackagesController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const packages = await getDatePlanPackages();

    res.json({
      success: true,
      data: packages,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};