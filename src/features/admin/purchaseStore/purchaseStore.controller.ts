import { Request, Response, NextFunction } from "express";
import { createStoreFeatureService, createStoreInfoService, createStorePackService, deleteStoreInfoService, deleteStorePackService, getComplimentStoreService, getRoseStoreService, getStoreService, updateStoreInfoService, updateStorePackService } from "./purchaseStore.service";
import { createStoreInfoSchema, updateStoreInfoSchema, updateStorePackSchema } from "./purchaseStore.validation";
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
export const updateStorePackController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Store pack id is required.",
      });
    }

    const validatedData =
      updateStorePackSchema.parse(req.body);

    const data = await updateStorePackService(
      id,
      validatedData
    );

    return res.status(200).json({
      success: true,
      message: "Store pack updated successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};
export const deleteStorePackController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Store pack id is required.",
      });
    }

    const data = await deleteStorePackService(id);

    return res.status(200).json({
      success: true,
      message: "Store pack deleted successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getStoreController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { itemType } = req.params;

    const userId = (req as any).user.id;

    const data = await getStoreService(
      itemType as StoreItemType,
      userId
    );

    return res.status(200).json({
      success: true,
      message: "Store data fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};
export const updateStoreInfoController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
   const id = String(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Store info id is required.",
      });
    }

    const validatedData =
      updateStoreInfoSchema.parse(req.body);

    const data = await updateStoreInfoService(
      id,
      validatedData
    );

    return res.status(200).json({
      success: true,
      message: "Store info updated successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};
export const deleteStoreInfoController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Store info id is required.",
      });
    }

    const data = await deleteStoreInfoService(id);

    return res.status(200).json({
      success: true,
      message: "Store info deleted successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};