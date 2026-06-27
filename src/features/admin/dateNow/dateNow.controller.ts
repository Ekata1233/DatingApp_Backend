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

// export const upsertDatePlanOptions = async (req: Request, res: Response) => {
//   try {
//     const { type } = req.body;

//     // ============ VALIDATION 1: Check type ============
//     if (!type) {
//       return res.status(400).json({
//         success: false,
//         message: "Validation failed",
//         errors: [
//           {
//             field: "type",
//             message: "type is required",
//             received: undefined,
//           },
//         ],
//       });
//     }

//     // ============ VALIDATION 2: Check if type is valid enum ============
//     const validTypes = Object.values(OptionType);
//     if (!validTypes.includes(type as OptionType)) {
//       return res.status(400).json({
//         success: false,
//         message: "Validation failed",
//         errors: [
//           {
//             field: "type",
//             message: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
//             received: type,
//           },
//         ],
//       });
//     }

//     // ============ VALIDATION 3: Check if options exist ============
//     if (!req.body.options) {
//       return res.status(400).json({
//         success: false,
//         message: "Validation failed",
//         errors: [
//           {
//             field: "options",
//             message: "options is required",
//             received: undefined,
//           },
//         ],
//       });
//     }

//     // ============ PARSE OPTIONS (Handle both string and array) ============
//     let options: OptionItem[] = [];
//     let rawOptions = req.body.options;

//     // If options is a string, parse it as JSON
//     if (typeof rawOptions === "string") {
//       try {
//         // Clean the JSON string
//         let cleanedOptions = rawOptions;
//         cleanedOptions = cleanedOptions.replace(/,(\s*[}\]])/g, "$1");
//         cleanedOptions = cleanedOptions.replace(/,\s*\]/g, "]");
//         cleanedOptions = cleanedOptions.replace(/,\s*\}/g, "}");
//         options = JSON.parse(cleanedOptions);
//       } catch (e) {
//         return res.status(400).json({
//           success: false,
//           message: "Validation failed",
//           errors: [
//             {
//               field: "options",
//               message: "Invalid JSON format. Must be a valid JSON string",
//               received: rawOptions,
//               example: '[{"label":"New York","value":"ny","sortOrder":1}]',
//               hint: "Check for trailing commas, missing quotes, or invalid characters",
//             },
//           ],
//         });
//       }
//     } else if (Array.isArray(rawOptions)) {
//       // If it's already an array, use it directly
//       options = rawOptions;
//     } else {
//       return res.status(400).json({
//         success: false,
//         message: "Validation failed",
//         errors: [
//           {
//             field: "options",
//             message: "Options must be a valid JSON string or array",
//             received: typeof rawOptions,
//           },
//         ],
//       });
//     }

//     // ============ VALIDATION 4: Check if options is array ============
//     if (!Array.isArray(options)) {
//       return res.status(400).json({
//         success: false,
//         message: "Validation failed",
//         errors: [
//           {
//             field: "options",
//             message: "Options must be an array",
//             received: typeof options,
//           },
//         ],
//       });
//     }

//     // ============ VALIDATION 5: Check if options is not empty ============
//     if (options.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Validation failed",
//         errors: [
//           {
//             field: "options",
//             message:
//               "Options array cannot be empty. At least one option is required",
//             received: options.length,
//           },
//         ],
//       });
//     }

//     // ============ VALIDATION 6: Validate each option ============
//     const optionErrors: Array<{
//       field: string;
//       message: string;
//       index: number;
//     }> = [];

//     options.forEach((opt, index) => {
//       // Check label
//       if (!opt.label || opt.label.trim() === "") {
//         optionErrors.push({
//           field: `options[${index}].label`,
//           message: `Label is required for option at index ${index}`,
//           index,
//         });
//       }

//       // Check value
//       if (!opt.value || opt.value.trim() === "") {
//         optionErrors.push({
//           field: `options[${index}].value`,
//           message: `Value is required for option at index ${index}`,
//           index,
//         });
//       }

//       // Check for duplicate values
//       const duplicateIndex = options.findIndex(
//         (o, i) => i !== index && o.value === opt.value,
//       );
//       if (duplicateIndex !== -1) {
//         optionErrors.push({
//           field: `options[${index}].value`,
//           message: `Duplicate value "${opt.value}" found at index ${index} and ${duplicateIndex}. Each option must have a unique value`,
//           index,
//         });
//       }

//       // Validate sortOrder if provided
//       if (
//         opt.sortOrder !== undefined &&
//         (typeof opt.sortOrder !== "number" || opt.sortOrder < 0)
//       ) {
//         optionErrors.push({
//           field: `options[${index}].sortOrder`,
//           message: `sortOrder must be a non-negative number for option at index ${index}`,
//           index,
//         });
//       }
//     });

//     if (optionErrors.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: `Validation failed: ${optionErrors.length} error(s) found`,
//         errors: optionErrors,
//       });
//     }
//     console.log("═══════════════════════════════════════════════");
//     console.log("🖼️  ICON DEBUG LOGS");
//     console.log("═══════════════════════════════════════════════");

//     // Log incoming options with their icons
//     console.log("📦 Options received:");
//     options.forEach((opt, index) => {
//       console.log(`  Option ${index + 1}:`);
//       console.log(`    Label: ${opt.label}`);
//       console.log(`    Value: ${opt.value}`);
//       console.log(`    Icon: ${opt.icon || "❌ No icon"}`);
//     });
//     // ============ HANDLE ICONS (COMPLETELY OPTIONAL) ============
//     const files = req.files as any;
//     let iconFiles: any[] = [];

//     // Check if files exist
//     if (files && files.icons) {
//       iconFiles = files.icons;
//       if (!Array.isArray(iconFiles)) {
//         iconFiles = [iconFiles];
//       }

//       // ============ REMOVED: File count validation ============
//       // No longer checking if icon count matches options count
//       // Icons are completely optional, can be any number (0 to N)
//       console.log(`📁 Files received: ${iconFiles.length} icon file(s)`);
//       iconFiles.forEach((file, index) => {
//         console.log(`  File ${index + 1}:`);
//         console.log(`    Name: ${file.name}`);
//         console.log(`    Size: ${(file.size / 1024).toFixed(2)} KB`);
//         console.log(`    Type: ${file.mimetype}`);
//       });
//       // ============ VALIDATE EACH FILE (if files exist) ============
//       const fileErrors: Array<{
//         field: string;
//         message: string;
//         fileName: string;
//       }> = [];

//       iconFiles.forEach((file: any, index: number) => {
//         // Check if file exists
//         if (!file) {
//           fileErrors.push({
//             field: `icons[${index}]`,
//             message: `File is missing for option at index ${index}`,
//             fileName: "unknown",
//           });
//           return;
//         }

//         // Check file size (1MB limit)
//         if (file.size > 1024 * 1024) {
//           fileErrors.push({
//             field: `icons[${index}]`,
//             message: `File "${file.name}" exceeds 1MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
//             fileName: file.name,
//           });
//         }

//         // Check file type
//         if (!file.mimetype || !file.mimetype.startsWith("image/")) {
//           fileErrors.push({
//             field: `icons[${index}]`,
//             message: `File "${file.name}" is not an image. Only image files are allowed`,
//             fileName: file.name,
//           });
//         }

//         // Check if file has data
//         if (!file.data || file.data.length === 0) {
//           fileErrors.push({
//             field: `icons[${index}]`,
//             message: `File "${file.name}" appears to be empty or corrupted`,
//             fileName: file.name,
//           });
//         }
//       });

//       if (fileErrors.length > 0) {
//         return res.status(400).json({
//           success: false,
//           message: `File validation failed: ${fileErrors.length} error(s) found`,
//           errors: fileErrors,
//         });
//       }

//       // ============ UPLOAD FILES TO IMAGEKIT ============
//       try {
//         const uploadPromises = iconFiles.map(
//           async (file: any, index: number) => {
//             // Determine which option this icon belongs to
//             // If more files than options, assign to the corresponding index
//             // If more options than files, some options won't have icons
//             const optionIndex =
//               index < options.length ? index : options.length - 1;

//             const uploadResponse = await imagekit.upload({
//               file: file.data,
//               fileName: `${Date.now()}-${options[optionIndex]?.value || "option"}-${file.name}`,
//               folder: "/date-plan-options",
//             });

//             return {
//               url: uploadResponse.url,
//               index: optionIndex,
//             };
//           },
//         );

//         const iconUrls = await Promise.all(uploadPromises);

//         // Map uploaded icons to options
//         iconUrls.forEach(({ url, index }) => {
//           if (options[index]) {
//             options[index].icon = url;
//           }
//         });
//       } catch (error: any) {
//         return res.status(500).json({
//           success: false,
//           message: "Image upload failed",
//           error: error.message || "Failed to upload images to ImageKit",
//         });
//       }
//     }

//     // ============ FINAL VALIDATION: Zod ============
//     try {
//       const validated = upsertDatePlanOptionsSchema.parse({
//         type,
//         options,
//       });

//       const result = await upsertDatePlanOptionsService(
//         validated.type,
//         validated.options,
//       );

//       return res.status(200).json({
//         success: true,
//         message: "Options saved successfully",
//         data: result,
//       });
//     } catch (error: any) {
//       if (error.name === "ZodError") {
//         return res.status(400).json({
//           success: false,
//           message: "Validation failed",
//           errors: error.errors.map((err: any) => ({
//             field: err.path.join("."),
//             message: err.message,
//             received: err.received,
//             expected: err.expected,
//           })),
//         });
//       }
//       throw error;
//     }
//   } catch (error: any) {
//     return res.status(500).json({
//       success: false,
//       message: error instanceof Error ? error.message : "Something went wrong",
//     });
//   }
// };

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

    // ============ PARSE OPTIONS (Handle both string and array) ============
    let options: OptionItem[] = [];
    let rawOptions = req.body.options;

    // If options is a string, parse it as JSON
    if (typeof rawOptions === "string") {
      try {
        // Clean the JSON string
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
              example: '[{"label":"New York","value":"ny","sortOrder":1}]',
              hint: "Check for trailing commas, missing quotes, or invalid characters",
            },
          ],
        });
      }
    } else if (Array.isArray(rawOptions)) {
      // If it's already an array, use it directly
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
            message:
              "Options array cannot be empty. At least one option is required",
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
      // Check label
      if (!opt.label || opt.label.trim() === "") {
        optionErrors.push({
          field: `options[${index}].label`,
          message: `Label is required for option at index ${index}`,
          index,
        });
      }

      // Check value
      if (!opt.value || opt.value.trim() === "") {
        optionErrors.push({
          field: `options[${index}].value`,
          message: `Value is required for option at index ${index}`,
          index,
        });
      }

      // Check for duplicate values
      const duplicateIndex = options.findIndex(
        (o, i) => i !== index && o.value === opt.value,
      );
      if (duplicateIndex !== -1) {
        optionErrors.push({
          field: `options[${index}].value`,
          message: `Duplicate value "${opt.value}" found at index ${index} and ${duplicateIndex}. Each option must have a unique value`,
          index,
        });
      }

      // Validate sortOrder if provided
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

    // Log incoming options with their icons
    console.log("📦 Options received:");
    options.forEach((opt, index) => {
      console.log(`  Option ${index + 1}:`);
      console.log(`    Label: ${opt.label}`);
      console.log(`    Value: ${opt.value}`);
      console.log(`    Icon: ${opt.icon || "❌ No icon"}`);
    });

    // ============ HANDLE ICONS (COMPLETELY OPTIONAL) ============
    const files = req.files as any;
    let iconFiles: any[] = [];

    // Check if files exist
    if (files && files.icons) {
      iconFiles = files.icons;
      if (!Array.isArray(iconFiles)) {
        iconFiles = [iconFiles];
      }

      console.log(`📁 Files received: ${iconFiles.length} icon file(s)`);
      iconFiles.forEach((file, index) => {
        console.log(`  File ${index + 1}:`);
        console.log(`    Name: ${file.name}`);
        console.log(`    Size: ${(file.size / 1024).toFixed(2)} KB`);
        console.log(`    Type: ${file.mimetype}`);
      });

      // ============ VALIDATE EACH FILE (if files exist) ============
      const fileErrors: Array<{
        field: string;
        message: string;
        fileName: string;
      }> = [];

      iconFiles.forEach((file: any, index: number) => {
        // Check if file exists
        if (!file) {
          fileErrors.push({
            field: `icons[${index}]`,
            message: `File is missing for option at index ${index}`,
            fileName: "unknown",
          });
          return;
        }

        // Check file size (1MB limit)
        if (file.size > 1024 * 1024) {
          fileErrors.push({
            field: `icons[${index}]`,
            message: `File "${file.name}" exceeds 1MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
            fileName: file.name,
          });
        }

        // Check file type
        if (!file.mimetype || !file.mimetype.startsWith("image/")) {
          fileErrors.push({
            field: `icons[${index}]`,
            message: `File "${file.name}" is not an image. Only image files are allowed`,
            fileName: file.name,
          });
        }

        // Check if file has data
        if (!file.data || file.data.length === 0) {
          fileErrors.push({
            field: `icons[${index}]`,
            message: `File "${file.name}" appears to be empty or corrupted`,
            fileName: file.name,
          });
        }
      });

      if (fileErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: `File validation failed: ${fileErrors.length} error(s) found`,
          errors: fileErrors,
        });
      }

      // ============ UPLOAD FILES TO IMAGEKIT ============
      try {
        // CORRECTED: Map files to options with icons
        // Find which options have icons (non-empty icon property)
        const optionsWithIcons: number[] = [];
        options.forEach((opt, index) => {
          if (opt.icon && opt.icon.trim() !== "") {
            optionsWithIcons.push(index);
          }
        });

        console.log(`📋 Options with icons:`, optionsWithIcons);

        // Check if number of files matches number of options with icons
        if (iconFiles.length !== optionsWithIcons.length) {
          return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: [
              {
                field: "icons",
                message: `Number of icon files (${iconFiles.length}) does not match number of options with icons (${optionsWithIcons.length})`,
                received: iconFiles.length,
                expected: optionsWithIcons.length,
              },
            ],
          });
        }

        // Upload files and map to their corresponding options
        const uploadPromises = iconFiles.map(
          async (file: any, fileIndex: number) => {
            // Get the option index for this file
            const optionIndex = optionsWithIcons[fileIndex];
            
            const uploadResponse = await imagekit.upload({
              file: file.data,
              fileName: `${Date.now()}-${options[optionIndex]?.value || "option"}-${file.name}`,
              folder: "/date-plan-options",
            });

            return {
              url: uploadResponse.url,
              optionIndex: optionIndex,
            };
          },
        );

        const iconResults = await Promise.all(uploadPromises);

        // Assign uploaded URLs to the correct options
        iconResults.forEach(({ url, optionIndex }) => {
          options[optionIndex].icon = url;
        });

        console.log("✅ Icons uploaded and assigned successfully");
        
        // Log final options with icons
        console.log("📦 Final options with icons:");
        options.forEach((opt, index) => {
          console.log(`  Option ${index + 1}:`);
          console.log(`    Label: ${opt.label}`);
          console.log(`    Value: ${opt.value}`);
          console.log(`    Icon: ${opt.icon || "❌ No icon"}`);
        });

      } catch (error: any) {
        return res.status(500).json({
          success: false,
          message: "Image upload failed",
          error: error.message || "Failed to upload images to ImageKit",
        });
      }
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
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

export const getOptions = async (req: Request, res: Response) => {
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
