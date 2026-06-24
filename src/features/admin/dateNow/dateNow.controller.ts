import { Request, Response } from "express";
import {
  upsertDatePlanOptionsService,
  getOptionsByTypeService,
} from "./dateNow.service";

import { upsertDatePlanOptionsSchema } from "../dateNow/dateNow.Validation";
import { OptionType } from "@prisma/client";

export const upsertDatePlanOptions = async (
  req: Request,
  res: Response
) => {
  try {
    const validated =
      upsertDatePlanOptionsSchema.parse(req.body);

    const result =
      await upsertDatePlanOptionsService(
        validated.type,
        validated.options
      );

    return res.status(200).json({
      success: true,
      message: "Options saved successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong",
    });
  }
};

export const getOptions = async (
  req: Request,
  res: Response
) => {
  try {
    const type = req.query.type as OptionType;

    const result = await getOptionsByTypeService(type);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong",
    });
  }
};