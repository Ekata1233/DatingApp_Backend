

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
  console.error(error);

  if (error.name === "ZodError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.errors,
    });
  }

  if (
    error.code === "P2002" ||
    error.message?.includes("already exists")
  ) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "Package not found.",
    });
  }

  if (error.code === "P2003") {
    return res.status(400).json({
      success: false,
      message: "Cannot update package because related records exist.",
    });
  }

  if (error.code === "P2000") {
    return res.status(400).json({
      success: false,
      message: "One or more field values are too long.",
    });
  }

  if (error.code === "P2028") {
    return res.status(500).json({
      success: false,
      message: "Database transaction timed out. Please try again.",
    });
  }

  return res.status(500).json({
    success: false,
    message: error.message || "Internal server error.",
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