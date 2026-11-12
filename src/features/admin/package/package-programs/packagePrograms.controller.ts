
import { Request, Response, NextFunction } from "express";
import { PackageType } from "@prisma/client";
import { randomUUID } from "crypto";
import { UploadedFile } from "express-fileupload";

import imagekit from "../../../../utils/imagekit";
import * as PackageProgramService from "./packagePrograms.service";

import {
  CreatePackageProgramInput,
  UpdatePackageProgramInput,
  PackageProgramDestinationInput,
  UploadedPackageProgramImage,
} from "./packagePrograms.types";

// ==========================================
// CONSTANTS
// ==========================================

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 20;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

// ==========================================
// CUSTOM ERROR
// ==========================================

const badRequest = (message: string) =>
  Object.assign(new Error(message), { statusCode: 400 });

// ==========================================
// PARSE REQUEST BODY
// ==========================================

const parseRequestBody = (body: any) => {
  const data = { ...(body || {}) };

  for (const field of ["tags", "destinations"]) {
    if (typeof data[field] === "string") {
      try {
        data[field] = JSON.parse(data[field]);
      } catch {
        throw badRequest(`Invalid ${field} JSON`);
      }
    }
  }

const parseBoolean = (
  value: unknown,
  field: string
): boolean => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true" || normalized === "1") {
      return true;
    }

    if (normalized === "false" || normalized === "0") {
      return false;
    }
  }

  throw badRequest(`Invalid ${field}`);
};

  const parseSortOrder = (value: unknown, field: string) => {
    if (value === null || value === "") {
      throw badRequest(`Invalid ${field}`);
    }

    const number = Number(value);

    if (!Number.isInteger(number) || number < 0) {
      throw badRequest(`Invalid ${field}`);
    }

    return number;
  };
if (
  data.isActive === undefined ||
  data.isActive === null ||
  data.isActive === ""
) {
  delete data.isActive;
} else {
  data.isActive = parseBoolean(
    data.isActive,
    "isActive"
  );
}

  if (data.sortOrder !== undefined) {
    data.sortOrder = parseSortOrder(
      data.sortOrder,
      "sortOrder"
    );
  }

  if (Array.isArray(data.destinations)) {
    data.destinations = data.destinations.map(
      (destination: any) => {
        if (
          !destination ||
          typeof destination !== "object" ||
          Array.isArray(destination)
        ) {
          throw badRequest("Invalid destination object");
        }

        const item = { ...destination };

        if (item.imageIndex !== undefined) {
          item.imageIndex = parseSortOrder(
            item.imageIndex,
            "imageIndex"
          );
        }

        if (item.sortOrder !== undefined) {
          item.sortOrder = parseSortOrder(
            item.sortOrder,
            "destination sortOrder"
          );
        }

        if (item.isActive !== undefined) {
          item.isActive = parseBoolean(
            item.isActive,
            "destination isActive"
          );
        }

        return item;
      }
    );
  }

  return data;
};

// ==========================================
// VALIDATE REQUEST BODY
// ==========================================

const validateBody = (body: any, isCreate: boolean) => {
  if (
    (isCreate || body.packageType !== undefined) &&
    !Object.values(PackageType).includes(body.packageType)
  ) {
    throw badRequest("Invalid packageType");
  }

  if (
    (isCreate || body.title !== undefined) &&
    (typeof body.title !== "string" || !body.title.trim())
  ) {
    throw badRequest("Title is required");
  }

  if (
    body.tags !== undefined &&
    (!Array.isArray(body.tags) ||
      !body.tags.every((tag: unknown) =>
        typeof tag === "string"
      ))
  ) {
    throw badRequest("Tags must be an array of strings");
  }

  if (
    body.destinations !== undefined &&
    !Array.isArray(body.destinations)
  ) {
    throw badRequest("Destinations must be an array");
  }
};

// ==========================================
// GET IMAGES FROM req.files
// ==========================================

const getImageFiles = (req: Request): UploadedFile[] => {
  const files = req.files;

  if (!files) return [];

  const rawImages = files.images;

  if (!rawImages) return [];

  return Array.isArray(rawImages)
    ? rawImages
    : [rawImages];
};

// ==========================================
// VALIDATE FILES
// ==========================================

const validateFiles = (files: UploadedFile[]) => {
  if (files.length > MAX_IMAGES) {
    throw badRequest("Maximum 20 images are allowed");
  }

  for (const file of files) {
    if (file.truncated) {
      throw badRequest(`Image ${file.name} is truncated`);
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw badRequest(
        `${file.name} must be less than 5 MB`
      );
    }

    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw badRequest(
        `${file.name} must be JPG, PNG or WEBP`
      );
    }

    if (!file.data || file.data.length === 0) {
      throw badRequest(
        `Image buffer missing for ${file.name}`
      );
    }
  }
};

// ==========================================
// VALIDATE DESTINATION MAPPING
// ==========================================

const validateDestinationMapping = (
  destinations: PackageProgramDestinationInput[] | undefined,
  fileCount: number,
  isCreate: boolean
) => {
  if (!destinations) {
    if (fileCount > 0) {
      throw badRequest(
        "Destinations are required when uploading images"
      );
    }
    return;
  }

  const indices: number[] = [];

  for (const destination of destinations) {
    if (
      typeof destination.city !== "string" ||
      !destination.city.trim()
    ) {
      throw badRequest("Destination city is required");
    }

    if (isCreate && destination.id) {
      throw badRequest(
        "Destination ID is not allowed while creating"
      );
    }

    if (
      !destination.id &&
      destination.imageIndex === undefined
    ) {
      throw badRequest(
        `Image is required for ${destination.city}`
      );
    }

    if (destination.imageIndex !== undefined) {
      if (
        !Number.isInteger(destination.imageIndex) ||
        destination.imageIndex < 0 ||
        destination.imageIndex >= fileCount
      ) {
        throw badRequest(
          `Invalid imageIndex for ${destination.city}`
        );
      }

      indices.push(destination.imageIndex);
    }
  }

  if (
    indices.length !== fileCount ||
    new Set(indices).size !== fileCount
  ) {
    throw badRequest(
      "Every uploaded image must belong to exactly one destination"
    );
  }
};

// ==========================================
// CLEANUP UPLOADED IMAGES
// ==========================================

const cleanupImages = async (
  images: UploadedPackageProgramImage[]
) => {
  const results = await Promise.allSettled(
    images.map((image) =>
      imagekit.deleteFile(image.imageFileId)
    )
  );

  results.forEach((result) => {
    if (result.status === "rejected") {
      console.error(
        "ImageKit cleanup failed:",
        result.reason
      );
    }
  });
};

// ==========================================
// UPLOAD IMAGES TO IMAGEKIT
// ==========================================

const uploadPackageImages = async (
  files: UploadedFile[],
  uploaded: UploadedPackageProgramImage[]
) => {
  for (const file of files) {
    const fileBuffer = file.data;

    const uploadResponse = await imagekit.upload({
      file: fileBuffer,
      fileName: `${Date.now()}-${randomUUID()}-${file.name}`,
      folder: "/package-programs",
    });

    uploaded.push({
      imageUrl: uploadResponse.url,
      imageFileId: uploadResponse.fileId,
    });
  }
};

// ==========================================
// ERROR RESPONSE
// ==========================================

const handleError = (res: Response, error: any) => {
  console.error("Package Program Error:", error);

  return res.status(error?.statusCode || 400).json({
    success: false,
    message: error?.message || "Something went wrong",
  });
};

// ==========================================
// CREATE PACKAGE PROGRAM
// ==========================================

export const createPackageProgramController = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const uploadedImages: UploadedPackageProgramImage[] = [];

  try {
    const body = parseRequestBody(req.body);

    validateBody(body, true);

    const files = getImageFiles(req);

    validateFiles(files);

    validateDestinationMapping(
      body.destinations,
      files.length,
      true
    );

    // Upload images to ImageKit
    await uploadPackageImages(files, uploadedImages);

    // Save URLs and file IDs using Prisma service
    const program =
      await PackageProgramService.createPackageProgramService(
        body as CreatePackageProgramInput,
        uploadedImages
      );

    return res.status(201).json({
      success: true,
      message: "Package program created successfully",
      data: program,
    });
  } catch (error: any) {
    await cleanupImages(uploadedImages);
    return handleError(res, error);
  }
};

// ==========================================
// GET ALL PACKAGE PROGRAMS
// ==========================================

export const getAllPackageProgramsController = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const packageType = req.query.packageType as
      | PackageType
      | undefined;

    const isActiveQuery = req.query.isActive;

    if (
      packageType &&
      !Object.values(PackageType).includes(packageType)
    ) {
      throw badRequest("Invalid packageType");
    }

    if (
      isActiveQuery !== undefined &&
      isActiveQuery !== "true" &&
      isActiveQuery !== "false"
    ) {
      throw badRequest("Invalid isActive");
    }

    const programs =
      await PackageProgramService.getAllPackageProgramsService({
        packageType,
        isActive:
          isActiveQuery === undefined
            ? undefined
            : isActiveQuery === "true",
      });

    return res.status(200).json({
      success: true,
      message: "Package programs fetched successfully",
      data: programs,
    });
  } catch (error: any) {
    return handleError(res, error);
  }
};

// ==========================================
// GET PACKAGE PROGRAM BY ID
// ==========================================

export const getPackageProgramByIdController = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    const program =
      await PackageProgramService.getPackageProgramByIdService(
        id
      );

    return res.status(200).json({
      success: true,
      message: "Package program fetched successfully",
      data: program,
    });
  } catch (error: any) {
    return handleError(res, error);
  }
};

// ==========================================
// UPDATE PACKAGE PROGRAM
// ==========================================

export const updatePackageProgramController = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const uploadedImages: UploadedPackageProgramImage[] = [];

  try {
    const id = req.params.id as string;
    const body = parseRequestBody(req.body);

    validateBody(body, false);

    const files = getImageFiles(req);

    validateFiles(files);

    validateDestinationMapping(
      body.destinations,
      files.length,
      false
    );

    // Check IDs before uploading to ImageKit
    await PackageProgramService.validatePackageProgramUpdate(
      id,
      body.destinations
    );

    await uploadPackageImages(files, uploadedImages);

    const program =
      await PackageProgramService.updatePackageProgramService(
        id,
        body as UpdatePackageProgramInput,
        uploadedImages
      );

    return res.status(200).json({
      success: true,
      message: "Package program updated successfully",
      data: program,
    });
  } catch (error: any) {
    await cleanupImages(uploadedImages);
    return handleError(res, error);
  }
};

// ==========================================
// DELETE PACKAGE PROGRAM
// ==========================================

export const deletePackageProgramController = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    const result =
      await PackageProgramService.deletePackageProgramService(
        id
      );

    return res.status(200).json({
      success: true,
      message: "Package program deleted successfully",
      data: result,
    });
  } catch (error: any) {
    return handleError(res, error);
  }
};
