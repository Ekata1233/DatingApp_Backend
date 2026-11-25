import { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { PartnerGovernmentIdError } from "../organizer/organizer.types";
import { authorizePartnerGovernmentIdService } from "../organizer/organizer.helper";
import { getHostContext, handleError } from "./host-onboarding.controller";
import { HostOnboardingError, type HostOnboardingRequest } from "./host-onboarding.types";
import {
  completeHostGovernmentId,
  initHostGovernmentId,
  verifyHostFace,
} from "./host-verification.service";

const hostVerificationHandler = (
  handler: (req: HostOnboardingRequest) => Promise<unknown>,
) => async (req: HostOnboardingRequest, res: Response, next: NextFunction) => {
  try {
    const data = await handler(req);
    res.json({ success: true, data });
  } catch (error) {
    if (error instanceof PartnerGovernmentIdError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else if (error instanceof HostOnboardingError) {
      handleError(error, res);
    } else {
      next(error);
    }
  }
};

export const initHostGovernmentIdController = hostVerificationHandler(async (req) => {
  const { documentType, consent } = req.body ?? {};
  if (documentType !== "AADHAAR" || consent !== true) {
    throw new HostOnboardingError(400, "AADHAAR document type and verification consent are required");
  }
  return initHostGovernmentId(getHostContext(req));
});

export const completeHostGovernmentIdController = hostVerificationHandler(async (req) => {
  const { attemptId } = req.body ?? {};
  if (!z.string().uuid().safeParse(attemptId).success) {
    throw new HostOnboardingError(400, "Valid attemptId is required");
  }
  return completeHostGovernmentId(getHostContext(req), attemptId);
});

export const hostGovernmentIdCallbackController = hostVerificationHandler(async (req: Request) => {
  const { state, transaction_id, code } = req.query;
  if (typeof state !== "string" || typeof transaction_id !== "string" || typeof code !== "string") {
    throw new HostOnboardingError(400, "Invalid DigiLocker callback parameters");
  }
  return authorizePartnerGovernmentIdService(state, transaction_id, code, true);
});

export const verifyHostFaceController = hostVerificationHandler(async (req) => {
  if (req.body?.consent !== "true") {
    throw new HostOnboardingError(400, "Face verification consent is required");
  }
  const selfie = req.files?.selfie;
  if (!selfie || Array.isArray(selfie) || selfie.truncated) {
    throw new HostOnboardingError(400, "Upload one JPEG or PNG selfie up to 5 MB");
  }
  return verifyHostFace(getHostContext(req), selfie.data);
});
