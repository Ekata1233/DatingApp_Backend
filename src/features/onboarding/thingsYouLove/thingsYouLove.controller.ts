import { Request, Response, NextFunction } from "express";
import {
  createThingsYouLove,
  getThingsYouLove,
 
} from "./thingsYouLove.service";

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await createThingsYouLove(req.body);
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

    const data = await getThingsYouLove(flowType as string);

    res.json({ success: true, data });
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
//     await deleteThingsYouLove();
//     res.json({ success: true, message: "ThingsYouLove deleted successfully" });
//   } catch (error) {
//     next(error);
//   }
// };
