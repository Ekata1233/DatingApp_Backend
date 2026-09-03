import { Request, Response } from "express";

import { LegalPageType } from "@prisma/client";

import {
  upsertLegalPageService,
  getAllLegalPagesService,
  getLegalPageByTypeService,

} from "./legal.service";
import { legalPageValidation } from "./legalPage.validation";

/* ============================================================
   Legal Pages Controller
   - POST /legal-pages           → upsertLegalPageController
   - GET  /legal-pages           → getAllLegalPagesController
   - GET  /legal-pages/:pageType → getLegalPageByTypeController
   ============================================================ */

export async function upsertLegalPageController(
  req: Request,
  res: Response,
) {
  try {
    const validation = legalPageValidation.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const { pageType, title, content } = validation.data;

    const page = await upsertLegalPageService(
      pageType as LegalPageType,
      title,
      content,
    );

    return res.status(200).json({
      success: true,
      message: "Legal page saved successfully",
      data: page,
    });
  } catch (error) {
    console.error("Upsert Legal Page Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save legal page",
    });
  }
}

export async function getAllLegalPagesController(
  req: Request,
  res: Response,
) {
  try {
    const pages = await getAllLegalPagesService();

    return res.status(200).json({
      success: true,
      count: pages.length,
      data: pages,
    });
  } catch (error) {
    console.error("Get All Legal Pages Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get legal pages",
    });
  }
}

export async function getLegalPageByTypeController(
  req: Request,
  res: Response,
) {
  try {
    const { pageType } = req.params;

    /* Param validate — invalid string DB tak nahi jani chahiye */
    const isValidType = Object.values(LegalPageType).includes(
      pageType as LegalPageType,
    );

    if (!isValidType) {
      return res.status(400).json({
        success: false,
        message: "Invalid page type",
      });
    }

    const page = await getLegalPageByTypeService(
      pageType as LegalPageType,
    );

    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Legal page not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: page,
    });
  } catch (error) {
    console.error("Get Legal Page By Type Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get legal page",
    });
  }
}