import {
  Request,
  Response,
} from "express";

import {
  getHostEventsSchema,
} from "./host-event.validation";

import {
  getAllHostEventsService,
  HostEventError,
} from "./host-event.service";


// ============================================
// GET ALL HOST EVENTS CONTROLLER
// ============================================

export const getAllHostEventsController =
  async (
    req: Request,
    res: Response,
  ) => {

    try {

      const partner = (req as any).partner;


      // ======================================
      // 1. AUTHENTICATION
      // ======================================

      if (!partner?.id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }


      // ======================================
      // 2. HOST ROLE VALIDATION
      // ======================================

      if (partner.role !== "HOST") {
        return res.status(403).json({
          success: false,
          message:
            "Only hosts can access this API",
        });
      }


      // ======================================
      // 3. BUSINESS VALIDATION
      // ======================================

      if (!partner.businessId) {
        return res.status(403).json({
          success: false,
          message:
            "Business access not found",
        });
      }


      // ======================================
      // 4. QUERY VALIDATION
      // ======================================

      const validation =
        getHostEventsSchema.safeParse(
          req.query,
        );

      if (!validation.success) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid query parameters",

          errors:
            validation.error.flatten(),
        });
      }


      // ======================================
      // 5. CALL SERVICE
      // ======================================

      const data =
        await getAllHostEventsService({
          partnerId: partner.id,

          businessId:
            partner.businessId,

          ...validation.data,
        });


      // ======================================
      // 6. SUCCESS RESPONSE
      // ======================================

      return res.status(200).json({
        success: true,

        message:
          "Assigned events fetched successfully",

        data,
      });

    } catch (error: unknown) {

      console.error(
        "Get All Host Events Error:",
        error,
      );

      if (error instanceof HostEventError) {
        return res
          .status(error.statusCode)
          .json({
            success: false,
            message: error.message,
          });
      }

      return res.status(500).json({
        success: false,

        message:
          "Failed to fetch assigned events",
      });
    }
  };