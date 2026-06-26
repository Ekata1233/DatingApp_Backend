import { Request, Response } from "express";
import { OptionType } from "@prisma/client";
import {
  upsertDatePlanOptionsService,
  getOptionsByTypeService,
} from "./dateNow.service";
import { upsertDatePlanOptionsSchema } from "./dateNow.Validation";
import imagekit from "../../../utils/imagekit";

interface OptionItem {
  label: string;
  value: string;
  icon?: string;
  sortOrder?: number;
}

export const upsertDatePlanOptions = async (
  req: Request,
  res: Response
) => {
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
            received: undefined
          }
        ]
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
            message: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
            received: type
          }
        ]
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
            message: "options is required as JSON string",
            received: undefined
          }
        ]
      });
    }

    // ============ VALIDATION 4: Parse and validate options JSON ============
    let options: OptionItem[] = [];
    let rawOptions = req.body.options;
    
    try {
      // Clean the JSON string
      let cleanedOptions = rawOptions;
      cleanedOptions = cleanedOptions.replace(/,(\s*[}\]])/g, '$1');
      cleanedOptions = cleanedOptions.replace(/,\s*\]/g, ']');
      cleanedOptions = cleanedOptions.replace(/,\s*\}/g, '}');
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
            example: '[{"label":"New York","value":"ny","sortOrder":1}]',
            hint: "Check for trailing commas, missing quotes, or invalid characters"
          }
        ]
      });
    }

    // ============ VALIDATION 5: Check if options is array ============
    if (!Array.isArray(options)) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [
          {
            field: "options",
            message: "Options must be an array",
            received: typeof options
          }
        ]
      });
    }

    // ============ VALIDATION 6: Check if options is not empty ============
    if (options.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [
          {
            field: "options",
            message: "Options array cannot be empty. At least one option is required",
            received: options.length
          }
        ]
      });
    }

    // ============ VALIDATION 7: Validate each option ============
    const optionErrors: Array<{ field: string; message: string; index: number }> = [];

    options.forEach((opt, index) => {
      // Check label
      if (!opt.label || opt.label.trim() === '') {
        optionErrors.push({
          field: `options[${index}].label`,
          message: `Label is required for option at index ${index}`,
          index
        });
      }

      // Check value
      if (!opt.value || opt.value.trim() === '') {
        optionErrors.push({
          field: `options[${index}].value`,
          message: `Value is required for option at index ${index}`,
          index
        });
      }

      // Check for duplicate values
      const duplicateIndex = options.findIndex((o, i) => i !== index && o.value === opt.value);
      if (duplicateIndex !== -1) {
        optionErrors.push({
          field: `options[${index}].value`,
          message: `Duplicate value "${opt.value}" found at index ${index} and ${duplicateIndex}. Each option must have a unique value`,
          index
        });
      }

      // Validate sortOrder if provided
      if (opt.sortOrder !== undefined && (typeof opt.sortOrder !== 'number' || opt.sortOrder < 0)) {
        optionErrors.push({
          field: `options[${index}].sortOrder`,
          message: `sortOrder must be a non-negative number for option at index ${index}`,
          index
        });
      }
    });

    if (optionErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Validation failed: ${optionErrors.length} error(s) found`,
        errors: optionErrors
      });
    }

    // ============ HANDLE ICONS (OPTIONAL) ============
    const files = req.files as any;
    let iconFiles: any[] = [];

    // Check if files exist
    if (files && files.icons) {
      iconFiles = files.icons;
      if (!Array.isArray(iconFiles)) {
        iconFiles = [iconFiles];
      }

      // ============ VALIDATE FILE COUNT (IF FILES PROVIDED) ============
      if (iconFiles.length > 0 && iconFiles.length !== options.length) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: [
            {
              field: "icons",
              message: `Number of icons (${iconFiles.length}) must match number of options (${options.length})`,
              expected: options.length,
              received: iconFiles.length
            }
          ]
        });
      }

      // ============ VALIDATE EACH FILE ============
      const fileErrors: Array<{ field: string; message: string; fileName: string }> = [];

      iconFiles.forEach((file: any, index: number) => {
        // Check if file exists
        if (!file) {
          fileErrors.push({
            field: `icons[${index}]`,
            message: `File is missing for option at index ${index}`,
            fileName: 'unknown'
          });
          return;
        }

        // Check file size (1MB limit)
        if (file.size > 1024 * 1024) {
          fileErrors.push({
            field: `icons[${index}]`,
            message: `File "${file.name}" exceeds 1MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
            fileName: file.name
          });
        }

        // Check file type
        if (!file.mimetype || !file.mimetype.startsWith('image/')) {
          fileErrors.push({
            field: `icons[${index}]`,
            message: `File "${file.name}" is not an image. Only image files are allowed`,
            fileName: file.name
          });
        }

        // Check if file has data
        if (!file.data || file.data.length === 0) {
          fileErrors.push({
            field: `icons[${index}]`,
            message: `File "${file.name}" appears to be empty or corrupted`,
            fileName: file.name
          });
        }
      });

      if (fileErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: `File validation failed: ${fileErrors.length} error(s) found`,
          errors: fileErrors
        });
      }

      // ============ UPLOAD FILES TO IMAGEKIT ============
      try {
        const uploadPromises = iconFiles.map(async (file: any, index: number) => {
          const uploadResponse = await imagekit.upload({
            file: file.data,
            fileName: `${Date.now()}-${options[index].value}-${file.name}`,
            folder: "/date-plan-options",
          });

          return {
            url: uploadResponse.url,
            index
          };
        });

        const iconUrls = await Promise.all(uploadPromises);

        // Map uploaded icons to options
        iconUrls.forEach(({ url, index }) => {
          options[index].icon = url;
        });
      } catch (error: any) {
        return res.status(500).json({
          success: false,
          message: "Image upload failed",
          error: error.message || "Failed to upload images to ImageKit"
        });
      }
    } else {
      // If no icons provided, keep existing icons or set to null
      // For new options without icons, icon will be undefined
      console.log("No icons provided. Options will be created without icons.");
    }

    // ============ FINAL VALIDATION: Zod ============
    try {
      const validated = upsertDatePlanOptionsSchema.parse({
        type,
        options,
      });

      const result = await upsertDatePlanOptionsService(
        validated.type,
        validated.options
      );

      return res.status(200).json({
        success: true,
        message: "Options saved successfully",
        data: result,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
            received: err.received,
            expected: err.expected
          }))
        });
      }
      throw error;
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

export const getOptions = async (
  req: Request,
  res: Response
) => {
  try {
    const type = req.query.type as OptionType;
    
    // Validate type if provided
    if (type) {
      const validTypes = Object.values(OptionType);
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: [
            {
              field: "type",
              message: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
              received: type
            }
          ]
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