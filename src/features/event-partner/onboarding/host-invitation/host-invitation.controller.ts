import {
  Request,
  Response,
} from "express";

import { ZodError } from "zod";
import { hostInvitationLookupSchema } from "./host-invitation.validation";
import { getHostInvitationsService } from "./host-invitation.service";


/* -------------------------------------------------------------------------- */
/*                           GET HOST INVITATIONS                             */
/* -------------------------------------------------------------------------- */

export const getHostInvitationsController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    res.setHeader("Cache-Control", "no-store");

    /* ---------------------------------------------------------------------- */
    /*                            VALIDATE REQUEST                            */
    /* ---------------------------------------------------------------------- */

    const payload =
      hostInvitationLookupSchema.parse(req.body);

    /* ---------------------------------------------------------------------- */
    /*                            CALL SERVICE                                */
    /* ---------------------------------------------------------------------- */

    const result =
      await getHostInvitationsService(payload);

    /* ---------------------------------------------------------------------- */
    /*                            SEND RESPONSE                               */
    /* ---------------------------------------------------------------------- */

    res.status(200).json({
      success: true,

      message:
        "Host invitation lookup completed",

      data: result,
    });

  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,

        message:
          error.issues[0]?.message ||
          "Validation failed",

        errors: error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });

      return;
    }

    console.error(
      "Host invitation lookup failed:",
      error instanceof Error
        ? error.name
        : "Unknown error",
    );

    res.status(500).json({
      success: false,

      message: "Unable to check invitations",
    });
  }
};
