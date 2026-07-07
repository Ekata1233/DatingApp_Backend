import { Request, Response, NextFunction } from "express";

import {
  createProfession,
  updateProfession,
  getAllProfession,
  getProfessionById,
  removeProfession,
  getActiveProfession,
} from "./profession.service";

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

    const data = await createProfession({
      name,
      isActive,
    });

    res.status(201).json({
      success: true,
      message: "Profession created successfully",
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

    const data = await updateProfession(id, {
      name,
      isActive,
    });

    res.json({
      success: true,
      message: "Profession updated successfully",
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
    const data = await getAllProfession();

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

    const data = await getProfessionById(id);

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

    await removeProfession(id);

    res.json({
      success: true,
      message: "Profession deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const getActive = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getActiveProfession();

    res.json({
      success: true,
      message: "Profession options fetched successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};