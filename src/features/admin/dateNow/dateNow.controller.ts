import { Request, Response } from "express";
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
} from "./dateNow.service";
import { datePlanPackageFeaturesSchema, datePlanPackageInfoSchema, upsertDatePlanOptionsSchema } from "./dateNow.Validation";
import imagekit from "../../../utils/imagekit";

interface OptionItem {
  label: string;
  value: string;
  icon?: string | null;
  sortOrder?: number;
}

export const upsertDatePlanOptions = async (req: Request, res: Response) => {
  try {
    const { type } = req.body;


    // ============ VALIDATION 1: Check type ============
    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [
          {
            field: "type",
            message: "type is required",
            received: undefined,
          },
        ],
      });
    }

    // ============ VALIDATION 2: Check if type is valid enum ============
    const validTypes = Object.values(OptionType);
    if (!validTypes.includes(type as OptionType)) {
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

    // ============ VALIDATION 3: Check if options exist ============
    if (!req.body.options) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [
          {
            field: "options",
            message: "options is required",
            received: undefined,
          },
        ],
      });
    }

    // ============ PARSE OPTIONS ============
    let options: OptionItem[] = [];
    let rawOptions = req.body.options;

    if (typeof rawOptions === "string") {
      try {
        let cleanedOptions = rawOptions;
        cleanedOptions = cleanedOptions.replace(/,(\s*[}\]])/g, "$1");
        cleanedOptions = cleanedOptions.replace(/,\s*\]/g, "]");
        cleanedOptions = cleanedOptions.replace(/,\s*\}/g, "}");
        options = JSON.parse(cleanedOptions);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: [
            {
              field: "options",
              message: "Invalid JSON format. Must be a valid JSON string",
              received: rawOptions,
            },
          ],
        });
      }
    } else if (Array.isArray(rawOptions)) {
      options = rawOptions;
    } else {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [
          {
            field: "options",
            message: "Options must be a valid JSON string or array",
            received: typeof rawOptions,
          },
        ],
      });
    }

    // ============ VALIDATION 4: Check if options is array ============
    if (!Array.isArray(options)) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [
          {
            field: "options",
            message: "Options must be an array",
            received: typeof options,
          },
        ],
      });
    }

    // ============ VALIDATION 5: Check if options is not empty ============
    if (options.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [
          {
            field: "options",
            message: "Options array cannot be empty. At least one option is required",
            received: options.length,
          },
        ],
      });
    }

    // ============ VALIDATION 6: Validate each option ============
    const optionErrors: Array<{
      field: string;
      message: string;
      index: number;
    }> = [];

    options.forEach((opt, index) => {
      if (!opt || typeof opt !== 'object') {
        optionErrors.push({
          field: `options[${index}]`,
          message: `Option at index ${index} is invalid`,
          index,
        });
        return;
      }

      if (!opt.label || opt.label.trim() === "") {
        optionErrors.push({
          field: `options[${index}].label`,
          message: `Label is required for option at index ${index}`,
          index,
        });
      }

      if (!opt.value || opt.value.trim() === "") {
        optionErrors.push({
          field: `options[${index}].value`,
          message: `Value is required for option at index ${index}`,
          index,
        });
      }

      const duplicateIndex = options.findIndex(
        (o, i) => i !== index && o && o.value === opt.value,
      );
      if (duplicateIndex !== -1) {
        optionErrors.push({
          field: `options[${index}].value`,
          message: `Duplicate value "${opt.value}" found at index ${index} and ${duplicateIndex}`,
          index,
        });
      }

      if (
        opt.sortOrder !== undefined &&
        (typeof opt.sortOrder !== "number" || opt.sortOrder < 0)
      ) {
        optionErrors.push({
          field: `options[${index}].sortOrder`,
          message: `sortOrder must be a non-negative number for option at index ${index}`,
          index,
        });
      }
    });

    if (optionErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Validation failed: ${optionErrors.length} error(s) found`,
        errors: optionErrors,
      });
    }

    console.log("═══════════════════════════════════════════════");
    console.log("🖼️  ICON DEBUG LOGS");
    console.log("═══════════════════════════════════════════════");

    // ============ HANDLE FILES ============
    const files = req.files as any;

    console.log("📁 Raw req.files:", JSON.stringify(files, null, 2));

    // ============ EXTRACT ICON FILES WITH INDEX MAPPING ============
    let iconFileMap: Map<number, any> = new Map();

    if (files) {
      if (Array.isArray(files)) {
        files.forEach((file, index) => {
          iconFileMap.set(index, file);
        });
        console.log(`📁 Found ${iconFileMap.size} files in array`);
      } else if (typeof files === 'object' && !Array.isArray(files)) {
        const iconKeys = Object.keys(files).filter(key => key.startsWith('icons'));

        if (iconKeys.length > 0) {
          console.log(`📁 Found ${iconKeys.length} icon field(s): ${iconKeys.join(', ')}`);

          iconKeys.forEach(key => {
            const match = key.match(/\[(\d+)\]/);
            if (match) {
              const index = parseInt(match[1]);
              const file = files[key];
              const fileData = Array.isArray(file) ? file[0] : file;
              if (fileData) {
                iconFileMap.set(index, fileData);
                console.log(`  ✅ Mapped ${key} -> option index ${index}`);
              }
            } else if (key === 'icons') {
              const fileData = Array.isArray(files.icons) ? files.icons : [files.icons];
              fileData.forEach((file: any, idx: number) => {
                iconFileMap.set(idx, file);
                console.log(`  ✅ Mapped icons[${idx}] -> option index ${idx}`);
              });
            }
          });
        } else {
          console.log('ℹ️ No icon fields found');
        }
      }
    }

    console.log(`📁 Total icon files found: ${iconFileMap.size}`);

    for (const [index, file] of iconFileMap.entries()) {
      console.log(`  File for option ${index}:`);
      console.log(`    Name: ${file.originalname || file.name}`);
      console.log(`    Size: ${(file.size / 1024).toFixed(2)} KB`);
      console.log(`    Type: ${file.mimetype}`);
    }

    // ============ VALIDATE EACH FILE ============
    const fileErrors: Array<{
      field: string;
      message: string;
      fileName: string;
    }> = [];

    for (const [index, file] of iconFileMap.entries()) {
      if (!file) {
        fileErrors.push({
          field: `icons[${index}]`,
          message: `File is missing for option at index ${index}`,
          fileName: "unknown",
        });
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        fileErrors.push({
          field: `icons[${index}]`,
          message: `File "${file.originalname || file.name}" exceeds 5MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
          fileName: file.originalname || file.name,
        });
      }

      const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!file.mimetype || !validMimeTypes.includes(file.mimetype)) {
        fileErrors.push({
          field: `icons[${index}]`,
          message: `File "${file.originalname || file.name}" is not a valid image. Allowed types: ${validMimeTypes.join(', ')}`,
          fileName: file.originalname || file.name,
        });
      }

      if (!file.buffer && !file.data) {
        fileErrors.push({
          field: `icons[${index}]`,
          message: `File "${file.originalname || file.name}" appears to be empty or corrupted`,
          fileName: file.originalname || file.name,
        });
      }
    }

    if (fileErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: `File validation failed: ${fileErrors.length} error(s) found`,
        errors: fileErrors,
      });
    }

    // ============ UPLOAD FILES TO IMAGEKIT ============
    if (iconFileMap.size > 0) {
      try {
        console.log(`🔄 Uploading ${iconFileMap.size} icon(s) to ImageKit...`);

        const uploadPromises = Array.from(iconFileMap.entries()).map(async ([optionIndex, file]) => {
          console.log(`  Uploading file for option ${optionIndex}: ${file.originalname || file.name}`);

          const uploadResponse = await imagekit.upload({
            file: file.buffer || file.data,
            fileName: `${Date.now()}-${options[optionIndex]?.value || 'option'}-${file.originalname || file.name}`,
            folder: "/date-plan-options",
          });

          console.log(`  ✅ Uploaded to: ${uploadResponse.url}`);

          return {
            url: uploadResponse.url,
            optionIndex: optionIndex,
          };
        });

        const uploadResults = await Promise.all(uploadPromises);

        // ============ CRITICAL FIX: Set icons for uploaded files ============


        // Then set icons for uploaded files
        uploadResults.forEach(({ url, optionIndex }) => {
          if (options[optionIndex]) {
            options[optionIndex].icon = url;
            console.log(`  ✅ Assigned icon to option ${optionIndex}: ${options[optionIndex].label}`);
          }
        });

        console.log(`✅ Successfully uploaded ${uploadResults.length} icon(s)`);
      } catch (error: any) {
        console.error('❌ Image upload failed:', error);
        return res.status(500).json({
          success: false,
          message: "Image upload failed",
          error: error.message || "Failed to upload images to ImageKit",
        });
      }
    } else {
      console.log("ℹ️ No new icons uploaded");
    }

    console.log('📦 Final options with icons:');
    options.forEach((opt, index) => {
      if (opt) {
        console.log(`  Option ${index + 1}: ${opt.label} -> Icon: ${opt.icon || '❌ No icon'}`);
      }
    });

    // ============ FINAL VALIDATION: Zod ============
    try {
      // Filter out any invalid options before validation
      const validOptions = options
        .filter(opt => opt && typeof opt === "object" && opt.label && opt.value)
        .map(opt => ({
          ...opt,
        }));

      if (validOptions.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: [
            {
              field: "options",
              message: "No valid options found",
            },
          ],
        });
      }

      const validated = upsertDatePlanOptionsSchema.parse({
        type,
        options: validOptions,
      });

      const result = await upsertDatePlanOptionsService(
        validated.type,
        validated.options as any,
      );

      return res.status(200).json({
        success: true,
        message: "Options saved successfully",
        data: result,
      });
    } catch (error: any) {
      console.error('❌ Zod validation error:', error);
      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.errors.map((err: any) => ({
            field: err.path.join("."),
            message: err.message,
            received: err.received,
            expected: err.expected,
          })),
        });
      }
      throw error;
    }
  } catch (error: any) {
    console.error('❌ Fatal error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
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