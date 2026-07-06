import { Request, Response, NextFunction } from "express";
import {
  createReligionData,
  updateReligionData,
  getAllReligionData,
  getReligionById,
  removeReligionData,
} from "./religion.service";

/**
 * Create
 */
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await createReligionData(req.body);

    res.status(201).json({
      success: true,
      message: "Religion created successfully",
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

    const data = await updateReligionData(id, req.body);

    res.json({
      success: true,
      message: "Religion updated successfully",
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
    const data = await getAllReligionData();

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

    const data = await getReligionById(id);

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

    await removeReligionData(id);

    res.json({
      success: true,
      message: "Religion deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};