import { Request, Response } from "express";
import { activatePackageService } from "./package.service";

export const activatePackage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const { packageId, planId } = req.body;

    const subscription = await activatePackageService(
      userId,
      packageId,
      planId,
    );

    return res.status(200).json({
      success: true,
      message: "Package activated successfully",
      data: subscription,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
