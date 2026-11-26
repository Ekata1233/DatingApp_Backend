import { Response } from "express";

import { Prisma } from "@prisma/client";

import { ZodError } from "zod";

import {
  HostOnboardingRequest,
  HostOnboardingError,
} from "./host-onboarding.types";

import {
  acceptInvitationSchema,
  hostPersonalDetailsSchema,
  acceptCodeOfConductSchema,
} from "./host-onboarding.validation";

import {
  getHostInvitationService,
  getHostDetailsService,
  acceptHostInvitationService,
  declineHostInvitationService,
  getHostPersonalDetailsService,
  updateHostPersonalDetailsService,
  getHostCodeOfConductService,
  acceptHostCodeOfConductService,
} from "./host-onboarding.service";

export const getHostDetailsController = async (
  req: HostOnboardingRequest,
  res: Response,
): Promise<void> => {
  try {
    const data = await getHostDetailsService(getHostContext(req));
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(error, res);
  }
};

/* -------------------------------------------------------------------------- */
/*                              GET HOST CONTEXT                              */
/* -------------------------------------------------------------------------- */

export const getHostContext = (
  req: HostOnboardingRequest,
) => {
  if (!req.hostContext) {
    throw new HostOnboardingError(
      401,
      "Host authentication required",
    );
  }

  return req.hostContext;
};

/* -------------------------------------------------------------------------- */
/*                              ERROR HANDLER                                 */
/* -------------------------------------------------------------------------- */

export const handleError = (
  error: unknown,
  res: Response,
): void => {
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

  if (error instanceof HostOnboardingError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });

    return;
  }

  if (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  ) {
    res.status(409).json({
      success: false,

      message:
        "Host data was updated concurrently. Please try again.",
    });

    return;
  }

  console.error(
    "Host onboarding error:",
    error instanceof Error
      ? error.name
      : "Unknown error",
  );

  res.status(500).json({
    success: false,

    message: "Internal server error",
  });
};

/* -------------------------------------------------------------------------- */
/*                           GET INVITATION DETAILS                           */
/* -------------------------------------------------------------------------- */

export const getHostInvitationController = async (
  req: HostOnboardingRequest,
  res: Response,
): Promise<void> => {
  try {
    const context = getHostContext(req);

    const result =
      await getHostInvitationService(context);

    res.status(200).json({
      success: true,

      message:
        "Invitation details fetched successfully",

      data: result,
    });
  } catch (error) {
    handleError(error, res);
  }
};

/* -------------------------------------------------------------------------- */
/*                              ACCEPT INVITATION                             */
/* -------------------------------------------------------------------------- */

export const acceptHostInvitationController =
  async (
    req: HostOnboardingRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const context = getHostContext(req);

      acceptInvitationSchema.parse(req.body);

      const result =
        await acceptHostInvitationService(
          context,
        );

      res.status(200).json({
        success: true,

        message:
          "Invitation accepted successfully",

        data: result,
      });
    } catch (error) {
      handleError(error, res);
    }
  };

export const declineHostInvitationController = async (
  req: HostOnboardingRequest,
  res: Response,
): Promise<void> => {
  try {
    const data = await declineHostInvitationService(getHostContext(req));
    res.status(200).json({
      success: true,
      message: "Invitation declined successfully",
      data,
    });
  } catch (error) {
    handleError(error, res);
  }
};

/* -------------------------------------------------------------------------- */
/*                           GET PERSONAL DETAILS                             */
/* -------------------------------------------------------------------------- */

export const getHostPersonalDetailsController =
  async (
    req: HostOnboardingRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const context = getHostContext(req);

      const result =
        await getHostPersonalDetailsService(
          context,
        );

      res.status(200).json({
        success: true,

        message:
          "Personal details fetched successfully",

        data: result,
      });
    } catch (error) {
      handleError(error, res);
    }
  };

/* -------------------------------------------------------------------------- */
/*                          UPDATE PERSONAL DETAILS                           */
/* -------------------------------------------------------------------------- */

export const updateHostPersonalDetailsController =
  async (
    req: HostOnboardingRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const context = getHostContext(req);

      const payload =
        hostPersonalDetailsSchema.parse(
          req.body,
        );

      const result =
        await updateHostPersonalDetailsService(
          context,
          payload,
        );

      res.status(200).json({
        success: true,

        message:
          "Personal details saved successfully",

        data: result,
      });
    } catch (error) {
      handleError(error, res);
    }
  };

/* -------------------------------------------------------------------------- */
/*                            GET CODE OF CONDUCT                             */
/* -------------------------------------------------------------------------- */

export const getHostCodeOfConductController =
  async (
    req: HostOnboardingRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const context = getHostContext(req);

      const result =
        await getHostCodeOfConductService(
          context,
        );

      res.status(200).json({
        success: true,

        message:
          "Code of conduct fetched successfully",

        data: result,
      });
    } catch (error) {
      handleError(error, res);
    }
  };

/* -------------------------------------------------------------------------- */
/*                           ACCEPT CODE OF CONDUCT                           */
/* -------------------------------------------------------------------------- */

export const acceptHostCodeOfConductController =
  async (
    req: HostOnboardingRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const context = getHostContext(req);

      const payload =
        acceptCodeOfConductSchema.parse(
          req.body,
        );

      const result =
        await acceptHostCodeOfConductService(
          context,

          payload,

          {
            ipAddress: req.ip,

            userAgent: req.get("user-agent"),
          },
        );

      res.status(200).json({
        success: true,

        message:
          "Host onboarding completed successfully",

        data: result,
      });
    } catch (error) {
      handleError(error, res);
    }
  };
