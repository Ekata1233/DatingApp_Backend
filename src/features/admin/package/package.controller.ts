import { Request, Response } from "express";
import { createPackageSchema } from "./package.validation";
import { createPackageService } from "./package.service";

export const createPackageController = async (
  req: Request,
  res: Response
) => {
  try {
    const parsed = createPackageSchema.safeParse(
      req.body
    );

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message:
          parsed.error.issues[0].message,
      });
    }

    const result = await createPackageService(
      parsed.data
    );

    return res.status(201).json({
      success: true,
      message:
        "Package created successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
};
