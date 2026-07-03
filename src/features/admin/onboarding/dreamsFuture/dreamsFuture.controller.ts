import { Request, Response, NextFunction } from "express";
import {
  createDreamsFuture,
  getAllDreamsFuture,
} from "./dreamsFuture.service";
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

    if (!req.files || !req.files.icons) {
      return res.status(400).json({
        success: false,
        message: "Icons are required",
      });
    }

    let icons = req.files.icons;
    if (!Array.isArray(icons)) {
      icons = [icons];
    }

    const itemNames = Array.isArray(names) ? names : [names];

    if (itemNames.length !== icons.length) {
      return res.status(400).json({
        success: false,
        message: "Names and icons count must match",
      });
    }

    // ✅ Upload to ImageKit
    const items = await Promise.all(
      icons.map(async (file: any, index: number) => {
        const uploadResponse = await imagekit.upload({
          file: file.data,
          fileName: file.name,
          folder: "/dreams-future",
        });

        return {
          name: itemNames[index],
          icon: uploadResponse.url,
        };
      })
    );

    const data = await createDreamsFuture({
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

// ✅ GET
export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { flowType } = req.query;

    const data = await getAllDreamsFuture(flowType as string);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};