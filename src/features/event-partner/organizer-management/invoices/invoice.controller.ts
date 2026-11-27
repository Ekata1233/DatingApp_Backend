import { Request, Response } from "express";
import { guestInvoiceDetailsParamsSchema, guestInvoiceDetailsQuerySchema, invoiceQuerySchema } from "./invoice.validation";
import { getGuestInvoiceDetailsService, getInvoicesService } from "./invoice.service";
import { PartnerRequest } from "../../../../types/partnerAuth.types";
import { prisma } from "../../../../prisma/prismaClient";


// export const getGuestInvoicesController = async (
//   req: PartnerRequest,
//   res: Response,
// ) => {
//   try {
//     const businessId = req.partner?.businessId;

//     if (!businessId) {
//       return res.status(403).json({
//         success: false,
//         message: "Organizer business not found",
//       });
//     }

//     const validation =
//       guestInvoiceQuerySchema.safeParse(
//         req.query,
//       );

//     if (!validation.success) {
//       return res.status(400).json({
//         success: false,

//         message:
//           validation.error.issues[0].message,
//       });
//     }

//     const data = await getGuestInvoicesService(
//       businessId,
//       validation.data,
//     );

//     if (!data) {
//       return res.status(404).json({
//         success: false,
//         message: "Business not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Guest invoices fetched successfully",
//       data,
//     });

//   } catch (error) {
//     console.error(
//       "Get guest invoices error:",
//       error,
//     );

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch guest invoices",
//     });
//   }
// };

export const getInvoicesController = async (
  req: PartnerRequest,
  res: Response,
) => {
  try {
    // ==========================================
    // AUTHENTICATED PARTNER
    // ==========================================

    const partnerId =
      req.partner?.id;

    const businessId =
      req.partner?.businessId;

    const role =
      req.partner?.role;

    if (
      !partnerId ||
      !businessId ||
      role !== "ORGANIZER"
    ) {
      return res.status(403).json({
        success: false,

        message:
          "Organizer access is required",
      });
    }

    // ==========================================
    // VALIDATE QUERY
    // ==========================================

    const validation =
      invoiceQuerySchema.safeParse(
        req.query,
      );

    if (!validation.success) {
      return res.status(400).json({
        success: false,

        message:
          validation.error.issues[0].message,
      });
    }

    // ==========================================
    // VALIDATE BUSINESS OWNERSHIP
    // ==========================================

    const business =
      await prisma.businessDetails.findFirst({
        where: {
          id: businessId,

          partnerId,
        },

        select: {
          id: true,
        },
      });

    if (!business) {
      return res.status(403).json({
        success: false,

        message:
          "Access denied to this business",
      });
    }

    // ==========================================
    // CALL COMMON SERVICE
    // ==========================================

    const query = validation.data;

    const data =
      await getInvoicesService(
        businessId,
        query,
      );

    if (!data) {
      return res.status(404).json({
        success: false,

        message:
          "Invoice data not found",
      });
    }

    // ==========================================
    // RESPONSE MESSAGE
    // ==========================================

    const messages = {
      guest:
        "Guest invoices fetched successfully",

      welvors:
        "Welvors invoice summaries fetched successfully",

      "tax-report":
        "Tax report fetched successfully",
    };

    // ==========================================
    // SUCCESS RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      message:
        messages[query.type],

      type:
        query.type,

      data,
    });

  } catch (error) {
    console.error(
      "Get invoices error:",
      error,
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to fetch invoice data",
    });
  }
};


export const getGuestInvoiceDetailsController = async (
  req: PartnerRequest,
  res: Response,
) => {
  try {
    const partnerId = req.partner?.id;
    const businessId = req.partner?.businessId;

    // ==========================================
    // VALIDATE ORGANIZER
    // ==========================================

    if (
      !partnerId ||
      !businessId ||
      req.partner?.role !== "ORGANIZER"
    ) {
      return res.status(403).json({
        success: false,
        message: "Organizer business not found",
      });
    }

    // ==========================================
    // VALIDATE PARAMS
    // ==========================================

    const paramsValidation =
      guestInvoiceDetailsParamsSchema.safeParse(
        req.params,
      );

    if (!paramsValidation.success) {
      return res.status(400).json({
        success: false,

        message:
          paramsValidation.error.issues[0].message,
      });
    }

    // ==========================================
    // VALIDATE QUERY
    // ==========================================

    const queryValidation =
      guestInvoiceDetailsQuerySchema.safeParse(
        req.query,
      );

    if (!queryValidation.success) {
      return res.status(400).json({
        success: false,

        message:
          queryValidation.error.issues[0].message,
      });
    }

    const { eventDateId } = paramsValidation.data;

    // ==========================================
    // CALL SERVICE
    // ==========================================

    const data = await getGuestInvoiceDetailsService(
      businessId,
      eventDateId,
      queryValidation.data,
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Event date not found",
      });
    }

    // ==========================================
    // SUCCESS RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      message:
        "Guest invoice details fetched successfully",

      data,
    });

  } catch (error) {
    console.error(
      "Get guest invoice details error:",
      error,
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to fetch guest invoice details",
    });
  }
};