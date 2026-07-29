

import { Request, Response } from "express";
import { createPackageSchema, updatePackageSchema } from "./package.validation";
import { createOrUpdatePackageService, updatePackageService } from "./package.service";

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