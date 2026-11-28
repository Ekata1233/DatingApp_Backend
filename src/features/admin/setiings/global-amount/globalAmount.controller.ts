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

// ==========================================
// CREATE OR UPDATE GLOBAL AMOUNT
// ==========================================

export const createGlobalAmountController =
  async (
    req: Request,
    res: Response,
  ) => {
    try {

      console.log(
        "[GLOBAL AMOUNT] Create/update request received",
      );


      // STEP 1 - Validate request body

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


      // STEP 2 - Create or update configuration

      const result =
        await createGlobalAmountService(
          validation.data,
        );


      // STEP 3 - Return response

      return res.status(200).json({
        success: true,

        message: result.message,

        data: result.data,
      });

    } catch (error) {

      console.error(
        "[GLOBAL AMOUNT] Create/update error:",
        error,
      );

      return res.status(500).json({
        success: false,

        message: "Something went wrong",
      });
    }
  };


// ==========================================
// GET GLOBAL AMOUNT
// ==========================================

export const getGlobalAmountController =
  async (
    req: Request,
    res: Response,
  ) => {
    try {

      console.log(
        "[GLOBAL AMOUNT] Get request received",
      );


      // STEP 1 - Fetch global configuration

      const data =
        await getGlobalAmountService();


      // STEP 2 - Check configuration

      if (!data) {
        return res.status(404).json({
          success: false,

          message:
            "Global amount not configured",
        });
      }


      // STEP 3 - Return response

      return res.status(200).json({
        success: true,

        message:
          "Global amount fetched successfully",

        data,
      });

    } catch (error) {

      console.error(
        "[GLOBAL AMOUNT] Fetch error:",
        error,
      );

      return res.status(500).json({
        success: false,

        message: "Something went wrong",
      });
    }
  };