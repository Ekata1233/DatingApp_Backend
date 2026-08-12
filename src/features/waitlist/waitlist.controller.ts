import { Request, Response } from "express";
import { getWaitlistService, joinFreeWaitlistService } from "./waitlist.service";

export const joinWaitlistController = async (
  req: Request,
  res: Response
) => {
  try {
    const waitlist = await joinFreeWaitlistService(
      (req as any).user.id,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Successfully joined the waitlist.",
      data: waitlist,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getWaitlistController = async (
  req: Request,
  res: Response
) => {
  try {
    const waitlist = await getWaitlistService(
      (req as any).user.id
    );

    return res.status(200).json({
      success: true,
      message: "Waitlist details fetched successfully.",
      data: waitlist,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};