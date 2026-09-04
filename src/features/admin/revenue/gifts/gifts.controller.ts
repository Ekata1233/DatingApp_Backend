import { Request, Response, NextFunction } from "express";
import {
  createGiftCategoryService,
  getGiftCategoriesService,
  getGiftCategoryByIdService,
  updateGiftCategoryService,
  deleteGiftCategoryService,
   createGiftService,
  updateGiftService,
  getAllGiftService,
  getGiftByIdService,
  deleteGiftService,
  changeGiftStatusService,
} from "./gifts.service";
import imagekit from "../../../../utils/imagekit";

/**
 * Create Gift Category
 */
export const createGiftCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const category = await createGiftCategoryService(req.body);

    return res.status(201).json({
      success: true,
      message: "Gift category created successfully.",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Gift Categories
 */
export const getGiftCategoriesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await getGiftCategoriesService();

    return res.status(200).json({
      success: true,
      message: "Gift categories fetched successfully.",
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Gift Category By Id
 */
export const getGiftCategoryByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);

    const category = await getGiftCategoryByIdService(id);

    return res.status(200).json({
      success: true,
      message: "Gift category fetched successfully.",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Gift Category
 */
export const updateGiftCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);

    const category = await updateGiftCategoryService(id, req.body);

    return res.status(200).json({
      success: true,
      message: "Gift category updated successfully.",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Gift Category
 */
export const deleteGiftCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);

    await deleteGiftCategoryService(id);

    return res.status(200).json({
      success: true,
      message: "Gift category deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};




/**
 * Create Gift
 */
export const createGiftController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      categoryId,
      name,
      coinCost,
      triggerLine,
      receiverLine,
      isLive,
    } = req.body;

    // ================= VALIDATION =================

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category is required.",
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Gift name is required.",
      });
    }

    if (!coinCost) {
      return res.status(400).json({
        success: false,
        message: "Coin cost is required.",
      });
    }

    const files = req.files as any;

    if (!files?.image) {
      return res.status(400).json({
        success: false,
        message: "Gift image is required.",
      });
    }

    const image = Array.isArray(files.image)
      ? files.image[0]
      : files.image;

    // ================= IMAGE VALIDATION =================

    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
      "image/gif",
    ];

    if (!allowedMimeTypes.includes(image.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Only jpg, jpeg, png, webp and gif are allowed.",
      });
    }

    if (image.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "Image size must be less than 5 MB.",
      });
    }

    // ================= IMAGEKIT UPLOAD =================

    const uploadResponse = await imagekit.upload({
      file: image.buffer || image.data,
      fileName: `${Date.now()}-${image.name}`,
      folder: "/gift",
    });

    // ================= CREATE =================

    const gift = await createGiftService({
      categoryId: Number(categoryId),
      image: uploadResponse.url,
      name,
      coinCost: Number(coinCost),
      triggerLine,
      receiverLine,
      isLive:
        isLive !== undefined
          ? isLive === "true" || isLive === true
          : true, // Default true
    });

    return res.status(201).json({
      success: true,
      message: "Gift created successfully.",
      data: gift,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Gift
 */
export const updateGiftController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);

    const {
      categoryId,
      name,
      coinCost,
      triggerLine,
      receiverLine,
      isLive,
    } = req.body;

    const updateData: any = {};

    if (categoryId !== undefined) {
      updateData.categoryId = Number(categoryId);
    }

    if (name !== undefined) {
      updateData.name = name;
    }

    if (coinCost !== undefined) {
      updateData.coinCost = Number(coinCost);
    }

    if (triggerLine !== undefined) {
      updateData.triggerLine = triggerLine;
    }

    if (receiverLine !== undefined) {
      updateData.receiverLine = receiverLine;
    }

    if (isLive !== undefined) {
      updateData.isLive =
        isLive === "true" || isLive === true;
    }

    // ================= OPTIONAL IMAGE =================

    const files = req.files as any;

    if (files?.image) {
      const image = Array.isArray(files.image)
        ? files.image[0]
        : files.image;

      const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/jpg",
        "image/gif",
      ];

      if (!allowedMimeTypes.includes(image.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "Only jpg, jpeg, png, webp and gif are allowed.",
        });
      }

      if (image.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: "Image size must be less than 5 MB.",
        });
      }

      const uploadResponse = await imagekit.upload({
        file: image.buffer || image.data,
        fileName: `${Date.now()}-${image.name}`,
        folder: "/gift",
      });

      updateData.image = uploadResponse.url;
    }

    const gift = await updateGiftService(id, updateData);

    return res.status(200).json({
      success: true,
      message: "Gift updated successfully.",
      data: gift,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Gifts
 */
/**
 * Get All Gifts
 * GET /gift/list
 * GET /gift/list?categoryId=1
 */
export const getAllGiftController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categoryId = req.query.categoryId
      ? Number(req.query.categoryId)
      : undefined;

    // ================= VALIDATION =================

    if (
      req.query.categoryId &&
      (Number.isNaN(categoryId) || categoryId! <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid categoryId.",
      });
    }

    const gifts = await getAllGiftService(categoryId);

    return res.status(200).json({
      success: true,
      message: categoryId
        ? "Category wise gift list fetched successfully."
        : "Gift list fetched successfully.",
      data: gifts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Gift By Id
 */
export const getGiftByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);

    const gift = await getGiftByIdService(id);

    return res.status(200).json({
      success: true,
      message: "Gift fetched successfully.",
      data: gift,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Gift
 */
export const deleteGiftController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);

    await deleteGiftService(id);

    return res.status(200).json({
      success: true,
      message: "Gift deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};