import { Request, Response } from "express";
import { ZodError } from "zod";

import { sendEngagementService } from "./engagement.service";
import { sendEngagementSchema } from "./engagement.validation";

export const sendEngagement = async (
  req: Request,
  res: Response
) => {
  try {
    /* ------------------------------------------------------------------------ */
    /*                              Auth User                                   */
    /* ------------------------------------------------------------------------ */

    const senderId = (req as any).user.id;

    /* ------------------------------------------------------------------------ */
    /*                              Validation                                  */
    /* ------------------------------------------------------------------------ */

    const data = sendEngagementSchema.parse(
      req.body
    );

    /* ------------------------------------------------------------------------ */
    /*                              Service                                     */
    /* ------------------------------------------------------------------------ */

    const result =
      await sendEngagementService(
        senderId,
        data
      );

    /* ------------------------------------------------------------------------ */
    /*                              Response                                    */
    /* ------------------------------------------------------------------------ */

    return res.status(201).json(result);

  } catch (error) {

    /* ------------------------------------------------------------------------ */
    /*                              Zod Error                                   */
    /* ------------------------------------------------------------------------ */

    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
        errors: error.flatten(),
      });
    }

    /* ------------------------------------------------------------------------ */
    /*                         Handle Business Logic Errors                     */
    /* ------------------------------------------------------------------------ */

    // Check if it's a known business error (like rose limit)
    if (error instanceof Error) {
      // You can check for specific error messages or use custom error classes
      if (error.message.includes("You can only send 3 roses per day")) {
        return res.status(400).json({
          success: false,
          message: error.message,
          errors: {
            fieldErrors: {
              rose: [error.message]
            }
          }
        });
      }

      // Return other business errors with proper format
      return res.status(400).json({
        success: false,
        message: error.message,
        errors: {
          fieldErrors: {}
        }
      });
    }

    /* ------------------------------------------------------------------------ */
    /*                         Forward Other Errors                             */
    /* ------------------------------------------------------------------------ */

    // Log the error for debugging
    console.error("Unexpected error in sendEngagement:", error);
    
    // Return a generic error response instead of throwing
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      errors: {
        fieldErrors: {}
      }
    });
  }
};