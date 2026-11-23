import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { PartnerRequest } from "../../../types/partnerAuth.types";
import { BrandPageError, getBrandPage, saveBrandPage } from "./brand-page.service";
import { brandPageSchema, getBrandImageExtension } from "./brand-page.validation";

const handleError = (error: unknown, res: Response, next: NextFunction) => {
  if (error instanceof BrandPageError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return next(error);
};

export const previewBrandPageController = async (req: PartnerRequest, res: Response, next: NextFunction) => {
  try {
    const data = await getBrandPage(req.partner!.businessId!);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const getGuestBrandPageController = async (req: Request, res: Response, next: NextFunction) => {
  const businessId = z.uuid().safeParse(req.params.businessId);
  if (!businessId.success) {
    return res.status(400).json({ success: false, message: "Invalid business ID" });
  }

  try {
    const data = await getBrandPage(businessId.data, true);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const saveBrandPageController = async (req: PartnerRequest, res: Response, next: NextFunction) => {
  const input = brandPageSchema.safeParse(req.body);
  if (!input.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid brand page details",
      errors: input.error.flatten().fieldErrors,
    });
  }

  try {
    const readImage = (field: "logo" | "coverPhoto") => {
      const file = req.files?.[field];
      if (!file) return undefined;
      if (Array.isArray(file)) {
        throw new BrandPageError(400, `Upload only one ${field} file`);
      }
      const extension = getBrandImageExtension(file);
      if (!extension) {
        throw new BrandPageError(400, `${field} must be a JPEG or PNG up to 5 MB`);
      }
      return { data: file.data, extension };
    };

    const logo = readImage("logo");
    const coverPhoto = readImage("coverPhoto");
    if (coverPhoto && input.data.removeCoverPhoto) {
      throw new BrandPageError(400, "Choose whether to upload or remove the cover photo");
    }

    const data = await saveBrandPage(req.partner!.businessId!, input.data, { logo, coverPhoto });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleError(error, res, next);
  }
};
