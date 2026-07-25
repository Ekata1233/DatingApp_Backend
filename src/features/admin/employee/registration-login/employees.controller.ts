import { Request, Response } from "express";
import { loginEmployeeSchema, registerEmployeeSchema } from "./employees.validation";
import { loginEmployeeService, registerEmployeeService } from "./employees.service";
import { RegisterEmployeeBody } from "./employees.types";
import imagekit from "../../../../utils/imagekit";

export const registerEmployeeController = async (
  req: Request,
  res: Response
) => {
  try {
    const body = req.body as RegisterEmployeeBody;

    let imageUrl: string | undefined;

    const files = req.files as any;

    if (files?.image) {
      const imageFile = Array.isArray(files.image)
        ? files.image[0]
        : files.image;

      // Validate image size (5 MB)
      if (imageFile.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: "Image size must be less than 5 MB.",
        });
      }

      // Validate image type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];

      if (!allowedTypes.includes(imageFile.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "Only JPG, PNG and WEBP images are allowed.",
        });
      }

      // Upload to ImageKit
      const uploadResponse = await imagekit.upload({
        file: imageFile.buffer || imageFile.data,
        fileName: `${Date.now()}-${imageFile.originalname}`,
        folder: "/employees",
      });

      imageUrl = uploadResponse.url;
    }

    const validatedData = registerEmployeeSchema.parse({
      ...body,
      image: imageUrl,
    });

    const employee = await registerEmployeeService(validatedData);

    return res.status(201).json({
      success: true,
      message: "Employee registered successfully.",
      data: employee,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error?.errors?.[0]?.message ||
        error.message ||
        "Something went wrong",
    });
  }
};


export const loginEmployeeController = async (
  req: Request,
  res: Response
) => {
  try {
    const body =
      loginEmployeeSchema.parse(req.body);

    const result =
      await loginEmployeeService(body);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};