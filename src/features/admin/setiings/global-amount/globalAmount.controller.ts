import {
  Request,
  Response,
} from "express";

import {
  createGlobalAmountService,
  getGlobalAmountService,
} from "./globalAmount.service";

import {
  globalAmountSchema,
} from "./globalAmount.validation";

export const createGlobalAmountController =
  async (
    req: Request,
    res: Response,
  ) => {
    try {
      const validation =
        globalAmountSchema.safeParse(
          req.body,
        );

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors:
            validation.error.flatten()
              .fieldErrors,
        });
      }

      const result =
        await createGlobalAmountService(
          validation.data,
        );

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Something went wrong",
      });
    }
  };

export const getGlobalAmountController =
  async (
    req: Request,
    res: Response,
  ) => {
    try {
      const data =
        await getGlobalAmountService();

      return res.status(200).json({
        success: true,
        message:
          "Global amount fetched successfully",
        data,
      });
    } catch (error: any) {
      return res.status(404).json({
        success: false,
        message:
          error.message ||
          "Global amount not found",
      });
    }
  };