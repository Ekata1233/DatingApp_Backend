import { Request, Response } from "express";
import {
  getLaunchConfigService,
  saveLaunchConfigService,
} from "./waitlist.service";

export const saveLaunchConfigController = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await saveLaunchConfigService(req.body);

    return res.status(200).json({
      success: true,
      message: "Launch configuration saved successfully.",
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getLaunchConfigController = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await getLaunchConfigService();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};