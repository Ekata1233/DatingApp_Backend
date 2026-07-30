

import { NextFunction, Request, Response } from "express";
import { createPackageSchema, updatePackageSchema } from "./package.validation";
import { createOrUpdatePackageService, createPackageFeatureService, getAllPackagesService, getPackageByIdService, getPackageBySlugService, getPackageCardsService, getPackageFeaturesBySlugService, updatePackageService} from "./package.service";
import { formatPackageResponse } from "./package.response";

interface Params {
  slug: string;
}

export const createPackageController = async (req: Request, res: Response) => {
  try {
    const validatedData = createPackageSchema.parse(req.body);
    
    const result = await createOrUpdatePackageService(validatedData);

    return res.status(200).json({
      success: true,
      message: "Package saved successfully",
      data: result,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors,
      });
    }

    const statusCode = error.message.includes("already exists") || 
                       error.message.includes("Invalid feature codes") ? 400 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};


export const updatePackageController = async (
    req: Request,
    res: Response
) => {

    try {

        const data =
            updatePackageSchema.parse({
                id: req.params.id,
                ...req.body
            });

        const result =
            await updatePackageService(data);

        return res.status(200).json({

            success: true,

            message: "Package updated successfully",

            data: result

        });

    } catch (error: any) {

        if (error.name === "ZodError") {

            return res.status(400).json({

                success: false,

                errors: error.errors

            });

        }

        return res.status(400).json({

            success: false,

            message: error.message

        });

    }

}

export const getAllPackagesController = async (
  req: Request,
  res: Response
) => {
  try {
    const packages = await getAllPackagesService();

    return res.status(200).json({
      success: true,
      data: packages.map(formatPackageResponse),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPackageByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const pkg = await getPackageByIdService(req.params.id as string);

    return res.status(200).json({
      success: true,
      data: formatPackageResponse(pkg),
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPackageBySlugController = async (
  req: Request,
  res: Response
) => {
  try {
    const pkg = await getPackageBySlugService(req.params.slug as string);

    return res.status(200).json({
      success: true,
      data: formatPackageResponse(pkg),
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPackageCardsController = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await getPackageCardsService();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createPackageFeature = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const feature = await createPackageFeatureService(req.body);

    res.status(201).json({
      success: true,
      message: "Package feature created successfully.",
      data: feature,
    });
  } catch (error) {
    next(error);
  }
};
export const getPackageFeaturesBySlug = async (
  req: Request<Params>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slug } = req.params;

    const features = await getPackageFeaturesBySlugService(slug);

    res.status(200).json({
      success: true,
      data: features,
    });
  } catch (error) {
    next(error);
  }
};