import { Request, Response } from "express";
import { ZodError } from "zod";

import { sendEngagementService } from "./engagement.service";
import { sendEngagementSchema } from "./engagement.validation";
import { getIO } from "../../config/socket";

export const sendEngagement = async (req: Request, res: Response) => {
  try {
    /* ------------------------------------------------------------------------ */
    /*                              Auth User                                   */
    /* ------------------------------------------------------------------------ */

    const senderId = (req as any).user.id;

    /* ------------------------------------------------------------------------ */
    /*                              Validation                                  */
    /* ------------------------------------------------------------------------ */

    const data = sendEngagementSchema.parse(req.body);

    /* ------------------------------------------------------------------------ */
    /*                              Service                                     */
    /* ------------------------------------------------------------------------ */

    const result = await sendEngagementService(senderId, data);

    /* ------------------------------------------------------------------------ */
    /*                    SOCKET.IO REAL-TIME MESSAGE                           */
    /* ------------------------------------------------------------------------ */

    try {
      const io = getIO();

      const receiverId = data.receiverId;

      // The service must return the saved chat message
      const message = result.data?.message;

      if (message) {
        // ========================================
        // SEND MESSAGE TO RECEIVER
        // ========================================

        io.to(`user:${receiverId}`).emit("message:receive", message);

        // ========================================
        // SEND MESSAGE TO SENDER
        // ========================================

        io.to(`user:${senderId}`).emit("message:receive", message);

        console.log("Engagement message socket sent:", {
          senderId,
          receiverId,
          messageId: message.id,
        });
      }
    } catch (socketError) {
      // Socket failure should not affect
      // successful engagement transaction

      console.error("Engagement socket emission error:", socketError);
    }

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
              rose: [error.message],
            },
          },
        });
      }

      // Return other business errors with proper format
      return res.status(400).json({
        success: false,
        message: error.message,
        errors: {
          fieldErrors: {},
        },
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
        fieldErrors: {},
      },
    });
  }
};
