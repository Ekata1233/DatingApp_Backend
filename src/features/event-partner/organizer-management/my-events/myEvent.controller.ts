import {
  Request,
  Response,
} from "express";
import { getAllOrganizerEventsSchema } from "./myEvent.validation";
import { getAllOrganizerEventsService } from "./myEvent.service";



// ============================================
// GET ALL ORGANIZER EVENTS CONTROLLER
// ============================================

export const getAllOrganizerEventsController =
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
      // 2. ORGANIZER ROLE VALIDATION
      // ======================================

      if (partner.role !== "ORGANIZER") {
        return res.status(403).json({
          success: false,
          message:
            "Only organizers can access this API",
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
      // 4. VALIDATE QUERY PARAMETERS
      // ======================================

      const validation =
        getAllOrganizerEventsSchema.safeParse(
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
        await getAllOrganizerEventsService({
          businessId: partner.businessId,
          ...validation.data,
        });


      // ======================================
      // 6. SUCCESS RESPONSE
      // ======================================

      return res.status(200).json({
        success: true,
        message:
          "Events fetched successfully",
        data,
      });

    } catch (error: unknown) {
      console.error(
        "Get All Organizer Events Error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch events",
      });
    }
  };