import { Request, Response, NextFunction } from "express";
import {
  createInterestHobbies,
  getAllInterestHobbies,
} from "./interestHobbies.service";
import imagekit from "../../../../utils/imagekit";

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { flowType, title, subtitle, names } = req.body;

    if (!flowType) {
      return res.status(400).json({
        success: false,
        message: "flowType is required",
      });
    }

    /* ================= GET EXISTING IMAGES ================= */
    const existingImages = req.body.existingImages
      ? Array.isArray(req.body.existingImages)
        ? req.body.existingImages
        : [req.body.existingImages]
      : [];

    /* ================= HANDLE FILES ================= */
    let icons: any[] = [];

    if (req.files && req.files.icons) {
      icons = Array.isArray(req.files.icons)
        ? req.files.icons
        : [req.files.icons];
    }

    const itemNames = Array.isArray(names) ? names : [names];

    /* ================= VALIDATION ================= */
    if (itemNames.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one item name is required",
      });
    }

    if (icons.length === 0 && existingImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one icon is required",
      });
    }

    /* ================= UPLOAD NEW IMAGES ================= */
    let uploadedItems: any[] = [];

    if (icons.length > 0) {
      uploadedItems = await Promise.all(
        icons.map(async (file: any, index: number) => {
          const uploadResponse = await imagekit.upload({
            file: file.data,
            fileName: file.name,
            folder: "/interest-hobbies",
          });

          return {
            name: itemNames[index] || "Unknown",
            icon: uploadResponse.url,
          };
        })
      );
    }

    /* ================= KEEP EXISTING IMAGES ================= */
    const existingItems = existingImages.map((img: string, index: number) => ({
      name: itemNames[index] || "Unknown",
      icon: img,
    }));

    /* ================= FINAL MERGE ================= */
    const items = [...existingItems, ...uploadedItems];

    /* ================= SAVE (UPSERT) ================= */
    const data = await createInterestHobbies({
      flowType,
      title,
      subtitle,
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

/* ================= GET ================= */
export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { flowType } = req.query;

    const data = await getAllInterestHobbies(flowType as string);
    console.log("Retrieved Interest & Hobbies:", data);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
