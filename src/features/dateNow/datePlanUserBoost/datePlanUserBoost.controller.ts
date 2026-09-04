import {
  Request,
  Response,
} from "express";
import { activateDatePlanBoostSchema, datePlanIdParamsSchema } from "./datePlanUserBoost.validation";
import { activateDatePlanBoostService, getActiveDatePlanBoostService } from "./datePlanUserBoost.service";




// ==========================================
// ACTIVATE BOOST
// ==========================================
export const activateDatePlanBoostController =
  async (
    req: Request,
    res: Response,
  ) => {
    try {
      const userId =
        (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized user",
        });
      }

      const paramsValidation =
        datePlanIdParamsSchema.safeParse(
          req.params,
        );

      if (!paramsValidation.success) {
        return res.status(400).json({
          success: false,
          message:
            paramsValidation.error
              .issues[0]?.message ||
            "Invalid date plan ID",
        });
      }

      const bodyValidation =
        activateDatePlanBoostSchema.safeParse(
          req.body,
        );

      if (!bodyValidation.success) {
        return res.status(400).json({
          success: false,
          message:
            bodyValidation.error
              .issues[0]?.message ||
            "Invalid request data",
        });
      }

      const {
        datePlanId,
      } = paramsValidation.data;

      const {
        boostOptionId,
      } = bodyValidation.data;

      const result =
        await activateDatePlanBoostService({
          userId,
          datePlanId,
          boostOptionId,
        });

      return res.status(201).json({
        success: true,
        message:
          "Date plan boost activated successfully",
        data: result,
      });
    } catch (error: any) {
      console.error(
        "Activate Date Plan Boost Error:",
        error,
      );

      return res
        .status(
          error.statusCode || 500,
        )
        .json({
          success: false,
          message:
            error.message ||
            "Something went wrong while activating boost",
        });
    }
  };


// ==========================================
// GET ACTIVE BOOST
// ==========================================

export const getActiveDatePlanBoostController =
  async (
    req: Request,
    res: Response,
  ) => {
    try {
      const userId =
        (req as any).user.id;


      // ======================================
      // VALIDATION
      // ======================================

      const paramsValidation =
        datePlanIdParamsSchema.safeParse(
          req.params,
        );

      if (!paramsValidation.success) {
        return res.status(400).json({
          success: false,

          message:
            paramsValidation.error
              .issues[0]?.message ||
            "Invalid date plan ID",
        });
      }


      const {
        datePlanId,
      } = paramsValidation.data;


      // ======================================
      // SERVICE
      // ======================================

      const result =
        await getActiveDatePlanBoostService({
          userId,
          datePlanId,
        });


      return res.status(200).json({
        success: true,

        message:
          result.isBoosted
            ? "Active boost fetched successfully"
            : "No active boost found",

        data: result,
      });
    } catch (error: any) {
      console.error(
        "Get Active Date Plan Boost Error:",
        error,
      );

      return res
        .status(
          error.statusCode || 500,
        )
        .json({
          success: false,

          message:
            error.message ||
            "Something went wrong",
        });
    }
  };