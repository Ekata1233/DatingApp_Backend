import { Request, Response, NextFunction } from "express";

import {
  createAmbition,
  updateAmbition,
  getAllAmbition,
  getActiveAmbition,
  getAmbitionById,
  removeAmbition,
} from "./ambition.service";

/**
 * Create
 */
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, isActive } = req.body;

    const data = await createAmbition({
      title,
      isActive,
    });

    res.status(201).json({
      success: true,
      message: "Ambition created successfully",
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

    const { title, isActive } = req.body;

    const data = await updateAmbition(id, {
      title,
      isActive,
    });

    res.json({
      success: true,
      message: "Ambition updated successfully",
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
    const data = await getAllAmbition();

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
    const data = await getActiveAmbition();

    res.json({
      success: true,
      message: "Ambition options fetched successfully",
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

    const data = await getAmbitionById(id);

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

    await removeAmbition(id);

    res.json({
      success: true,
      message: "Ambition deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};