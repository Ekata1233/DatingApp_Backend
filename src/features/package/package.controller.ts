import { Request, Response } from "express";
import {
  activatePackageValidation,
  checkFeatureAccessValidation,
} from "./package.validation";
import {
  activatePackageService,
  checkUserFeatureAccessService,
  recordFeatureUsageService,
} from "./package.service";

// Activate package after payment
export const activatePackageController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { paymentId } = activatePackageValidation.parse(req.body);

    const result = await activatePackageService(userId, paymentId);

    return res.status(200).json({
      success: true,
      message: "Package activated successfully",
      data: result,
    });
  } catch (error: any) {
    const statusCode = 
      error.message.includes("not found") ? 404 :
      error.message.includes("not successful") ? 400 :
      error.message.includes("no longer") ? 400 :
      500;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

// Check feature access
export const checkFeatureAccessController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;
    const { featureCode } = checkFeatureAccessValidation.parse(req.body);

    const access = await checkUserFeatureAccessService(userId, featureCode);

    return res.status(200).json({
      success: true,
      data: access,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Record feature usage
export const recordFeatureUsageController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;
    const { featureCode } = checkFeatureAccessValidation.parse(req.body);

    const result = await recordFeatureUsageService(userId, featureCode);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get user's active package
export const getActivePackageController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const { prisma } = require("../../../prisma/prismaClient");
    
    const activePackage = await prisma.userPackage.findFirst({
      where: {
        user_id: userId,
        status: "ACTIVE",
        endDate: {
          gte: new Date(),
        },
      },
      include: {
        package: {
          include: {
            limits: {
              where: { enabled: true },
              include: {
                feature: true,
              },
            },
          },
        },
        price: true,
      },
    });

    if (!activePackage) {
      return res.status(200).json({
        success: true,
        data: null,
        message: "No active package",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: activePackage.id,
        packageName: activePackage.package.name,
        startDate: activePackage.startDate,
        endDate: activePackage.endDate,
        status: activePackage.status,
        features: activePackage.package.limits.map((limit:any) => ({
          code: limit.feature.code,
          title: limit.feature.title,
          enabled: limit.enabled,
          unlimited: limit.unlimited,
          limit: limit.limit,
          resetPeriod: limit.resetPeriod,
        })),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};