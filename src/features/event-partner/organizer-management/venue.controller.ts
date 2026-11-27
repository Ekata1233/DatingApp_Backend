import { VenueArrangement } from "@prisma/client";
import { NextFunction, Response } from "express";
import { z } from "zod";
import { PartnerRequest } from "../../../types/partnerAuth.types";
import { getDocumentExtension } from "./bank-account.validation";
import { getBrandImageExtension } from "./brand-page.validation";
import {
  addOrganizerVenue,
  deleteOrganizerVenue,
  listOrganizerVenues,
  VenueUpload,
  VenueUploadError,
} from "./venue.service";
import { venueSchema } from "./venue.validation";

export const listOrganizerVenuesController = async (
  req: PartnerRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await listOrganizerVenues(req.partner!.businessId!);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

export const addOrganizerVenueController = async (
  req: PartnerRequest,
  res: Response,
  next: NextFunction,
) => {
  const input = venueSchema.safeParse(req.body);
  if (!input.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid venue details",
      errors: input.error.flatten().fieldErrors,
    });
  }

  const invalid = (message: string) => res.status(400).json({ success: false, message });
  const files = req.files ?? {};
  if (Object.keys(files).some((field) => field !== "photos" && field !== "nocDocument")) {
    return invalid("Use photos and nocDocument as the upload field names");
  }

  const photoFiles = [files.photos ?? []].flat();
  if (photoFiles.length < 2 || photoFiles.length > 5) {
    return invalid("Upload 2 to 5 venue photos");
  }

  const photos: VenueUpload[] = [];
  for (const file of photoFiles) {
    const extension = getBrandImageExtension(file);
    if (!extension) return invalid("Each photo must be a JPEG or PNG up to 5 MB");
    photos.push({ bytes: file.data, extension });
  }

  const document = files.nocDocument;
  if (Array.isArray(document)) return invalid("Upload only one NOC or tie-up letter");
  if (!document && input.data.arrangement === VenueArrangement.PARTNER_VENUE) {
    return invalid("An NOC or tie-up letter is required for partner venues");
  }

  let noc: (VenueUpload & { originalName: string }) | undefined;
  if (document) {
    const extension = getDocumentExtension(document);
    if (!extension) return invalid("The NOC must be a PDF, JPEG, or PNG up to 5 MB");
    noc = { bytes: document.data, extension, originalName: document.name };
  }

  try {
    const data = await addOrganizerVenue(req.partner!.businessId!, input.data, photos, noc);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    if (error instanceof VenueUploadError) {
      return res.status(502).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

export const deleteOrganizerVenueController = async (
  req: PartnerRequest,
  res: Response,
  next: NextFunction,
) => {
  const venueId = z.uuid().safeParse(req.params.venueId);
  if (!venueId.success) {
    return res.status(400).json({ success: false, message: "Valid venue ID is required" });
  }

  try {
    const result = await deleteOrganizerVenue(req.partner!.businessId!, venueId.data);
    if (result === "NOT_FOUND") {
      return res.status(404).json({ success: false, message: "Venue not found" });
    }
    if (result === "IN_USE") {
      return res.status(409).json({
        success: false,
        message: "This venue is assigned to an active or draft event",
      });
    }
    return res.status(200).json({ success: true, data: { id: venueId.data, isDeleted: true } });
  } catch (error) {
    return next(error);
  }
};
