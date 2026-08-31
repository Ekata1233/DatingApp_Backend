import { NextFunction, Request, Response } from "express";
import { OptionType } from "@prisma/client";
import {
  upsertDatePlanOptionsService,
  getOptionsByTypeService,
  createDatePlanPackage,
  updateDatePlanPackage,
  getDatePlanPackages,
  getDatePlansService,
  getDatePlanDetailsService,
  createDatePlanPackageInfoService,
  getDatePlanPackageInfoService,
  createDatePlanPackageFeaturesService,
  getDatePlanPackageFeaturesService,
  getAllDatePlanPackageDataService,
  getDatePlanPackageDataService,
} from "./dateNow.service";
import { datePlanPackageFeaturesSchema, datePlanPackageInfoSchema, upsertDatePlanOptionsSchema } from "./dateNow.Validation";
import imagekit from "../../../utils/imagekit";

interface OptionItem {
  label: string;
  value: string;
  icon?: string | null;
  sortOrder?: number;
}




export const upsertDatePlanOptions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log("═══════════════════════════════════════════════");
    console.log("🖼️ DATE PLAN OPTIONS - FILE DEBUG");
    console.log("═══════════════════════════════════════════════");

    console.log("📦 req.body:", req.body);
    console.log("📁 req.files:", req.files);

    // =====================================================
    // 1. GET TYPE
    // =====================================================

    const type = req.body.type as OptionType;

    // =====================================================
    // 2. PARSE OPTIONS
    // =====================================================

    let options: any = req.body.options;

    if (typeof options === "string") {
      try {
        options = JSON.parse(options);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid options JSON format",
        });
      }
    }

    // =====================================================
    // 3. BASIC OPTIONS VALIDATION
    // =====================================================

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Type is required",
      });
    }

    if (!Array.isArray(options)) {
      return res.status(400).json({
        success: false,
        message: "Options must be an array",
      });
    }

    if (options.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one option is required",
      });
    }

    // =====================================================
    // 4. GET FILES
    // =====================================================

    const files = req.files as any;

    console.log("📁 Raw files:", files);

    // =====================================================
    // 5. CREATE FILE MAP
    // =====================================================

    const iconFiles: Record<number, any> = {};

    if (files) {
      Object.keys(files).forEach((key) => {
        const match = key.match(/^icons\[(\d+)\]$/);

        if (match) {
          const index = Number(match[1]);

          const file = Array.isArray(files[key])
            ? files[key][0]
            : files[key];

          iconFiles[index] = file;

          console.log(
            `✅ Found icon file for option ${index}:`,
            file.name || file.originalname,
          );
        }
      });
    }

    console.log(
      `📁 Total icon files found: ${
        Object.keys(iconFiles).length
      }`,
    );

    // =====================================================
    // 6. UPLOAD ICONS TO IMAGEKIT
    // =====================================================

    for (let i = 0; i < options.length; i++) {
      const file = iconFiles[i];

      if (!file) {
        console.log(
          `ℹ️ No icon uploaded for option ${i}: ${options[i].label}`,
        );

        // Keep existing icon value if one was sent
        if (options[i].icon === undefined) {
          options[i].icon = null;
        }

        continue;
      }

      console.log(
        `📤 Uploading icon for option ${i}: ${
          file.name || file.originalname
        }`,
      );

      // ===================================================
      // 7. FILE SIZE VALIDATION
      // ===================================================

      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: `Icon for "${options[i].label}" must be less than 5 MB.`,
        });
      }

      // ===================================================
      // 8. FILE TYPE VALIDATION
      // ===================================================

      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/svg+xml",
      ];

      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `Invalid image type for "${options[i].label}". Only JPG, PNG, WEBP, GIF and SVG are allowed.`,
        });
      }

      // ===================================================
      // 9. GET FILE BUFFER
      // ===================================================

      const fileBuffer = file.buffer || file.data;

      if (!fileBuffer) {
        return res.status(400).json({
          success: false,
          message: `Unable to read uploaded icon for "${options[i].label}".`,
        });
      }

      // ===================================================
      // 10. UPLOAD TO IMAGEKIT
      // ===================================================

      const uploadResponse = await imagekit.upload({
        file: fileBuffer,

        fileName: `${Date.now()}-${
          file.originalname || file.name
        }`,

        folder: "/date-plan-options",
      });

      console.log(
        `✅ ImageKit uploaded: ${uploadResponse.url}`,
      );

      // ===================================================
      // 11. ASSIGN IMAGEKIT URL
      // ===================================================

      options[i].icon = uploadResponse.url;
    }

    // =====================================================
    // 12. DEBUG FINAL OPTIONS
    // =====================================================

    console.log("📦 FINAL OPTIONS:");

    options.forEach((option: any, index: number) => {
      console.log(
        `Option ${index + 1}: ${option.label}`,
      );

      console.log(
        `Icon: ${
          option.icon
            ? option.icon
            : "❌ No icon"
        }`,
      );
    });

    // =====================================================
    // 13. ZOD VALIDATION
    // =====================================================

    const validatedData =
      upsertDatePlanOptionsSchema.safeParse({
        type,
        options,
      });

    if (!validatedData.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validatedData.error.issues,
      });
    }

    // =====================================================
    // 14. SAVE TO DATABASE
    // =====================================================

    const result =
      await upsertDatePlanOptionsService(
        validatedData.data.type,
        validatedData.data.options,
      );

    // =====================================================
    // 15. RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,
      message: "Options saved successfully",
      data: result,
    });

  } catch (error: any) {
    console.error(
      "❌ Upsert Date Plan Options Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Failed to save date plan options",
    });
  }
};

export const getOptions = async (req: Request, res: Response) => {
  try {
    const type = req.query.type as OptionType;

    if (type) {
      const validTypes = Object.values(OptionType);
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: [
            {
              field: "type",
              message: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
              received: type,
            },
          ],
        });
      }
    }

    const result = await getOptionsByTypeService(type);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

export const createDatePlanPackageController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const packageData = await createDatePlanPackage(req.body);

    res.status(201).json({
      success: true,
      message: "Date plan package created successfully",
      data: packageData,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateDatePlanPackageController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {

    const { id } = req.params as { id: string };

    const packageData = await updateDatePlanPackage(id, req.body);

    res.json({
      success: true,
      message: "Date plan package updated successfully",
      data: packageData,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getDatePlanPackagesController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const packages = await getDatePlanPackages();

    res.json({
      success: true,
      data: packages,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getDatePlansController = async (
  req: Request,
  res: Response
) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const search = req.query.search as string | undefined;
    const status = req.query.status as any;

    const result = await getDatePlansService({
      page,
      limit,
      search,
      status,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getDatePlanDetailsController = async (
  req: Request,
  res: Response
) => {
  try {
    const { planId } = req.params as { planId: string };

    const result = await getDatePlanDetailsService(planId);

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createDatePlanPackageInfoController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const parsed = datePlanPackageInfoSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message || "Validation failed",
      });
      return;
    }

    const result = await createDatePlanPackageInfoService(parsed.data);

    res.status(201).json({
      success: true,
      message: "Date plan package info saved successfully",
      data: result,
    });
  } catch (error) {
    console.error(
      "Create Date Plan Package Info Error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to save date plan package info",
    });
  }
};
export const getDatePlanPackageInfoController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await getDatePlanPackageInfoService();

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "Get Date Plan Package Info Error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to get date plan package info",
    });
  }
};

export const createDatePlanPackageFeaturesController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const parsed = datePlanPackageFeaturesSchema.safeParse(
      req.body,
    );

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message || "Validation failed",
      });
      return;
    }

    const result =
      await createDatePlanPackageFeaturesService(parsed.data);

    res.status(201).json({
      success: true,
      message: "Date plan package features saved successfully",
      data: result,
    });
  } catch (error) {
    console.error(
      "Create Date Plan Package Features Error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to save date plan package features",
    });
  }
};
export const getDatePlanPackageFeaturesController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result =
      await getDatePlanPackageFeaturesService();

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "Get Date Plan Package Features Error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to get date plan package features",
    });
  }
};

export const getAllDatePlanPackageDataController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await getAllDatePlanPackageDataService();

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "Get All Date Plan Package Data Error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to get date plan package data",
    });
  }
};

export const getDatePlanPackageDataController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const result = await getDatePlanPackageDataService(userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "Get All Date Plan Package Data Error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to get date plan package data",
    });
  }
};