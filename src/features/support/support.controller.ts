import { Request, Response } from "express";
import { CallbackStatus } from "@prisma/client";

import {
  cancelCallbackService,
  createCallbackService,
  createFaqService,
  deleteFaqService,
  getAdminCallbackByIdService,
  getAdminCallbacksService,
  getAdminFaqsService,
  getFaqsService,
  getUserCallbackHistoryService,
  updateCallbackStatusService,
  updateFaqService,
} from "./support.service";

import {
  createCallbackValidation,
  createFaqValidation,
  updateCallbackStatusValidation,
  updateFaqValidation,
} from "./support.validation";

/* =========================================================
   USER - CREATE CALLBACK
========================================================= */

export const createCallbackController = async (
  req: Request,
  res: Response,
) => {
  try {
   const userId = (req as any).user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const validation =
      createCallbackValidation.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const callback = await createCallbackService(
      userId,
      validation.data,
    );

    return res.status(201).json({
      success: true,
      message: "Callback requested successfully",
      data: callback,
    });
  } catch (error: any) {
    console.error(
      "createCallbackController error:",
      error,
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to request callback",
    });
  }
};

/* =========================================================
   USER - CALLBACK HISTORY
========================================================= */

export const getCallbackHistoryController = async (
  req: Request,
  res: Response,
) => {
  try {
     const userId = (req as any).user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result =
      await getUserCallbackHistoryService(userId);

    return res.status(200).json({
      success: true,
      count: result.count,
      data: result.callbacks,
    });
  } catch (error: any) {
    console.error(
      "getCallbackHistoryController error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch callback history",
    });
  }
};

/* =========================================================
   USER - CANCEL CALLBACK
========================================================= */

export const cancelCallbackController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user.id;

    const id = req.params.id as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const callback =
      await cancelCallbackService(userId, id);

    return res.status(200).json({
      success: true,
      message: "Callback cancelled successfully",
      data: callback,
    });
  } catch (error: any) {
    console.error(
      "cancelCallbackController error:",
      error,
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to cancel callback",
    });
  }
};

/* =========================================================
   USER - GET FAQS
========================================================= */

export const getFaqsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const faqs = await getFaqsService();

    return res.status(200).json({
      success: true,
      count: faqs.length,
      data: faqs,
    });
  } catch (error: any) {
    console.error("getFaqsController error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch FAQs",
    });
  }
};

/* =========================================================
   ADMIN - CALLBACK LIST
========================================================= */

export const getAdminCallbacksController = async (
  req: Request,
  res: Response,
) => {
  try {
    const page = Number(req.query.page || 1);

    const limit = Number(req.query.limit || 20);

    const status = req.query.status as
      | CallbackStatus
      | undefined;

    const search =
      typeof req.query.search === "string"
        ? req.query.search
        : undefined;

    const result = await getAdminCallbacksService({
      page,
      limit,
      status,
      search,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error(
      "getAdminCallbacksController error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch callbacks",
    });
  }
};

/* =========================================================
   ADMIN - CALLBACK DETAIL
========================================================= */

export const getAdminCallbackByIdController = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = req.params.id as string;

    const callback =
      await getAdminCallbackByIdService(id);

    return res.status(200).json({
      success: true,
      data: callback,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message:
        error.message ||
        "Callback request not found",
    });
  }
};

/* =========================================================
   ADMIN - UPDATE CALLBACK STATUS
========================================================= */

export const updateCallbackStatusController = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = req.params.id as string;

    const validation =
      updateCallbackStatusValidation.safeParse(
        req.body,
      );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const callback =
      await updateCallbackStatusService(
        id,
        validation.data,
      );

    return res.status(200).json({
      success: true,
      message: "Callback updated successfully",
      data: callback,
    });
  } catch (error: any) {
    console.error(
      "updateCallbackStatusController error:",
      error,
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to update callback",
    });
  }
};

/* =========================================================
   ADMIN - CREATE FAQ
========================================================= */

export const createFaqController = async (
  req: Request,
  res: Response,
) => {
  try {
    const validation =
      createFaqValidation.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const faq = await createFaqService(
      validation.data,
    );

    return res.status(201).json({
      success: true,
      message: "FAQ created successfully",
      data: faq,
    });
  } catch (error: any) {
    console.error(
      "createFaqController error:",
      error,
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to create FAQ",
    });
  }
};

/* =========================================================
   ADMIN - GET FAQS
========================================================= */

export const getAdminFaqsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const faqs = await getAdminFaqsService();

    return res.status(200).json({
      success: true,
      count: faqs.length,
      data: faqs,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch FAQs",
    });
  }
};

/* =========================================================
   ADMIN - UPDATE FAQ
========================================================= */

export const updateFaqController = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = req.params.id as string;

    const validation =
      updateFaqValidation.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const faq = await updateFaqService(
      id,
      validation.data,
    );

    return res.status(200).json({
      success: true,
      message: "FAQ updated successfully",
      data: faq,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to update FAQ",
    });
  }
};

/* =========================================================
   ADMIN - DELETE FAQ
========================================================= */

export const deleteFaqController = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = req.params.id as string;

    await deleteFaqService(id);

    return res.status(200).json({
      success: true,
      message: "FAQ deleted successfully",
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to delete FAQ",
    });
  }
};