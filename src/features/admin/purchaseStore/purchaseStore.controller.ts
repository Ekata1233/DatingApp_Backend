import { Request, Response, NextFunction } from "express";
import { createStoreFeatureService, createStoreInfoService, createStorePackService, getComplimentStoreService, getRoseStoreService, getStoreService } from "./purchaseStore.service";
import { createStoreInfoSchema } from "./purchaseStore.validation";
import { StoreItemType } from "@prisma/client";



export const createStoreFeature = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await createStoreFeatureService(req.body);

    res.status(201).json({
      success: true,
      message: "Store feature created successfully.",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const createStorePack = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await createStorePackService(req.body);

    res.status(201).json({
      success: true,
      message: "Store pack created successfully.",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getRoseStoreController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getRoseStoreService();

    return res.status(200).json({
      success: true,
      message: "Rose store fetched successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getComplimentStoreController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getComplimentStoreService();

    return res.status(200).json({
      success: true,
      message: "Compliment store fetched successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const createStoreInfoController = async (
  req: Request,
  res: Response
) => {
  try {
    const validatedData = createStoreInfoSchema.parse(req.body);

    const data = await createStoreInfoService(validatedData);

    return res.status(200).json({
      success: true,
      message: "Store info saved successfully",
      data,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
export const getStoreController = async (
  req: Request,
  res: Response
) => {
  try {
    const { itemType } = req.params;

    const data = await getStoreService(
      itemType as StoreItemType
    );

    return res.status(200).json({
      success: true,
      message: "Store data fetched successfully",
      data,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};