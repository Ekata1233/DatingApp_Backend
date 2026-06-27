import { Request, Response } from "express";
import { OptionType } from "@prisma/client";
import {
  upsertDatePlanOptionsService,
  getOptionsByTypeService,
  createDatePlanPackage,
  updateDatePlanPackage,
  getDatePlanPackages,
} from "./dateNow.service";
import { upsertDatePlanOptionsSchema } from "./dateNow.Validation";
import imagekit from "../../../utils/imagekit";

interface OptionItem {
  label: string;
  value: string;
  icon?: string;
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
        (o, i) => i !== index && o.value === opt.value,
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
      // Case 1: files is an array (multer with array('icons'))
      if (Array.isArray(files)) {
        // For array approach, files are in order: icons[0], icons[1], icons[2], etc.
        files.forEach((file, index) => {
          iconFileMap.set(index, file);
        });
        console.log(`📁 Found ${iconFileMap.size} files in array`);
      }
      // Case 2: files is an object with field names
      else if (typeof files === 'object' && !Array.isArray(files)) {
        // Get all keys that start with 'icons'
        const iconKeys = Object.keys(files).filter(key => key.startsWith('icons'));
        
        if (iconKeys.length > 0) {
          console.log(`📁 Found ${iconKeys.length} icon field(s): ${iconKeys.join(', ')}`);
          
          iconKeys.forEach(key => {
            // Extract index from key like 'icons[0]' -> 0
            const match = key.match(/\[(\d+)\]/);
            if (match) {
              const index = parseInt(match[1]);
              const file = files[key];
              // If multiple files for same key, take the first one
              const fileData = Array.isArray(file) ? file[0] : file;
              if (fileData) {
                iconFileMap.set(index, fileData);
                console.log(`  ✅ Mapped ${key} -> option index ${index}`);
              }
            } else if (key === 'icons') {
              // Handle 'icons' without index (for array approach)
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

    // ============ LOG FILE DETAILS ============
    console.log(`📁 Total icon files found: ${iconFileMap.size}`);
    
    // Log each file with its index
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

      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        fileErrors.push({
          field: `icons[${index}]`,
          message: `File "${file.originalname || file.name}" exceeds 5MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
          fileName: file.originalname || file.name,
        });
      }

      // Check file type
      const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!file.mimetype || !validMimeTypes.includes(file.mimetype)) {
        fileErrors.push({
          field: `icons[${index}]`,
          message: `File "${file.originalname || file.name}" is not a valid image. Allowed types: ${validMimeTypes.join(', ')}`,
          fileName: file.originalname || file.name,
        });
      }

      // Check if file has data
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

    // ============ UPLOAD FILES TO IMAGEKIT (Index-wise) ============
    if (iconFileMap.size > 0) {
      try {
        console.log(`🔄 Uploading ${iconFileMap.size} icon(s) to ImageKit...`);
        
        // Upload each file and assign to its specific option index
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

        // Map uploaded icons to options
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
      console.log('ℹ️ No icons to upload');
    }

    // ============ FINAL VALIDATION: Zod ============
    try {
      const validated = upsertDatePlanOptionsSchema.parse({
        type,
        options,
      });

      const result = await upsertDatePlanOptionsService(
        validated.type,
        validated.options,
      );

      return res.status(200).json({
        success: true,
        message: "Options saved successfully",
        data: result,
      });
    } catch (error: any) {
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
    const packageData = await updateDatePlanPackage(req.params.id, req.body);

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