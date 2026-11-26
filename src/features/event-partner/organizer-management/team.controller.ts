import { NextFunction, Response } from "express";
import { HostRemovalReason, HostStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { PartnerRequest } from "../../../types/partnerAuth.types";
import { HostServiceError } from "../host-management/host.service";
import { hostIdSchema } from "../host-management/host.validation";
import {
  changeTeamMemberAccess,
  getOrganizerTeam,
  getOrganizerTeamMember,
  previewTeamMemberRemoval,
  removeTeamMember,
} from "./team.service";

const removeTeamMemberSchema = z.object({
  reason: z.enum(HostRemovalReason),
  note: z.string().trim().max(500).optional(),
  replacementHostId: hostIdSchema.optional(),
}).strict();

const teamMemberAction = (
  action: (partnerId: string, businessId: string, hostId: string, body: unknown) => Promise<unknown>,
) => async (req: PartnerRequest, res: Response, next: NextFunction) => {
  try {
    const hostId = hostIdSchema.parse(req.params.hostId);
    const { id, businessId } = req.partner!;
    const data = await action(id, businessId!, hostId, req.body);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.issues[0]?.message });
    }
    if (error instanceof HostServiceError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return res.status(409).json({ success: false, message: "Team or event state changed. Refresh and try again." });
    }
    return next(error);
  }
};

export const pauseTeamMemberController = teamMemberAction((partnerId, businessId, hostId) =>
  changeTeamMemberAccess(partnerId, businessId, hostId, HostStatus.PAUSED),
);

export const resumeTeamMemberController = teamMemberAction((partnerId, businessId, hostId) =>
  changeTeamMemberAccess(partnerId, businessId, hostId, HostStatus.ACTIVE),
);
export const previewTeamMemberRemovalController = teamMemberAction(previewTeamMemberRemoval);
export const removeTeamMemberController = teamMemberAction((partnerId, businessId, hostId, body) => {
  const { reason, note, replacementHostId } = removeTeamMemberSchema.parse(body);
  return removeTeamMember(partnerId, businessId, hostId, reason, note, replacementHostId);
});

export const getOrganizerTeamController = async (
  req: PartnerRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id, businessId } = req.partner!;
    const data = await getOrganizerTeam(id, businessId!);

    if (!data) {
      return res.status(403).json({
        success: false,
        message: "An active business with completed onboarding is required",
      });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

export const getOrganizerTeamMemberController = async (
  req: PartnerRequest,
  res: Response,
  next: NextFunction,
) => {
  const hostId = hostIdSchema.safeParse(req.params.hostId);
  if (!hostId.success) {
    return res.status(400).json({ success: false, message: "Valid host ID is required" });
  }

  try {
    const { id, businessId } = req.partner!;
    const data = await getOrganizerTeamMember(id, businessId!, hostId.data);
    if (!data) {
      return res.status(404).json({ success: false, message: "Team member not found" });
    }
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};
