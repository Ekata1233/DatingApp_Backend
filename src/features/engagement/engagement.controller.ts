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
    /*                         Forward Other Errors                             */
    /* ------------------------------------------------------------------------ */

    throw error;
  }
};