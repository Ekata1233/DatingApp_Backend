import { Request, Response, NextFunction } from "express";
import {
  createInterestedIn,
  getAllInterestedIn,
} from "./interestedIn.service";
import imagekit from "../../../utils/imagekit";

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { flowType, title, gender } = req.body;

    // Ensure we have files
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
      images = [images]; // convert single file to array
    }

    const genders = Array.isArray(gender) ? gender : [gender];

    if (genders.length !== images.length) {
      return res.status(400).json({
        success: false,
        message: "Number of genders and images must match",
      });
    }

    // Upload all images to ImageKit
    const genderImages = await Promise.all(
      images.map(async (file: any, index: number) => {
        const uploadResponse = await imagekit.upload({
          file: file.data,
          fileName: file.name,
          folder: "/interested-in",
        });

        return {
          gender: genders[index],
          image: uploadResponse.url,
        };
      })
    );

    // Replace existing document
    const data = await createInterestedIn({
      flowType,
      title,
      genderImages,
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
  next: NextFunction
) => {
  try {
    const { flowType } = req.query;

    const data = await getAllInterestedIn(flowType as string);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// export const remove = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     await deleteInterestedIn();
//     res.json({
//       success: true,
//       message: "All InterestedIn data deleted successfully",
//     });
//   } catch (error) {
//     next(error);
//   }
// };
