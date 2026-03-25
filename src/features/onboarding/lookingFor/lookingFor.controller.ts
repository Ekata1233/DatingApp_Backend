import { Request, Response, NextFunction } from "express";
import {
  createLookingFor,
  getAllLookingFor,
  deleteLookingFor,
} from "./lookingFor.service";
import imagekit from "../../../utils/imagekit";

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
const { flowType, title, description } = req.body;

let { options } = req.body;

// ✅ Parse options if string (from form-data)
if (typeof options === "string") {
  try {
    options = JSON.parse(options);
  } catch (e) {
    options = [];
  }
}
    if (!flowType) {
      return res.status(400).json({
        success: false,
        message: "flowType is required",
      });
    }

    if (!req.files || !req.files.images) {
      return res.status(400).json({
        success: false,
        message: "Images are required",
      });
    }

    let images = req.files.images;

    if (!Array.isArray(images)) {
      images = [images];
    }

    const descriptions = Array.isArray(description)
      ? description
      : [description];

    if (descriptions.length !== images.length) {
      return res.status(400).json({
        success: false,
        message: "Number of descriptions and images must match",
      });
    }

    // Upload images to ImageKit
    const items = await Promise.all(
      images.map(async (file: any, index: number) => {
        const uploadResponse = await imagekit.upload({
          file: file.data,
          fileName: file.name,
          folder: "/looking-for",
        });

        return {
          image: uploadResponse.url,
          description: descriptions[index],
          options: Array.isArray(options?.[index]) ? options[index] : [],
        };
      }),
    );

    const data = await createLookingFor({
      flowType,
      title,
      items,
    });

    res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await getAllLookingFor();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await deleteLookingFor();
    res.json({
      success: true,
      message: "All LookingFor data deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
