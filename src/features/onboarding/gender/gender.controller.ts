import { Request, Response, NextFunction } from "express";
import * as GenderService from "./gender.service";

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const gender = await GenderService.createGender(req.body);

    res.status(201).json({
      success: true,
      message: "Gender created successfully",
      data: gender,
    });
  } catch (error) {
    next(error);
  }
};

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const genders = await GenderService.getAllGenders();

    res.status(200).json({
      success: true,
      data: genders,
    });
  } catch (error) {
    next(error);
  }
};
