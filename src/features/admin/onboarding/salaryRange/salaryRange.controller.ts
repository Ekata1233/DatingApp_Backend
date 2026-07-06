import { Request, Response, NextFunction } from "express";

import {
  createSalaryRange,
  updateSalaryRange,
  getAllSalaryRange,
  getActiveSalaryRange,
  getSalaryRangeById,
  removeSalaryRange,
} from "./salaryRange.service";

/**
 * Create
 */
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      title,
      minSalary,
      maxSalary,
      isActive,
    } = req.body;

    const data = await createSalaryRange({
      title,
      minSalary,
      maxSalary,
      isActive,
    });

    res.status(201).json({
      success: true,
      message: "Salary Range created successfully",
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

    const {
      title,
      minSalary,
      maxSalary,
      isActive,
    } = req.body;

    const data = await updateSalaryRange(id, {
      title,
      minSalary,
      maxSalary,
      isActive,
    });

    res.json({
      success: true,
      message: "Salary Range updated successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get All (Admin)
 */
export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getAllSalaryRange();

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get Active (Onboarding)
 */
export const getActive = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getActiveSalaryRange();

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get One
 */
export const getOne = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);

    const data = await getSalaryRangeById(id);

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

    await removeSalaryRange(id);

    res.json({
      success: true,
      message: "Salary Range deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};