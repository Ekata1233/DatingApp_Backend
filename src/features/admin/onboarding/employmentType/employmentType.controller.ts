import { Request, Response, NextFunction } from "express";

import {
  createEmploymentType,
  updateEmploymentType,
  getAllEmploymentType,
  getEmploymentTypeById,
  removeEmploymentType,
} from "./employmentType.service";

/**
 * Create
 */
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, isActive } = req.body;

    const data = await createEmploymentType({
      name,
      isActive,
    });

    res.status(201).json({
      success: true,
      message: "Employment Type created successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update
 */
export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);

    const { name, isActive } = req.body;

    const data = await updateEmploymentType(id, {
      name,
      isActive,
    });

    res.json({
      success: true,
      message: "Employment Type updated successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get All
 */
export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getAllEmploymentType();

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get Single
 */
export const getOne = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);

    const data = await getEmploymentTypeById(id);

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete
 */
export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);

    await removeEmploymentType(id);

    res.json({
      success: true,
      message: "Employment Type deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};