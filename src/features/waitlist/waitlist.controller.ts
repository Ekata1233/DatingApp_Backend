import { Request, Response } from "express";
import { joinFreeWaitlistService } from "./waitlist.service";

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