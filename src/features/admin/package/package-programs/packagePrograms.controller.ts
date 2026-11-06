import {
  Request,
  Response,
  NextFunction,
} from "express";

import { PackageType } from "@prisma/client";

import * as PackageProgramService from "./packagePrograms.service";

import {
  CreatePackageProgramInput,
  UpdatePackageProgramInput,
} from "./packagePrograms.types";

// ==========================================
// HELPER: PARSE REQUEST BODY
// ==========================================

const parseRequestBody = (body: any) => {
  const data = { ...body };

  for (const field of ["tags", "destinations"]) {
    if (typeof data[field] === "string") {
      try {
        data[field] = JSON.parse(data[field]);
      } catch {
        throw new Error(`Invalid ${field} JSON`);
      }
    }
  }

  if (data.isActive !== undefined) {
    if (typeof data.isActive === "string") {
      if (!["true", "false"].includes(data.isActive)) {
        throw new Error("Invalid isActive value");
      }

      data.isActive = data.isActive === "true";
    }
  }

  if (data.sortOrder !== undefined) {
    data.sortOrder = Number(data.sortOrder);

    if (
      !Number.isInteger(data.sortOrder) ||
      data.sortOrder < 0
    ) {
      throw new Error("Invalid sortOrder");
    }
  }

  return data;
};

// ==========================================
// HELPER: ERROR RESPONSE
// ==========================================

const handleError = (
  res: Response,
  error: any
) => {
  const statusCode = error.statusCode || 400;

  return res.status(statusCode).json({
    success: false,
    message:
      error.message || "Something went wrong",
  });
};

// ==========================================
// CREATE PACKAGE PROGRAM
// ==========================================

export const createPackageProgramController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = parseRequestBody(req.body);

    if (!Object.values(PackageType).includes(body.packageType)) {
      throw new Error("Invalid packageType");
    }

    if (!body.title?.trim()) {
      throw new Error("Title is required");
    }

    if (
      body.tags !== undefined &&
      !Array.isArray(body.tags)
    ) {
      throw new Error("Tags must be an array");
    }

    if (
      body.destinations !== undefined &&
      !Array.isArray(body.destinations)
    ) {
      throw new Error("Destinations must be an array");
    }

    const files = (req.files || []) as Express.Multer.File[];

    const program =
      await PackageProgramService.createPackageProgramService(
        body as CreatePackageProgramInput,
        files
      );

    return res.status(201).json({
      success: true,
      message: "Package program created successfully",
      data: program,
    });
  } catch (error: any) {
    return handleError(res, error);
  }
};

// ==========================================
// GET ALL PACKAGE PROGRAMS
// ==========================================

export const getAllPackageProgramsController = async (
  req: Request,
  res: Response,
  next: NextFunction
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
      throw new Error("Invalid packageType");
    }

    if (
      isActiveQuery !== undefined &&
      isActiveQuery !== "true" &&
      isActiveQuery !== "false"
    ) {
      throw new Error("Invalid isActive");
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
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    const program =
      await PackageProgramService.getPackageProgramByIdService(id);

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
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const body = parseRequestBody(req.body);

    if (
      body.packageType !== undefined &&
      !Object.values(PackageType).includes(body.packageType)
    ) {
      throw new Error("Invalid packageType");
    }

    if (
      body.title !== undefined &&
      !body.title?.trim()
    ) {
      throw new Error("Title cannot be empty");
    }

    if (
      body.tags !== undefined &&
      !Array.isArray(body.tags)
    ) {
      throw new Error("Tags must be an array");
    }

    if (
      body.destinations !== undefined &&
      !Array.isArray(body.destinations)
    ) {
      throw new Error("Destinations must be an array");
    }

    const files = (req.files || []) as Express.Multer.File[];

    const program =
      await PackageProgramService.updatePackageProgramService(
        id,
        body as UpdatePackageProgramInput,
        files
      );

    return res.status(200).json({
      success: true,
      message: "Package program updated successfully",
      data: program,
    });
  } catch (error: any) {
    return handleError(res, error);
  }
};

// ==========================================
// DELETE PACKAGE PROGRAM
// ==========================================

export const deletePackageProgramController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    const result =
      await PackageProgramService.deletePackageProgramService(id);

    return res.status(200).json({
      success: true,
      message: "Package program deleted successfully",
      data: result,
    });
  } catch (error: any) {
    return handleError(res, error);
  }
};