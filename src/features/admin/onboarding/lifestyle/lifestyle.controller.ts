import { Request, Response, NextFunction } from "express";
import {
  createLifestyle,
  getLifestyle,
  
} from "./lifestyle.service";

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await createLifestyle(req.body);
    res.status(201).json({ success: true, data });
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
    const { flowType } = req.query;

    const data = await getLifestyle(flowType as string);

    res.json({ success: true, message: "Lifestyle question options fetched successfully", data });
  } catch (error) {
    next(error);
  }
};

// export const remove = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     await deleteLifestyle();
//     res.json({ success: true, message: "Lifestyle deleted successfully" });
//   } catch (error) {
//     next(error);
//   }
// };
