import { Request, Response, NextFunction } from "express";
import { createPurchaseService } from "./purchaseStore.service";

export async function createPurchaseController(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await createPurchaseService(
      req.user.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Purchase initiated successfully.",
      data: result,
    });
  } catch (error: any) {

    return res.status(400).json({
      success: false,
      message: error.message,
    });

  }
}