import { Request, Response, NextFunction } from "express";
import { createStoreFeatureService, createStorePackService, getComplimentStoreService, getRoseStoreService } from "./purchaseStore.service";



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