// import { Request, Response } from "express";
// import { createPackageSchema } from "./package.validation";
// import { createPackageService } from "./package.service";

// export const createPackageController = async (
//   req: Request,
//   res: Response
// ) => {
//   try {
//     const parsed = createPackageSchema.safeParse(
//       req.body
//     );

//     if (!parsed.success) {
//       return res.status(400).json({
//         success: false,
//         message:
//           parsed.error.issues[0].message,
//       });
//     }

//     const result = await createPackageService(
//       parsed.data
//     );

//     return res.status(201).json({
//       success: true,
//       message:
//         "Package created successfully",
//       data: result,
//     });
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       success: false,
//       message:
//         "Internal server error",
//     });
//   }
// };

import { Request, Response } from "express";
import { createPackageSchema } from "./package.validation";
import { createOrUpdatePackageService } from "./package.service";

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
