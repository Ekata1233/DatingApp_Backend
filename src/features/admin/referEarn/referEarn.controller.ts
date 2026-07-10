import { Request, Response } from "express";
import {
  createOrUpdateRewardConfig,
  getRewardConfig,
} from "./referEarn.service";

export const saveRewardConfig = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = await createOrUpdateRewardConfig(req.body);

    res.status(200).json({
      success: true,
      message: "Reward configuration saved successfully.",
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const fetchRewardConfig = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = await getRewardConfig();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};