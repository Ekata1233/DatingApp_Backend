// import {
//   Request,
//   Response,
//   NextFunction,
// } from "express";

// import { prisma } from "../prisma/prismaClient";

// import {
//   PartnerRequest,
//   PartnerRole,
// } from "../types/partnerAuth.types";

// export const requirePartnerRole = (
//   requiredRole: PartnerRole,
// ) => {
//   return async (
//     req: Request,
//     res: Response,
//     next: NextFunction,
//   ) => {
//     try {
//       const partner =
//         (req as PartnerRequest).partner;

//       // ========================================
//       // AUTHENTICATION VALIDATION
//       // ========================================

//       if (!partner) {
//         return res.status(401).json({
//           success: false,
//           message: "Partner authentication required",
//         });
//       }

//       // ========================================
//       // ROLE VALIDATION
//       // ========================================

//       if (partner.role !== requiredRole) {
//         return res.status(403).json({
//           success: false,

//           message:
//             `${requiredRole} access required`,
//         });
//       }

//       if (!partner.businessId) {
//         return res.status(403).json({
//           success: false,
//           message: "Business selection is required",
//         });
//       }

//       // ========================================
//       // ORGANIZER ACCESS
//       // ========================================

//       if (requiredRole === "ORGANIZER") {
//         const business =
//           await prisma.businessDetails.findFirst({
//             where: {
//               id: partner.businessId,

//               partnerId: partner.id,
//             },

//             select: {
//               id: true,
//               status: true,
//               onboardingCompleted: true,
//             },
//           });

//         if (!business) {
//           return res.status(403).json({
//             success: false,

//             message:
//               "You are not the organizer of this business",
//           });
//         }

//         if (
//           business.status !== "ACTIVE" ||
//           !business.onboardingCompleted
//         ) {
//           return res.status(403).json({
//             success: false,

//             message:
//               "Business onboarding or approval is pending",
//           });
//         }

//         return next();
//       }

//       // ========================================
//       // HOST ACCESS
//       // ========================================

//       if (requiredRole === "HOST") {
//         const host = await prisma.host.findFirst({
//           where: {
//             partnerId: partner.id,

//             businessId: partner.businessId,

//             status: "ACTIVE",

//             acceptedAt: {
//               not: null,
//             },

//             declinedAt: null,

//             removedAt: null,

//             onboardingCompleted: true,

//             business: {
//               status: "ACTIVE",

//               onboardingCompleted: true,
//             },
//           },

//           select: {
//             id: true,
//             businessId: true,
//           },
//         });

//         if (!host) {
//           return res.status(403).json({
//             success: false,

//             message:
//               "You are not an active host of this business",
//           });
//         }

//         // Attach verified host ID

//         partner.hostId = host.id;

//         return next();
//       }

//       return res.status(403).json({
//         success: false,
//         message: "Invalid partner role",
//       });

//     } catch (error) {
//       console.error(
//         "Partner role validation error:",
//         error,
//       );

//       return res.status(500).json({
//         success: false,
//         message: "Partner role validation failed",
//       });
//     }
//   };
// };

import {
  Request,
  Response,
  NextFunction,
} from "express";

import { prisma } from "../prisma/prismaClient";

import {
  PartnerRequest,
  PartnerRole,
} from "../types/partnerAuth.types";

export const requirePartnerRole = (
  requiredRole: PartnerRole,
  { inferOrganizerBusiness = false } = {},
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const partner = (req as PartnerRequest).partner;

      console.log("partner : ", partner)

      // ========================================
      // AUTHENTICATION VALIDATION
      // ========================================

      if (!partner?.id) {
        return res.status(401).json({
          success: false,
          message: "Partner authentication required",
        });
      }

      // ========================================
      // BUSINESS ID VALIDATION
      // ========================================

      const queryBusinessId = req.query.businessId;

      const routeBusinessId = req.params.businessId;

      const requestedBusinessId =
        queryBusinessId ?? routeBusinessId;

      if (
        requestedBusinessId !== undefined &&
        typeof requestedBusinessId !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid business ID",
        });
      }

      // Prevent switching business scope within a scoped token

      if (
        partner.businessId &&
        requestedBusinessId &&
        partner.businessId !== requestedBusinessId
      ) {
        return res.status(403).json({
          success: false,
          message: "Business does not match selected business",
        });
      }

      let businessId =
        partner.businessId ?? requestedBusinessId;

      if (
        businessId === undefined &&
        inferOrganizerBusiness &&
        requiredRole === "ORGANIZER" &&
        !partner.role
      ) {
        const businesses = await prisma.businessDetails.findMany({
          where: {
            partnerId: partner.id,
            status: "ACTIVE",
            onboardingCompleted: true,
            partner: { accountStatus: "ACTIVE" },
          },
          take: 2,
          select: { id: true },
        });

        if (businesses.length === 0) {
          return res.status(403).json({
            success: false,
            message: "An active business with completed onboarding is required",
          });
        }

        if (businesses.length === 1) {
          businessId = businesses[0].id;
        }
      }

      if (!businessId) {
        return res.status(400).json({
          success: false,
          message: "Business selection is required",
        });
      }

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (!uuidRegex.test(businessId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid business ID",
        });
      }

      // ========================================
      // ORGANIZER ACCESS
      // ========================================

      if (requiredRole === "ORGANIZER") {
        const business =
          await prisma.businessDetails.findFirst({
            where: {
              id: businessId,
              partnerId: partner.id,

              partner: {
                accountStatus: "ACTIVE",
              },
            },

            select: {
              id: true,
              status: true,
              onboardingCompleted: true,
            },
          });

        if (!business) {
          return res.status(403).json({
            success: false,
            message:
              "You are not the organizer of this business",
          });
        }

        if (
          business.status !== "ACTIVE" ||
          !business.onboardingCompleted
        ) {
          return res.status(403).json({
            success: false,
            message:
              "Business onboarding or approval is pending",
          });
        }

        // Attach verified organizer context

        partner.role = "ORGANIZER";
        partner.businessId = business.id;

        return next();
      }

      // ========================================
      // HOST ACCESS
      // ========================================

      if (requiredRole === "HOST") {
        const host = await prisma.host.findFirst({
          where: {
            partnerId: partner.id,
            businessId,

            status: "ACTIVE",

            acceptedAt: {
              not: null,
            },

            declinedAt: null,
            removedAt: null,

            onboardingCompleted: true,

            partner: {
              accountStatus: "ACTIVE",
            },

            business: {
              status: "ACTIVE",
              onboardingCompleted: true,
            },
          },

          select: {
            id: true,
            businessId: true,
          },
        });

        if (!host) {
          return res.status(403).json({
            success: false,
            message:
              "You are not an active host of this business",
          });
        }

        // Attach verified host context

        partner.role = "HOST";
        partner.hostId = host.id;
        partner.businessId = host.businessId;

        return next();
      }

      // ========================================
      // INVALID ROLE
      // ========================================

      return res.status(403).json({
        success: false,
        message: "Invalid partner role",
      });

    } catch (error) {
      console.error(
        "Partner role validation error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message: "Partner role validation failed",
      });
    }
  };
};
