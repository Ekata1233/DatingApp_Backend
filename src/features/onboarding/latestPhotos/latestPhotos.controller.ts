import { Request, Response, NextFunction } from "express";
import {
  createLatestPhotos,
  getLatestPhotos,
  deleteLatestPhotos,
  updateSinglePhoto,
} from "./latestPhotos.service";
import imagekit from "../../../utils/imagekit";

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, description } = req.body;

    if (!req.files || !req.files.images) {
      return res.status(400).json({
        success: false,
        message: "Images are required",
      });
    }

    let images: any = req.files.images;

    if (!Array.isArray(images)) {
      images = [images];
    }

    // Upload images
    const uploadedPhotos = await Promise.all(
      images.map(async (file: any) => {
        const uploadResponse = await imagekit.upload({
          file: file.data,
          fileName: file.name,
          folder: "/latest-photos",
        });

        return {
          image: uploadResponse.url,
        };
      })
    );

    const data = await createLatestPhotos({
      title,
      description,
      photos: uploadedPhotos,
    });

    res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getOne = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getLatestPhotos();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await deleteLatestPhotos();
    res.json({
      success: true,
      message: "LatestPhotos deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Update specific photo
export const updatePhoto = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { photoId } = req.params;

    if (!req.files || !req.files.image) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    const file: any = req.files.image;

    const uploadResponse = await imagekit.upload({
      file: file.data,
      fileName: file.name,
      folder: "/latest-photos",
    });

    const updated = await updateSinglePhoto(
      photoId,
      uploadResponse.url
    );

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
