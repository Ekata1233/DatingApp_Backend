import { Request, Response, NextFunction } from "express";
import * as EventService from "./event.service";

export const createEventController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const event = await EventService.createEvent(req.body);

    return res.status(201).json({
      success: true,
      message: "Event draft created successfully",
      data: event,
    });
  } catch (error) {
    next(error);
  }
};