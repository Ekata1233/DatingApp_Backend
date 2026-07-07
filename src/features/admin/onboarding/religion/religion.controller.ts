import { Request, Response, NextFunction } from "express";
import {
  createReligionData,
  updateReligionData,
  getAllReligionData,
  getReligionById,
  removeReligionData,
  updateReligionOnly,
  addCommunityToReligion,
  updateCommunityData,
  deleteCommunityData,
  deleteReligionWithCommunities,
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
export const updateReligion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);

    const data = await updateReligionOnly(id, req.body);

    res.json({
      success: true,
      message: "Religion updated successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};
export const addCommunity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const religionId = Number(req.params.religionId);

    const data = await addCommunityToReligion(
      religionId,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Community added successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};
export const updateCommunity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const communityId = Number(req.params.communityId);

    const data = await updateCommunityData(
      communityId,
      req.body
    );

    res.json({
      success: true,
      message: "Community updated successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};
export const deleteCommunity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const communityId = Number(req.params.communityId);

    await deleteCommunityData(communityId);

    res.json({
      success: true,
      message: "Community deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};
export const deleteReligion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const religionId = Number(req.params.id);

    await deleteReligionWithCommunities(religionId);

    res.json({
      success: true,
      message: "Religion and all communities deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};