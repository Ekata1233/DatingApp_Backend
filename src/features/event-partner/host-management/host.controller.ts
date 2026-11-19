import { Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

import * as hostService from "./host.service";

import {
  businessIdSchema,
  hostIdSchema,
  inviteHostSchema,
  updateHostPermissionsSchema,
  getHostsSchema,
} from "./host.validation";

/* -------------------------------------------------------------------------- */
/*                              REQUEST HELPERS                               */
/* -------------------------------------------------------------------------- */

const getPartnerId = (req: Request): string => {
  const partnerId = (req as any).partner?.id;

  if (!partnerId) {
    throw new hostService.HostServiceError(
      401,
      "Unauthorized partner",
    );
  }

  return partnerId;
};

const getBusinessId = (req: Request): string => {
  return businessIdSchema.parse(req.query.businessId);
};

const getHostId = (req: Request): string => {
  return hostIdSchema.parse(req.params.hostId);
};

/* -------------------------------------------------------------------------- */
/*                              ERROR HANDLER                                 */
/* -------------------------------------------------------------------------- */

const handleError = (
  res: Response,
  error: unknown,
) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: error.issues[0]?.message || "Validation failed",

      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (error instanceof hostService.HostServiceError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError
  ) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Host already exists",
      });
    }

    if (error.code === "P2025") {
      return res.status(409).json({
        success: false,
        message:
          "Host record has changed. Please refresh and try again",
      });
    }
  }

  console.error("Host management error:", error);

  return res.status(500).json({
    success: false,
    message: "Something went wrong",
  });
};

/* -------------------------------------------------------------------------- */
/*                             GET PERMISSIONS                                */
/* -------------------------------------------------------------------------- */

export const getHostPermissions = async (
  req: Request,
  res: Response,
) => {
  try {
    const data = hostService.getHostPermissionsService();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

/* -------------------------------------------------------------------------- */
/*                                 INVITE HOST                                */
/* -------------------------------------------------------------------------- */

export const inviteHost = async (
  req: Request,
  res: Response,
) => {
  try {
    const partnerId = getPartnerId(req);
    const businessId = getBusinessId(req);

    const payload = inviteHostSchema.parse(req.body);

    const data = await hostService.inviteHostService(
      partnerId,
      businessId,
      payload,
    );

    return res.status(201).json({
      success: true,
      message: "Host invitation created successfully",
      data,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

/* -------------------------------------------------------------------------- */
/*                                  GET HOSTS                                 */
/* -------------------------------------------------------------------------- */

export const getHosts = async (
  req: Request,
  res: Response,
) => {
  try {
    const partnerId = getPartnerId(req);
    const businessId = getBusinessId(req);

    const filters = getHostsSchema.parse(req.query);

    const data = await hostService.getHostsService(
      partnerId,
      businessId,
      filters,
    );

    return res.status(200).json({
      success: true,
      message: "Hosts fetched successfully",
      data: data.items,
      pagination: data.pagination,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

/* -------------------------------------------------------------------------- */
/*                              GET HOST DETAILS                              */
/* -------------------------------------------------------------------------- */

export const getHostDetails = async (
  req: Request,
  res: Response,
) => {
  try {
    const data = await hostService.getHostDetailsService(
      getPartnerId(req),
      getBusinessId(req),
      getHostId(req),
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

/* -------------------------------------------------------------------------- */
/*                              UPDATE PERMISSIONS                            */
/* -------------------------------------------------------------------------- */

export const updateHostPermissions = async (
  req: Request,
  res: Response,
) => {
  try {
    const payload =
      updateHostPermissionsSchema.parse(req.body);

    const data =
      await hostService.updateHostPermissionsService(
        getPartnerId(req),
        getBusinessId(req),
        getHostId(req),
        payload,
      );

    return res.status(200).json({
      success: true,
      message: "Host permissions updated successfully",
      data,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

/* -------------------------------------------------------------------------- */
/*                             RESEND INVITATION                              */
/* -------------------------------------------------------------------------- */

export const resendHostInvitation = async (
  req: Request,
  res: Response,
) => {
  try {
    const data =
      await hostService.resendHostInvitationService(
        getPartnerId(req),
        getBusinessId(req),
        getHostId(req),
      );

    return res.status(200).json({
      success: true,
      message: "New host invitation created successfully",
      data,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

/* -------------------------------------------------------------------------- */
/*                                 PAUSE HOST                                 */
/* -------------------------------------------------------------------------- */

export const pauseHost = async (
  req: Request,
  res: Response,
) => {
  try {
    const data = await hostService.pauseHostService(
      getPartnerId(req),
      getBusinessId(req),
      getHostId(req),
    );

    return res.status(200).json({
      success: true,
      message: "Host paused successfully",
      data,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

/* -------------------------------------------------------------------------- */
/*                                RESUME HOST                                 */
/* -------------------------------------------------------------------------- */

export const resumeHost = async (
  req: Request,
  res: Response,
) => {
  try {
    const data = await hostService.resumeHostService(
      getPartnerId(req),
      getBusinessId(req),
      getHostId(req),
    );

    return res.status(200).json({
      success: true,
      message: "Host resumed successfully",
      data,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

/* -------------------------------------------------------------------------- */
/*                                REMOVE HOST                                 */
/* -------------------------------------------------------------------------- */

export const removeHost = async (
  req: Request,
  res: Response,
) => {
  try {
    const data = await hostService.removeHostService(
      getPartnerId(req),
      getBusinessId(req),
      getHostId(req),
    );

    return res.status(200).json({
      success: true,
      message: "Host removed successfully",
      data,
    });
  } catch (error) {
    return handleError(res, error);
  }
};