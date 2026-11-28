import {
  Request,
  Response,
} from "express";

import {
  getEventPayoutSummaryService,
} from "./eventPayout.service";

import {
  eventPayoutParamsSchema,
  eventPayoutQuerySchema,
} from "./eventPayout.validation";

import {
  EventPayoutServiceError,
} from "./eventPayout.types";


// ==========================================
// GET EVENT PAYOUT SUMMARY CONTROLLER
// ==========================================

export const getEventPayoutSummaryController =
  async (
    req: Request,
    res: Response,
  ) => {
    try {

      console.log(
        "[EVENT PAYOUT] Request received",
      );


      // ==========================================
      // 1. GET AUTHENTICATED ORGANIZER
      // ==========================================

      const partner = (
        req as Request & {
          partner?: {
            id: string;

            role: string;

            businessId?: string;
          };
        }
      ).partner;

      if (!partner) {
        return res.status(401).json({
          success: false,

          message: "Unauthorized access",
        });
      }

      if (partner.role !== "ORGANIZER") {
        return res.status(403).json({
          success: false,

          message:
            "Only organizers can access event payout",
        });
      }

      if (!partner.businessId) {
        return res.status(403).json({
          success: false,

          message:
            "Business details not found",
        });
      }


      // ==========================================
      // 2. VALIDATE PARAMS
      // ==========================================

      const paramsValidation =
        eventPayoutParamsSchema.safeParse(
          req.params,
        );

      if (!paramsValidation.success) {
        return res.status(400).json({
          success: false,

          message: "Invalid event parameters",

          errors:
            paramsValidation.error.flatten()
              .fieldErrors,
        });
      }


      // ==========================================
      // 3. VALIDATE QUERY
      // ==========================================

      const queryValidation =
        eventPayoutQuerySchema.safeParse(
          req.query,
        );

      if (!queryValidation.success) {
        return res.status(400).json({
          success: false,

          message: "Invalid query parameters",

          errors:
            queryValidation.error.flatten()
              .fieldErrors,
        });
      }


      // ==========================================
      // 4. CALL SERVICE
      // ==========================================

      const data =
        await getEventPayoutSummaryService({
          businessId: partner.businessId,

          eventId:
            paramsValidation.data.eventId,

          eventDateId:
            queryValidation.data.eventDateId,
        });


      // ==========================================
      // 5. SUCCESS RESPONSE
      // ==========================================

      return res.status(200).json({
        success: true,

        message:
          "Event payout summary fetched successfully",

        data,
      });

    } catch (error) {

      console.error(
        "[EVENT PAYOUT] Error:",
        error,
      );

      if (
        error instanceof
        EventPayoutServiceError
      ) {
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
          "Failed to fetch event payout summary",
      });
    }
  };